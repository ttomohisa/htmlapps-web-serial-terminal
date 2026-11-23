'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.resolve(__dirname,'../src/index.template.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
function source(from,to) {
  const a=script.indexOf(from),b=script.indexOf(to,a);
  assert.ok(a>=0&&b>a,'missing source boundary: '+from);
  return script.slice(a,b);
}
function formatter({displayMode='text',showTimestamp=false,localEcho=false,filterQuery='',filterMode='highlight'}={}) {
  const state={displayMode,showTimestamp,localEcho,filterQuery,filterMode};
  const ctx={
    state,Uint8Array,
    formatDisplayTime:()=> '12:34:56.123',
    bytesToHex:(bytes)=>Array.from(bytes,x=>x.toString(16).toUpperCase().padStart(2,'0')).join(' '),
    MAX_HIGHLIGHT_MATCHES:400
  };
  vm.runInNewContext(source('      function newDisplayAssembler() {','      function countLineBreaks(text) {')+
    '\nthis.api={newDisplayAssembler,formatDisplayEntry,filterDisplayText};',ctx);
  return {state, ...ctx.api};
}
function entry(direction,text,bytes=[]) {return {direction,text,bytes:Uint8Array.from(bytes),time:0,displayText:''};}

test('RX line labels are emitted once per logical line across chunk boundaries',()=>{
  const f=formatter({showTimestamp:true}),a=f.newDisplayAssembler();
  const result=[
    f.formatDisplayEntry(entry('rx','HE'),a),
    f.formatDisplayEntry(entry('rx','LLO\r'),a),
    f.formatDisplayEntry(entry('rx','\nERR'),a),
    f.formatDisplayEntry(entry('rx','OR\n'),a)
  ].join('');
  assert.equal(result,'12:34:56.123  RX  HELLO\n12:34:56.123  RX  ERROR\n');
});

test('unprefixed Text display normalizes CR, LF, CRLF split across reads',()=>{
  const f=formatter(),a=f.newDisplayAssembler();
  const result=['first\r','\nsecond\n','third\r','fourth\n'].map(x=>f.formatDisplayEntry(entry('rx',x),a)).join('');
  assert.equal(result,'first\nsecond\nthird\nfourth\n');
});

test('UTF-8 split across reads stays intact, raw bytes are not decoded again',()=>{
  const decoder=new TextDecoder(),a=formatter({showTimestamp:true}),ctx=a.newDisplayAssembler();
  const first=decoder.decode(Uint8Array.of(0xE3,0x81),{stream:true});
  const second=decoder.decode(Uint8Array.of(0x82,0x0A),{stream:true});
  const result=a.formatDisplayEntry(entry('rx',first,[0xE3,0x81]),ctx)+
    a.formatDisplayEntry(entry('rx',second,[0x82,0x0A]),ctx);
  assert.equal(result,'12:34:56.123  RX  あ\n');
});

test('local echo, markers and RX fragments do not run into each other',()=>{
  const f=formatter({localEcho:true}),ctx=f.newDisplayAssembler();
  const result=[
    f.formatDisplayEntry(entry('rx','incomplete'),ctx),
    f.formatDisplayEntry(entry('tx','PING\n',[80,73,78,71,10]),ctx),
    f.formatDisplayEntry(entry('rx','new'),ctx),
    f.formatDisplayEntry(entry('marker','Pressed the button'),ctx),
    f.formatDisplayEntry(entry('rx','done\n'),ctx)
  ].join('');
  assert.equal(result,'RX  incomplete\nTX  PING\nRX  new\n── 12:34:56.123  Pressed the button ──\nRX  done\n');
});

test('HEX mode still renders the exact received bytes even when TextDecoder yields no text',()=>{
  const f=formatter({displayMode:'hex'}),ctx=f.newDisplayAssembler();
  assert.equal(f.formatDisplayEntry(entry('rx','',[0,1,127,255]),ctx),'RX  00 01 7F FF\n');
});

test('matching-only filter preserves markers and never changes full log history',()=>{
  const f=formatter({filterQuery:'error',filterMode:'only'});
  const original='boot\nERROR: failed\nok\n── 12:34:56.123  reset ──\n';
  const result=f.filterDisplayText(original);
  assert.equal(result.text,'ERROR: failed\n── 12:34:56.123  reset ──');
  assert.equal(result.matches,1);
  f.state.filterMode='highlight';
  const highlighted=f.filterDisplayText(original);
  assert.equal(highlighted.text,original);
  assert.equal(highlighted.matches,1);
});

test('markers are stored as notes with zero bytes and do not affect RX/TX counters',()=>{
  const f=formatter();
  const state={
    rxBytes:5,txBytes:8,terminalRevision:0,
    filterQuery:'',filterMode:'highlight',
    displayAssembler:f.newDisplayAssembler(),
    localEcho:false
  };
  const added=[],saved=[],rendered=[];
  const ctx={
    state,Uint8Array,Date,
    appendDisplayEntry:x=>added.push(x),
    recordSessionEntry:x=>{saved.push(x);return true;},
    formatDisplayEntry:f.formatDisplayEntry,
    queueTerminalAppend:x=>rendered.push(x),
    updateIoStats(){},updateTerminalControls(){},scheduleFilterRefresh(){}
  };
  vm.runInNewContext(source('      function addSessionEntry(direction, bytes, text, displayText) {',
    '      function updateTerminalControls() {')+'\nthis.addSessionEntry=addSessionEntry;',ctx);
  assert.equal(ctx.addSessionEntry('marker',new Uint8Array(),'Checked the LED'),true);
  assert.equal(state.txBytes,8);
  assert.equal(state.rxBytes,5);
  assert.equal(saved.length,1);
  assert.equal(saved[0].direction,'marker');
  assert.equal(saved[0].bytes.byteLength,0);
  assert.match(rendered.join(''),/Checked the LED/);
});

test('UI contains connection steps, send preview, accessible filter and marker dialog',()=>{
  for(const id of ['connectionGuide','sendPreview','filterTerminalButton','terminalFilter','filterQuery',
    'filterMode','filterCount','addMarkerButton','markerDialog','markerInput','markerForm']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(script,/const valid = refreshSendPreview\(\)/);
  assert.match(script,/state\.filterMode === 'only'/);
  assert.ok(html.includes('.workspace[data-connection-step="choose"] #chooseButton'));
  assert.match(html,/helpNewLogFeatures/);
});

test('timestamped marker notes are faithfully exported to TXT and JSONL',()=>{
  const state={sessionEntries:[{
    time:Date.UTC(2026,10,24),direction:'marker',bytes:new Uint8Array(),text:'Checked the LED'
  }]};
  const ctx={
    state,Date,TextDecoder,Uint8Array,JSON,
    formatFileTime:()=> '2026-11-24 00:00:00',
    bytesToHex:()=> '',
    escapeLogText:text=>text
  };
  vm.runInNewContext(source('      function isReadableLogText(text) {','      function logFilename(extension) {')+
    '\nthis.exportLog={buildTxtLogParts,buildJsonlLogParts};',ctx);
  const txt=ctx.exportLog.buildTxtLogParts().join('');
  assert.match(txt,/MARKER Checked the LED/);
  assert.doesNotMatch(txt,/HEX/);
  const jsonl=JSON.parse(ctx.exportLog.buildJsonlLogParts()[0]);
  assert.equal(jsonl.direction,'marker');
  assert.equal(jsonl.text,'Checked the LED');
  assert.equal(jsonl.bytes,'');
  state.sessionEntries.push({time:Date.UTC(2026,10,24),direction:'marker',
    bytes:new Uint8Array(),text:'A�B'});
  assert.match(ctx.exportLog.buildTxtLogParts().join(''),/MARKER A�B/);
});

test('visible toast actions accept pointer input for Undo',()=>{
  const style=html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(style,/\.toast\.show\s*\{[^}]*pointer-events:\s*auto;/);
});

test('filter matches are literal, Unicode-safe, and do not shift original string offsets',()=>{
 const ctx={};
 vm.runInNewContext(source('      function literalMatchRegex(query, global) {',
    '      function filterDisplayText(fullText) {')+'\nthis.literalMatchRegex=literalMatchRegex;',ctx);
 for (const needle of ['[ERR]+','a.b','(X)','^','\\']) {
   const sample='prefix '+needle+' suffix';
   const match=ctx.literalMatchRegex(needle,true).exec(sample);
   assert.equal(match?.index,7,'literal match position for '+needle);
   assert.equal(match[0],needle);
 }
 assert.equal(ctx.literalMatchRegex('X',true).exec('İX')[0],'X');
 assert.equal(ctx.literalMatchRegex('X',true).exec('İX').index,1,'Unicode casefold must not move offsets');
 const f=formatter({filterQuery:'[ERR]+',filterMode:'only'});
 assert.equal(f.filterDisplayText('INFO\n[ERR]+ bad\nok\n').text,'[ERR]+ bad');
});
test('filename customization removes unsafe filesystem characters and reserved names',()=>{
 const ctx={Date,$:()=>({value:''})};
 vm.runInNewContext(source('      function normalizeLogBaseFilename(value) {',
    '      function downloadLog(parts, extension, mime) {')+'\nthis.api={normalizeLogBaseFilename,logFilename};',ctx);
 assert.equal(ctx.api.normalizeLogBaseFilename('report/error:?*.txt'),'report-error---.txt');
 assert.equal(ctx.api.normalizeLogBaseFilename('CON'),'_CON');
 assert.equal(ctx.api.normalizeLogBaseFilename('.....'),'');
 assert.equal(ctx.api.normalizeLogBaseFilename('a'.repeat(150)).length,100);
 ctx.$=()=>({value:'report/error?.jsonl'});
 assert.equal(ctx.api.logFilename('txt'),'report-error-.txt');
 ctx.$=()=>({value:'CON.txt'});
 assert.equal(ctx.api.logFilename('jsonl'),'_CON.jsonl');
 ctx.$=()=>({value:' report.txt '});
 assert.equal(ctx.api.logFilename('jsonl'),'report.jsonl');
 ctx.$=()=>({value:'..'});
 assert.match(ctx.api.logFilename('txt'),/^serial-log-\d{8}-\d{6}\.txt$/);
});
