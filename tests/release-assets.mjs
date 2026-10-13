import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const file=p=>readFileSync(join(root,p));
const string=p=>file(p).toString('utf8');
test('v1 metadata, HTML, and icon',()=>{
 const config=JSON.parse(string('app.config.json'));
 const html=string('src/index.template.html');
 const icon=string('assets/favicon.svg');
 assert.equal(config.version,'1.0.0');
 assert.equal(config.build.blockRuntimeNetwork,true);
 assert.match(html,/id="versionBadge">v1\.0\.0<\/span>/);
 assert.match(html,/connect-src\s+'none'/);
 assert.match(icon,/viewBox="0 0 64 64"/);
 assert.match(icon,/rx="16"/);
 assert.match(icon,/#16624f/i);
 assert.equal([...html.matchAll(/__APP_ICON_DATA_URI__/g)].length,2);
 assert.match(html,/\.composer \.send-mode \{ grid-column: 1; grid-row: 2; \}/);
 assert.match(string('APP_SPEC.md'),/Current implementation milestone: v1\.0\.0/);
 const inline=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
 assert.doesNotThrow(()=>new Function(inline));
 const keys=[...new Set([
  ...[...html.matchAll(/data-i18n(?:-(?:title|aria-label|placeholder))?="([^"]+)"/g)].map(m=>m[1]),
  ...[...inline.matchAll(/\bt\('([^']+)'\)/g)].map(m=>m[1])
 ])];
 const ja=inline.slice(inline.indexOf('ja: {'),inline.indexOf('en: {'));
 const en=inline.slice(inline.indexOf('en: {'),inline.indexOf('\n        }\n      };',inline.indexOf('en: {'))+12);
 assert.ok(keys.length>=145);
 for(const [lang,source] of [['JA',ja],['EN',en]]){
  const absent=keys.filter(k=>!source.includes(k+':'));
  assert.deepEqual(absent,[],lang+' translation coverage');
 }
});
test('four distinct real screenshot assets',()=>{
 const names=[
  ['assets/screenshot.png',1440,850],['assets/screenshot-en.png',1440,850],
  ['assets/screenshot-mobile.png',390,900],['assets/screenshot-mobile-en.png',390,900]
 ];
 const hashes=[];
 for(const [path,width,minHeight] of names){
  const data=file(path);
  assert.ok(data.length>25000,path+' too small');
  assert.ok(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  assert.equal(data.readUInt32BE(16),width);
  assert.ok(data.readUInt32BE(20)>=minHeight,path+' height too small');
  hashes.push(createHash('sha256').update(data).digest('hex'));
 }
 assert.equal(new Set(hashes).size,names.length);
});
test('bilingual docs describe actual generated output and screenshot variants',()=>{
 const en=string('README.md'),ja=string('README.ja.md');
 assert.match(en,/assets\/screenshot-en\.png/);
 assert.match(en,/assets\/screenshot-mobile-en\.png/);
 assert.match(ja,/assets\/screenshot\.png/);
 assert.match(ja,/assets\/screenshot-mobile\.png/);
 for(const s of [en,ja]){
  for(const term of ['dist/index.html','dist/index.self-extract.html','web-serial-terminal.html','v1.0.0']){
    if(term==='v1.0.0') assert.match(s,/1\.0\.0/);
    else assert.ok(s.includes(term));
  }
  assert.doesNotMatch(s,/Single HTML App Template|スターター作業領域/);
 }
 assert.match(string('README-FIRST.txt'),/Web Serial Terminal v1\.0\.0/);
 assert.match(string('THIRD_PARTY_NOTICES.md'),/No bundled third-party runtime/i);
});
