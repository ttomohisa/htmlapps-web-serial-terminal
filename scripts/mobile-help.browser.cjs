'use strict';
// Bounded native CI regression. No physical serial or camera permissions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const cfg={"slug": "web-serial-terminal", "bp": 760, "meta": "buildMeta", "badgeKey": "privacyBadge", "badge": ".privacy-note", "body": "#helpDialog > .dialog-body", "head": "#helpDialog > .dialog-head", "close": "#closeHelpButton", "mobileHidden": true, "mobileFinal": "#helpDialog [data-i18n=\"helpFixed\"]"};
const results=path.resolve(__dirname,'../test-results/mobile-help');
async function bounds(locator,width,height,label,vertical=true){const r=await locator.boundingBox();assert.ok(r&&r.x>=0&&r.x+r.width<=width+1&&(!vertical||(r.y>=0&&r.y+r.height<=height+1)),label+': bounds '+JSON.stringify(r));}
async function smoke(page,file){
 await page.locator('#macroPanel > summary').click();await page.locator('#addMacroButton').click();await page.locator('#macroNameInput').fill('Synthetic command');await page.locator('#macroPayloadInput').fill('status');await page.locator('#saveMacroButton').click();assert.equal(await page.locator('#macroList .macro-name').textContent(),'Synthetic command');assert.equal(await page.locator('[data-macro-run]').isEnabled(),false,'No serial device opened');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#macroSummary')?.textContent==='1 / 12');await page.locator('#macroPanel > summary').click();assert.equal(await page.locator('#macroList .macro-name').textContent(),'Synthetic command');assert.equal(await page.locator('[data-macro-run]').isEnabled(),false);assert.equal(await page.locator('#saveTxtButton').isEnabled(),false);assert.equal(await page.locator('#saveJsonlButton').isEnabled(),false);console.log('PASS synthetic disconnected macro save/reload '+file);
}

async function main(){
 fs.mkdirSync(results,{recursive:true});const browser=await chromium.launch();
 try{for(const file of ['dist/index.html','dist/index.self-extract.html',cfg.slug+'.html'])for(const language of ['ja','en'])for(const [width,height] of [[1360,900],[cfg.bp+1,568],[cfg.bp,568],[360,640],[320,568],[393,252]]){
  const context=await browser.newContext({viewport:{width,height},locale:language,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[],diagnostics=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'){if(cfg.slug==='passage-counter'&&m.text()==='INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')diagnostics.push(m.text());else errors.push(m.text());}});page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const label=`${file} ${language} ${width}x${height}`;
  try{
   await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href);await page.locator('#helpButton').waitFor();
   await page.waitForFunction(()=>document.querySelector('#versionBadge')?.textContent==='v1.0.0');
   if(await page.locator('html').getAttribute('lang')!==language)await page.locator('#languageButton').click();await page.locator('#languageButton').click();await page.locator('#languageButton').click();assert.equal(await page.locator('html').getAttribute('lang'),language,label+': repeated localization');
   assert.equal(await page.locator('#'+cfg.meta).count(),1,label+': unique metadata');assert.match((await page.locator('#'+cfg.meta).textContent()).trim(),/^v1\.0\.0 · \d{4}-\d{2}-\d{2}T[^ ]+Z$/,label+': populated version and build time');
   assert.equal((await page.locator('[data-i18n="'+cfg.badgeKey+'"]').textContent()).trim(),language==='ja'?'完全ローカル処理':'Fully local processing');
   assert.ok(await page.locator(cfg.badge).evaluate(el=>{const b=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el.querySelector('span'));return b.left>=0&&b.right<=innerWidth&&el.scrollWidth<=el.clientWidth+1&&[...range.getClientRects()].every(r=>r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1);}),label+': actual badge bounds');
   assert.equal(await page.locator('main #'+cfg.meta).count(),0);assert.equal(await page.locator('body > footer').isVisible(),width>cfg.bp,label+': footer breakpoint');
   assert.equal(await page.locator('.mobile-shortcuts').isVisible(),width<=cfg.bp);if(width<=cfg.bp){await page.locator('.mobile-shortcuts').scrollIntoViewIfNeeded();await bounds(page.locator('.mobile-shortcuts'),width,height,label+': functional shortcuts');}await page.locator('.status-line').scrollIntoViewIfNeeded();await bounds(page.locator('.status-line'),width,height,label+': operational status',false);for(const id of ['ioStats','logStatus','saveTxtButton','saveJsonlButton','clearSessionLogButton'])assert.equal(await page.locator('.status-line #'+id).count(),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': page width');
   await page.evaluate(()=>scrollTo(0,0));await page.locator('#helpButton').focus();await page.keyboard.press('Enter');const body=page.locator(cfg.body);
   assert.ok(await body.evaluate((el,id)=>el.lastElementChild.id===id,cfg.meta),label+': metadata final in scroll body');
   assert.equal(await page.locator('#'+cfg.meta).isVisible(),!cfg.mobileHidden||width>cfg.bp,label+': preserve metadata mobile visibility');
   if(cfg.license){const summary=page.locator(cfg.license+' > summary');await summary.focus();await page.keyboard.press('Enter');assert.equal(await page.locator(cfg.license).getAttribute('open'),'');assert.equal(await page.locator('#helpDialog').isVisible(),true,label+': descendant keyboard activation');}
   await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const finalSelector=cfg.mobileHidden&&width<=cfg.bp?cfg.mobileFinal:'#'+cfg.meta;
   const geometry=await page.locator(finalSelector).evaluate(el=>{const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let last;while(walker.nextNode())if(walker.currentNode.textContent.trim())last=walker.currentNode;const range=document.createRange();range.setStart(last,last.textContent.trimEnd().length-1);range.setEnd(last,last.textContent.trimEnd().length);const r=range.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};});
   const bb=await body.boundingBox(),db=await page.locator('#helpDialog').boundingBox();console.log('GEOMETRY '+label+' '+JSON.stringify({final:geometry,body:bb,dialog:db}));
   assert.ok(geometry.x>=0&&geometry.x+geometry.width<=width&&geometry.y>=Math.max(0,bb.y,db.y)-1&&geometry.y+geometry.height<=Math.min(height,bb.y+bb.height,db.y+db.height)+1,label+': last Help character reachable');
   assert.ok(await body.evaluate(el=>el.scrollWidth<=el.clientWidth+1),label+': Help width');await bounds(page.locator(cfg.head),width,height,label+': Help header');await bounds(page.locator(cfg.head+' h2'),width,height,label+': Help title');await bounds(page.locator(cfg.close),width,height,label+': Help Close');
   const hb=await page.locator(cfg.head).boundingBox(),cb=await page.locator(cfg.close).boundingBox();assert.ok(cb.y>=hb.y&&cb.y+cb.height<=hb.y+hb.height+1);
   if(file==='dist/index.html'&&[1360,320].includes(width))await page.screenshot({path:path.join(results,`help-${language}-${width}.png`)});
   assert.ok(db.y>1,label+': genuine backdrop');const before=await page.evaluate(()=>scrollY);await page.mouse.move(2,1);await page.mouse.wheel(0,400);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>scrollY),before,label+': background locked');
   await page.keyboard.press('Escape');assert.equal(await page.locator('#helpDialog').isVisible(),false);await page.locator('#helpButton').click();await page.locator(cfg.close).click();assert.equal(await page.locator('#helpDialog').isVisible(),false);await page.locator('#helpButton').click();await page.mouse.click(2,1);assert.equal(await page.locator('#helpDialog').isVisible(),false,label+': backdrop dismissal');
   if(file!==cfg.slug+'.html'&&language==='ja'&&width===360)await smoke(page,file);
   assert.deepEqual(errors,[],label+': runtime errors');assert.deepEqual(requests,[],label+': external runtime requests');if(diagnostics.length)console.log('ENGINE DIAGNOSTIC '+JSON.stringify(diagnostics));console.log('PASS '+label);
  }catch(e){await page.screenshot({path:path.join(results,`failure-${file.replace(/[^a-z0-9]/gi,'-')}-${language}-${width}x${height}.png`)}).catch(()=>{});console.error('CONTEXT '+label+' '+JSON.stringify({errors,requests,diagnostics}));throw e;}finally{await context.close();}
 }}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
