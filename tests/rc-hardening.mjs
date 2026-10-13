import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'src/index.template.html'), 'utf8');
const config = JSON.parse(readFileSync(resolve(root, 'app.config.json'), 'utf8'));
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

function exactSource(from, to) {
  const start = script.indexOf(from);
  const end = script.indexOf(to, start);
  assert.ok(start >= 0 && end > start, 'Could not find app source boundaries: ' + from);
  return script.slice(start, end);
}

test('release metadata and source JavaScript parse', () => {
  assert.equal(config.version, '1.0.0');
  assert.match(html, /id="versionBadge">v1\.0\.0<\/span>/);
  assert.doesNotThrow(() => new Function(script));
});

test('help dialog scroll lock restores saved scroll position, including repeated calls', () => {
  const cssVars = {};
  const bodyClasses = new Set();
  const htmlClasses = new Set();
  const scrollCalls = [];
  const makeClasses = collection => ({
    add: key => collection.add(key),
    remove: key => collection.delete(key)
  });
  const context = {
    window: { scrollY: 620, pageYOffset: 620, scrollTo: (...args) => scrollCalls.push(args) },
    document: {
      body: {
        style: {
          setProperty: (key, val) => { cssVars[key] = val; },
          removeProperty: key => { delete cssVars[key]; }
        },
        classList: makeClasses(bodyClasses)
      },
      documentElement: { classList: makeClasses(htmlClasses) }
    }
  };
  const helpers = exactSource('      let helpBackgroundScrollY = null;', "      $('#helpButton').addEventListener");
  vm.runInNewContext(helpers + '\nthis.actions = { lockHelpBackgroundScroll, unlockHelpBackgroundScroll };', context);
  context.actions.lockHelpBackgroundScroll();
  assert.equal(cssVars['--help-scroll-offset'], '-620px');
  assert.ok(bodyClasses.has('help-scroll-locked'));
  assert.ok(htmlClasses.has('help-scroll-locked'));
  context.window.scrollY = 900;
  context.actions.lockHelpBackgroundScroll(); // never overwrite the original scroll position
  assert.equal(cssVars['--help-scroll-offset'], '-620px');
  context.actions.unlockHelpBackgroundScroll();
  assert.deepEqual(scrollCalls, [[0, 620]]);
  assert.equal(cssVars['--help-scroll-offset'], undefined);
  assert.equal(bodyClasses.size, 0);
  assert.equal(htmlClasses.size, 0);
  context.actions.unlockHelpBackgroundScroll();
  assert.equal(scrollCalls.length, 1);
});

test('help dialog Escape, explicit close and backdrop share the close event cleanup', () => {
  assert.match(script, /helpDialog\.addEventListener\('close', unlockHelpBackgroundScroll\)/);
  assert.match(script, /\$\('#closeHelpButton'\)\.addEventListener\('click', \(\) => helpDialog\.close\(\)\)/);
  assert.match(script, /if \(outside\) helpDialog\.close\(\)/);
  assert.match(script, /helpDialog\.showModal\(\)/);
  assert.match(html, /html\.help-scroll-locked\s*\{\s*overflow:\s*hidden/);
  assert.match(html, /body\.help-scroll-locked\s*\{\s*position:\s*fixed/);
  assert.match(html, /\.dialog-body\s*\{[^}]*overflow:\s*auto/s);
});

test('language switch shows EN on Japanese UI and JA on English UI', () => {
  assert.match(script, /\$\('#languageButton'\)\.textContent\s*=\s*state\.language\s*===\s*'ja'\s*\?\s*'EN'\s*:\s*'JA'/);
});

test('local processing badge agrees with actual no-network deployment rules', () => {
  assert.equal(config.build.blockRuntimeNetwork, true);
  assert.match(html, /connect-src\s+'none'/);
  assert.match(html, /form-action\s+'none'/);
  assert.match(html, /data-i18n="privacyBadge">完全ローカル処理<\/span>/);
  assert.match(script, /privacyBadge:\s*'Fully local processing'/);
  assert.match(script, /privacyBadge:\s*'完全ローカル処理'/);
  assert.match(script, /helpPrivacyBody:[^\n]*HTML/);
  for (const risky of [
    /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\s*\(/,
    /\bEventSource\s*\(/, /\bsendBeacon\s*\(/,
    /\bnavigator\.serviceWorker\b/
  ]) {
    assert.doesNotMatch(script, risky, 'Unexpected runtime network API in app script');
  }
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//);
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:\/\//);
});

test('log export errors during serialization are surfaced, not uncaught', () => {
  const source = exactSource('      function saveTxtLog() {', '      function clearSessionLog() {');
  for (const kind of ['Txt', 'Jsonl']) {
    const toasts = [];
    const context = {
      t: key => key,
      showToast: (msg, duration) => toasts.push([msg, duration]),
      buildTxtLogParts: () => { throw Error('out of memory'); },
      buildJsonlLogParts: () => { throw Error('out of memory'); },
      downloadLog: () => { throw Error('should not be reached'); }
    };
    vm.runInNewContext(source + '\nthis.exports = { saveTxtLog, saveJsonlLog };', context);
    assert.doesNotThrow(() => context.exports['save' + kind + 'Log']());
    assert.deepEqual(toasts, [['saveFailed', 4300]]);
  }
});
