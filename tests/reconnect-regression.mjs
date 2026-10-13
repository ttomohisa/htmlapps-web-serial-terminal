// Reconnection regressions: run with "node --test tests/reconnect-regression.mjs".
// Evaluate the actual inline-app recovery functions with a stub Web Serial API,
// rather than maintaining a second copy of their behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/index.template.html'), 'utf8');
const start = source.indexOf('      function getPortUsbIdentifiers(port) {');
const end = source.indexOf('      async function loadPermittedPort() {', start);
assert.ok(start >= 0 && end > start, 'Reconnect helper source must exist');
const helpers = source.slice(start, end);

function port(vendor, product) {
  return { getInfo() { return { usbVendorId: vendor, usbProductId: product }; } };
}

function harness(oldPort, ports, overrides = {}) {
  const state = {
    unexpectedDisconnect: true,
    port: oldPort,
    reconnectGeneration: 7,
    reconnectChecking: false,
    devicePhysicallyAvailable: false,
  };
  const effects = { phases: [], labels: [], toasts: [] };
  const context = {
    state,
    navigator: { serial: { getPorts: async () => ports } },
    setPhase(value) { effects.phases.push(value); },
    refreshDeviceLabel(value) { effects.labels.push(value); },
    showToast(value) { effects.toasts.push(value); },
    t(value) { return value; },
  };
  Object.assign(context, overrides);
  vm.runInNewContext(helpers + '\nthis.reconnect = { selectReconnectCandidate, refreshReconnectPort };', context);
  return { ...context.reconnect, state, effects };
}

test('uses exact permitted port when object identity survives', () => {
  const selected = port(0x2E8A, 0x000A);
  const ctx = harness(selected, [selected]);
  const result = ctx.selectReconnectCandidate(selected, [selected]);
  assert.equal(result.status, 'found');
  assert.equal(result.port, selected);
});

test('accepts a unique re-enumerated USB port with matching vendor/product', async () => {
  const oldPort = port(0x2E8A, 0x000A);
  const newPort = port(0x2E8A, 0x000A);
  const ctx = harness(oldPort, [newPort]);
  assert.equal(await ctx.refreshReconnectPort({ announce: true }), 'found');
  assert.equal(ctx.state.port, newPort);
  assert.equal(ctx.state.devicePhysicallyAvailable, true);
  assert.deepEqual(ctx.effects.phases, ['deviceSelected']);
  assert.deepEqual(ctx.effects.labels, ['permittedDevice']);
  assert.deepEqual(ctx.effects.toasts, ['reconnectedAvailable']);
});

test('never chooses from ambiguous matching USB devices', async () => {
  const oldPort = port(0x2E8A, 0x000A);
  const ctx = harness(oldPort, [port(0x2E8A, 0x000A), port(0x2E8A, 0x000A)]);
  assert.equal(await ctx.refreshReconnectPort({ reportFailure: true }), 'ambiguous');
  assert.equal(ctx.state.port, oldPort);
  assert.equal(ctx.state.devicePhysicallyAvailable, false);
  assert.deepEqual(ctx.effects.toasts, ['reconnectAmbiguous']);
});

test('does not substitute an unrelated USB device', async () => {
  const oldPort = port(0x2E8A, 0x000A);
  const ctx = harness(oldPort, [port(0x0403, 0x6001)]);
  assert.equal(await ctx.refreshReconnectPort({ reportFailure: true }), 'notFound');
  assert.equal(ctx.state.port, oldPort);
  assert.deepEqual(ctx.effects.toasts, ['reconnectNotFound']);
});

test('does not guess when old device has no usable identifiers', async () => {
  const previous = { getInfo() { return {}; } };
  const ctx = harness(previous, [port(0x2E8A, 0x000A)]);
  assert.equal(await ctx.refreshReconnectPort({ reportFailure: true }), 'unidentified');
  assert.equal(ctx.state.port, previous);
  assert.deepEqual(ctx.effects.toasts, ['reconnectUnidentified']);
});

test('leaves recovery retryable when no permitted ports are connected', async () => {
  const oldPort = port(0x2E8A, 0x000A);
  const ctx = harness(oldPort, []);
  assert.equal(await ctx.refreshReconnectPort({ reportFailure: true }), 'notFound');
  assert.equal(ctx.state.unexpectedDisconnect, true);
  assert.deepEqual(ctx.effects.toasts, ['reconnectNotFound']);
});

test('ignores stale discovery after port is chosen manually', async () => {
  let complete;
  const promise = new Promise(resolve => { complete = resolve; });
  const oldPort = port(0x2E8A, 0x000A);
  const changedPort = port(0x0403, 0x6001);
  const ctx = harness(oldPort, [], { navigator: { serial: { getPorts: () => promise } } });
  const task = ctx.refreshReconnectPort({ announce: true });
  ctx.state.port = changedPort;
  ctx.state.reconnectGeneration += 1;
  ctx.state.unexpectedDisconnect = false;
  complete([port(0x2E8A, 0x000A)]);
  assert.equal(await task, 'stale');
  assert.equal(ctx.state.port, changedPort);
  assert.deepEqual(ctx.effects.phases, []);
  assert.deepEqual(ctx.effects.toasts, []);
});

test('reports serial port lookup error without changing selected port', async () => {
  const oldPort = port(0x2E8A, 0x000A);
  const ctx = harness(oldPort, [], { navigator: { serial: { async getPorts() { throw new Error('permission problem'); } } } });
  assert.equal(await ctx.refreshReconnectPort({ reportFailure: true }), 'error');
  assert.equal(ctx.state.port, oldPort);
  assert.deepEqual(ctx.effects.toasts, ['reconnectLookupFailed']);
});

test('reconnect button is not gated on a connect event flag', () => {
  assert.match(source, /\$\('#connectButton'\)\.disabled\s*=\s*!supported\s*\|\|\s*!state\.port\s*\|\|\s*busy\s*\|\|\s*connected;/);
  assert.match(source, /if \(state\.unexpectedDisconnect\) \{[\s\S]*?await refreshReconnectPort\(\{ reportFailure: true \}\)/);
});
