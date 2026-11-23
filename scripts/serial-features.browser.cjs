'use strict';
// Browser-level regression with a mocked Web Serial port. Never sends data to hardware.
const {strict:assert}=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

async function verify(browser,width,language) {
  const context=await browser.newContext({
    viewport:{width,height:width===320?640:width===393?252:820},
    locale:language==='ja'?'ja-JP':'en-US',
    acceptDownloads:true,
    reducedMotion:'reduce'
  });
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',req=>{if(/^https?:/.test(req.url()))external.push(req.url());});
  await page.addInitScript(()=>{
    window.__serialWrites=[];
    const readable=new ReadableStream({
      start(controller){
        window.__serialFeed=values=>controller.enqueue(new Uint8Array(values));
      }
    });
    const writable=new WritableStream({
      write(bytes){window.__serialWrites.push(Array.from(bytes));}
    });
    const port={
      readable,writable,
      getInfo(){return {usbVendorId:0x1234,usbProductId:0x5678};},
      async open(){},
      async close(){},
      async setSignals(){},
      async getSignals(){return {clearToSend:false,dataSetReady:false,dataCarrierDetect:false,ringIndicator:false};}
    };
    Object.defineProperty(navigator,'serial',{
      configurable:true,
      value:{
        async getPorts(){return [port];},
        async requestPort(){return port;},
        addEventListener(){}
      }
    });
  });
  try {
    const file=path.resolve(__dirname,'../dist/index.html');
    await page.goto(pathToFileURL(file).href);
    await page.waitForFunction(()=>!document.querySelector('#connectButton').disabled);
    assert.equal(await page.locator('.workspace').getAttribute('data-connection-step'),'ready');
    if(await page.locator('html').getAttribute('lang')!==language) {
      await page.locator('#languageButton').click();
    }
    await page.locator('#connectButton').click();
    await page.waitForFunction(()=>document.querySelector('.workspace').dataset.connectionStep==='connected');
    await page.locator('#timestampButton').click();
    await page.evaluate(()=>{
      window.__serialFeed([72,69,76]);
      window.__serialFeed([76,79,13]);
      window.__serialFeed([10,69,82,82,79,82,10]);
    });
    await page.waitForFunction(()=>{
      const text=document.querySelector('#terminal').textContent;
      return text.includes('RX  HELLO\n')&&text.includes('RX  ERROR\n');
    });
    const initial=await page.locator('#terminal').textContent();
    assert.equal((initial.match(/RX  /g)||[]).length,2,'prefix must not repeat for read chunks');
    await page.locator('#filterTerminalButton').click();
    await page.locator('#filterQuery').fill('ERROR');
    await page.waitForFunction(()=>document.querySelector('#terminal mark')?.textContent==='ERROR');
    assert.equal(await page.locator('#terminal mark').count(),1);
    await page.locator('#filterMode').selectOption('only');
    const filtered=await page.locator('#terminal').textContent();
    assert.ok(filtered.includes('ERROR'));
    assert.ok(!filtered.includes('HELLO'));
    await page.locator('#addMarkerButton').click();
    await page.locator('#markerInput').fill('Checked the LED');
    if(width<=393) {
      const inside=await page.locator('#markerDialog').evaluate(el=>{
        const b=el.getBoundingClientRect();
        return b.left>=0&&b.right<=innerWidth+1&&b.top>=0&&b.bottom<=innerHeight+1;
      });
      assert.ok(inside,'marker dialog fits 320px viewport');
    }
    await page.locator('#markerForm').evaluate(form=>form.requestSubmit());
    await page.waitForFunction(()=>document.querySelector('#terminal').textContent.includes('Checked the LED'));
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#saveJsonlButton').click();
    const download=await downloadPromise;
    const jsonl=fs.readFileSync(await download.path(),'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
    const marker=jsonl.find(item=>item.direction==='marker');
    assert.ok(marker);
    assert.equal(marker.text,'Checked the LED');
    assert.equal(marker.bytes,'');
    assert.ok(jsonl.some(item=>item.bytes==='48454C'),'RX bytes preserved');
    await page.locator('#closeFilterButton').click();
    assert.ok((await page.locator('#terminal').textContent()).includes('HELLO'),'close filter restores all data');
    await page.locator('#commandInput').fill('PING');
    assert.match(await page.locator('#sendPreview').textContent(),/5 bytes/);
    await page.locator('#sendButton').click();
    await page.waitForFunction(()=>window.__serialWrites.length===1);
    assert.deepEqual(await page.evaluate(()=>window.__serialWrites[0]),[80,73,78,71,10]);
    await page.locator('#sendMode').selectOption('hex');
    await page.locator('#commandInput').fill('GG');
    assert.equal(await page.locator('#sendButton').isDisabled(),true);
    assert.equal(await page.locator('#sendPreview').getAttribute('data-invalid'),'true');
    await page.locator('#commandInput').fill('00 7F FF');
    assert.match(await page.locator('#sendPreview').textContent(),/3 bytes/);
    await page.locator('#sendButton').click();
    await page.waitForFunction(()=>window.__serialWrites.length===2);
    assert.deepEqual(await page.evaluate(()=>window.__serialWrites[1]),[0,127,255]);

    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[],'no JS exceptions');
    assert.deepEqual(external,[],'single-file app must not fetch external resources');
    console.log('PASS browser serial workflow '+language+' '+width+'px');
  } finally { await context.close(); }
}

(async()=>{
  const browser=await chromium.launch();
  try {
    await verify(browser,1360,'ja');
    await verify(browser,320,'en');
    await verify(browser,393,'ja');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
