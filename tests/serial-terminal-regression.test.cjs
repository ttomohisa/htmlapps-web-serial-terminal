'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { TextDecoder, TextEncoder } = require('node:util');
const vm = require('node:vm');

const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'src/index.template.html'), 'utf8');
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

function section(from, to) {
  const start = script.indexOf(from);
  const end = script.indexOf(to, start);
  assert.ok(start >= 0 && end > start, 'Missing source function: ' + from);
  return script.slice(start, end);
}

const writeFunctions = section('      async function writeSerialBytes(bytes) {', '      async function copyTerminal() {');
const macroFunction = section('      async function executeMacro(macroId) {', '      function formatByteCount(value) {');
const controlFunction = section('      async function sendControlByte(byteValue, label) {', '      function setPhase(phase) {');

function serialHarness() {
  const input = { value: 'PING', focus() {} };
  const elements = {
    '#commandInput': input,
    '#lineEnding': { value: 'none' },
    '#sendMode': { value: 'text' },
    '#sendError': { textContent: '' },
    '#sendButton': { disabled: false }
  };
  const deferred = [];
  const sent = [];
  const records = [];
  const state = {
    phase: 'connected',
    settings: {},
    txBusy: false,
    macroSending: false,
    commandInputRevision: 0,
    macros: [{ id: 'm', name: 'Macro', mode: 'text', payload: 'MACRO', lineEnding: 'none' }],
    writer: {
      write(bytes) {
        sent.push(Array.from(bytes));
        return new Promise(resolve => deferred.push(resolve));
      }
    }
  };
  const ctx = {
    state,
    $: selector => elements[selector],
    TextDecoder,
    TextEncoder,
    Uint8Array,
    encoder: new TextEncoder(),
    parseHexInput: () => new Uint8Array(),
    endingBytes: () => '',
    persistSettings() {},
    refreshSendNote() {},
    clearError() {},
    updateSendState() {
      elements['#sendButton'].disabled = state.txBusy || !input.value;
    },
    updateMacroRunState() {},
    updateDeviceControlUi() {},
    addSessionEntry: (direction, bytes, text) => records.push({ direction, bytes: Array.from(bytes), text }),
    rememberCommand() {},
    setNotice() {},
    t: key => key,
    technicalSuffix: () => '',
    showToast() {}
  };
  vm.runInNewContext(writeFunctions + '\n' + macroFunction + '\n' + controlFunction +
    '\nthis.api = { sendCommand, executeMacro, sendControlByte };', ctx);
  return { ...ctx.api, state, input, deferred, sent, records, elements };
}

test('double Enter cannot trigger duplicate writes while first TX is pending', async () => {
  const h = serialHarness();
  const first = h.sendCommand();
  const second = h.sendCommand();
  assert.equal(h.sent.length, 1);
  assert.equal(h.elements['#sendButton'].disabled, true);
  h.deferred[0]();
  await Promise.all([first, second]);
  assert.equal(h.records.length, 1);
  assert.equal(h.input.value, '');
  assert.equal(h.state.txBusy, false);
});

test('draft edited during an in-flight write survives completion', async () => {
  const h = serialHarness();
  const pending = h.sendCommand();
  h.input.value = 'NEXT';
  h.state.commandInputRevision += 1;
  h.deferred[0]();
  await pending;
  assert.equal(h.input.value, 'NEXT');
  assert.deepEqual(h.sent, [[80, 73, 78, 71]]);
});

test('macros and control keys share the same TX guard', async () => {
  const h = serialHarness();
  const macro = h.executeMacro('m');
  await h.sendControlByte(3, 'Ctrl+C');
  await h.sendCommand();
  assert.equal(h.sent.length, 1);
  h.deferred[0]();
  await macro;
  assert.equal(h.records.length, 1);
  assert.equal(h.state.txBusy, false);
  const control = h.sendControlByte(3, 'Ctrl+C');
  assert.equal(h.sent.length, 2);
  h.deferred[1]();
  await control;
  assert.equal(h.records.length, 2);
  assert.deepEqual(h.sent[1], [3]);
});

test('RX JSONL text uses streaming decoded characters and keeps exact bytes', () => {
  const entries = [
    { time: 0, direction: 'rx', bytes: new Uint8Array([0xE3, 0x81]), text: '' },
    { time: 1, direction: 'rx', bytes: new Uint8Array([0x82]), text: 'あ' },
    { time: 2, direction: 'tx', bytes: new Uint8Array([0x0A]), text: '\n' }
  ];
  const ctx = {
    state: { sessionEntries: entries },
    TextDecoder, Date, JSON,
    bytesToHex(bytes, compact) {
      return Array.from(bytes, x => x.toString(16).toUpperCase().padStart(2, '0')).join(compact ? '' : ' ');
    },
    formatFileTime: () => 'time',
    escapeLogText: value => value.replace(/\n/g, '\\n')
  };
  vm.runInNewContext(section('      function isReadableLogText(text) {', '      function logFilename(extension) {') +
    '\nthis.exports = { buildTxtLogParts, buildJsonlLogParts };', ctx);
  const jsonl = Array.from(ctx.exports.buildJsonlLogParts(), line => JSON.parse(line));
  assert.deepEqual(jsonl.map(item => item.bytes), ['E381', '82', '0A']);
  assert.equal(jsonl.map(item => item.text).join(''), 'あ\n');
  assert.ok(!jsonl.some(item => item.text.includes('�')));
  const txt = ctx.exports.buildTxtLogParts().join('');
  assert.match(txt, /RX あ/);
  assert.doesNotMatch(txt, /�/);
});

test('live terminal search uses one bounded refresh timer and does not force selection', () => {
  const callbacks = [];
  const refreshes = [];
  const state = { searchQuery: 'ERROR', searchRefreshTimer: 0 };
  const ctx = {
    state,
    SEARCH_REFRESH_INTERVAL_MS: 350,
    window: {
      setTimeout(fn, delay) {
        assert.equal(delay, 350);
        callbacks.push(fn);
        return callbacks.length;
      }
    },
    updateSearchMatches: options => refreshes.push(options)
  };
  vm.runInNewContext(section('      function scheduleSearchRefresh() {', '      function selectSearchMatch() {') +
    '\nthis.schedule = scheduleSearchRefresh;', ctx);
  ctx.schedule();
  ctx.schedule();
  assert.equal(callbacks.length, 1);
  callbacks[0]();
  assert.equal(refreshes.length, 1);
  assert.equal(refreshes[0].skipSelection, true);
  assert.equal(state.searchRefreshTimer, 0);
  assert.match(section('      function flushTerminalRender() {', '      function queueTerminalAppend(text) {'),
    /scheduleSearchRefresh\(\)/);
});

test('Clear Undo remains usable when new RX data arrives', () => {
  const original = [{}, {}];
  const state = {
    terminalText: 'old text',
    displayEntries: original.slice(),
    displayStartIndex: 0,
    clearUndoGeneration: 0,
    terminalRevision: 0,
    language: 'ja'
  };
  const messages = [];
  let undo;
  const ctx = {
    state,
    flushTerminalRender() {},
    resetNewLogCount() {},
    renderTerminal() {
      state.terminalText = state.displayStartIndex >= state.displayEntries.length ? '' : 'visible';
    },
    AppToast: { show(options) { undo = options.onAction; } },
    t: x => x,
    showToast: x => messages.push(x)
  };
  vm.runInNewContext(section('      function clearTerminal() {', '      function isReadableLogText(text) {') +
    '\nthis.clearTerminal = clearTerminal;', ctx);
  ctx.clearTerminal();
  assert.equal(state.displayStartIndex, 2);
  state.displayEntries.push({});
  state.terminalRevision += 1;
  undo();
  assert.equal(state.displayStartIndex, 0);
  assert.deepEqual(messages, ['restoredTerminal']);
});

test('CI includes mobile layout check and live-serial regressions', () => {
  for (const workflow of ['build-standalone.yml', 'deploy-pages.yml']) {
    const yaml = readFileSync(resolve(root, '.github/workflows', workflow), 'utf8');
    assert.match(yaml, /tests\/mobile-build-info\.test\.cjs/);
    assert.match(yaml, /tests\/serial-terminal-regression\.test\.cjs/);
  }
});
