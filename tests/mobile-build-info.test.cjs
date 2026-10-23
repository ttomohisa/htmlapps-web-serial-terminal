const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../src/index.template.html'),'utf8');
function media(bp){const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];const start=css.search(new RegExp('@media\\s*\\(max-width:\\s*'+bp+'px\\)\\s*\\{'));assert.ok(start>=0);const open=css.indexOf('{',start);let depth=1,end=open+1;for(;end<css.length&&depth;end++){if(css[end]==='{')depth++;if(css[end]==='}')depth--;}return css.slice(open+1,end-1);}
function helpBody(cls){const help=html.match(/<dialog[^>]*id="helpDialog"[^>]*>([\s\S]*?)<\/dialog>/)[1];const start=help.indexOf('<div class="'+cls+'"');assert.ok(start>=0);let depth=0,end=-1;for(const m of help.slice(start).matchAll(/<div\b[^>]*>|<\/div>/g)){depth+=m[0].startsWith('</')?-1:1;if(depth===0){end=start+m.index;break;}}return help.slice(start,end);}
test('only informational footer hides at existing 760px mobile workflow',()=>assert.match(media(760),/(?:^|})\s*footer\s*\{\s*display:\s*none;?\s*\}/));
test('exact build span is final Help item; mobile hiding and functional status remain',()=>{
 const block='<span class="build-meta" id="buildMeta"></span>';assert.equal(html.split(block).length-1,1);const body=helpBody('dialog-body');assert.ok(body.includes(block));assert.match(body.slice(body.indexOf(block)+block.length),/^\s*(?:<!--[^]*?-->\s*)?$/);assert.match(media(760),/\.build-meta\s*\{\s*display:\s*none;/);
 const main=html.match(/<main\b[^>]*>([^]*?)<\/main>/)[1];assert.doesNotMatch(main,/id="buildMeta"/);for(const id of ['statusText','connectionDuration','ioStats','logStatus','saveTxtButton','saveJsonlButton','clearSessionLogButton'])assert.match(main,new RegExp('id="'+id+'"'));
});
