'use strict';
// Documentation screenshot generator. Uses a synthetic serial device ONLY,
// never real hardware. Set EMIT_PNG_CHUNKS=1 for an explicitly requested asset refresh.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const outputDir=path.join(root,'test-results','release-captures');
const shots=[
  ['ja',1440,900,'screenshot.png'],
  ['en',1440,900,'screenshot-en.png'],
  ['ja',390,900,'screenshot-mobile.png'],
  ['en',390,900,'screenshot-mobile-en.png']
];

async function capture(browser,[lang,width,height,file]) {
 const context=await browser.newContext({
   locale:lang==='ja'?'ja-JP':'en-US',
   viewport:{width,height},deviceScaleFactor:1,
   isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'
 });
 const page=await context.newPage();
 const errors=[],outbound=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()))outbound.push(r.url());});
 await page.addInitScript(()=>{
   const port={
     readable:new ReadableStream({start(c){window.__docFeed=b=>c.enqueue(new Uint8Array(b));}}),
     writable:new WritableStream({write(){}}),
     getInfo(){return {usbVendorId:0x1234,usbProductId:0x5678};},
     async open(){},async close(){},async setSignals(){},
     async getSignals(){return {clearToSend:false,dataSetReady:false};}
   };
   Object.defineProperty(navigator,'serial',{
     configurable:true,
     value:{async getPorts(){return [port];},async requestPort(){return port;},addEventListener(){}}
   });
 });
 try {
   await page.goto(pathToFileURL(path.join(root,'dist','index.html')).href);
   await page.waitForFunction(()=>!document.querySelector('#connectButton')?.disabled);
   if(await page.locator('html').getAttribute('lang')!==lang) await page.locator('#languageButton').click();
   await page.locator('#connectButton').click();
   await page.waitForFunction(()=>document.querySelector('.workspace')?.dataset.connectionStep==='connected');
   await page.locator('#timestampButton').click();
   await page.evaluate(()=>{
     const enc=new TextEncoder();
     for(const row of ['boot complete\r\n','INFO sensor=24.1\r\n','WARN voltage low\r\n','ERROR test frame\r\n']){
       window.__docFeed(enc.encode(row));
     }
   });
   await page.waitForFunction(()=>document.querySelector('#terminal')?.textContent.includes('ERROR test frame'));
   await page.locator('#addMarkerButton').click();
   await page.locator('#markerInput').fill(lang==='ja'?'テスト中に確認':'Checked during test');
   await page.locator('#markerForm').evaluate(form=>form.requestSubmit());
   await page.waitForFunction(()=>document.querySelector('#terminal')?.textContent.includes('── '));
   await page.locator('#filterTerminalButton').click();
   await page.locator('#filterQuery').fill('ERROR');
   await page.waitForFunction(()=>document.querySelector('#terminal mark')?.textContent==='ERROR');
   if(width===1440) await page.locator('#settingsPanel').evaluate(el=>{el.open=true;});
   // Close the temporary marker confirmation before taking documentation screenshots.
   await page.evaluate(()=>window.AppToast.show({message:''}).dismiss());
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(200);
   const data=await page.screenshot({fullPage:true,animations:'disabled'});
   assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(data.readUInt32BE(16),width);
   assert.ok(data.readUInt32BE(20)>=850);
   assert.ok(data.length>25000);
   assert.deepEqual(errors,[]);
   assert.deepEqual(outbound,[]);
   const output=path.join(outputDir,file);
   fs.writeFileSync(output,data);
   const sha=createHash('sha256').update(data).digest('hex');
   console.log('SCREENSHOT_OK '+file+' '+data.length+' bytes sha256='+sha);
   if(process.env.EMIT_PNG_CHUNKS==='1') {
     const encoded=data.toString('base64'),size=7000,total=Math.ceil(encoded.length/size);
     console.log('BKPNG_BEGIN '+file+' '+total+' '+sha);
     for(let i=0;i<total;i++)console.log('BKPNG_PART '+file+' '+i+' '+encoded.slice(i*size,(i+1)*size));
     console.log('BKPNG_END '+file);
   }
 } finally {await context.close();}
}

(async()=>{
 fs.mkdirSync(outputDir,{recursive:true});
 const browser=await chromium.launch();
 try {
   for(const shot of shots)await capture(browser,shot);
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
