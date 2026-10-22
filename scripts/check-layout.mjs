// Browser geometry checks for the sheet preview, not a native Foundry session.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--no-sandbox','--disable-gpu']});
const context=await browser.newContext({viewport:{width:1080,height:950}});
await context.route('https://sns.local/**',async route=>{
  let url=new URL(route.request().url()).pathname;
  if(url.startsWith('/systems/shinobi-no-sho/'))url=url.slice('/systems/shinobi-no-sho'.length);
  if(url==='/')url='/preview/index.html';
  const filename=path.resolve(root,'.'+url);
  try{assert.ok(filename.startsWith(root+path.sep));const body=await readFile(filename);await route.fulfill({status:200,body,contentType:({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(filename)]??'application/octet-stream'});}catch{await route.fulfill({status:404,body:''});}
});
const page=await context.newPage(),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('https://sns.local/');await page.locator('.sns-identity').waitFor();
await page.locator('#surface [name="name"]').fill('Inspeção de layout');await page.locator('#surface [name="name"]').press('Tab');
await page.evaluate(()=>{const key='shinobi-no-sho.preview.v1',d=JSON.parse(localStorage.getItem(key));d.actor.items.push({id:'layout-aptitude',type:'aptitude',name:'Aptidão de teste',system:{catalogKey:'oportunista',catalogBook:'basico',level:1,source:{book:'basico',page:'65'}}});localStorage.setItem(key,JSON.stringify(d));});
await page.reload();
const go=async kind=>{await page.goto('https://sns.local/#'+kind);await page.waitForFunction(k=>document.querySelector('#surface').dataset.view===k,kind);};
await mkdir(path.join(root,'test-results/screenshots'),{recursive:true});
for(const width of [1080,760,420,320]){
  await page.setViewportSize({width,height:950});
  for(const kind of ['techniques','equipment']){
    await go(kind);
    const bounds=await page.locator('#surface .sns-row-tools .sns-btn').evaluateAll(buttons=>buttons.map(el=>({text:el.textContent,width:el.clientWidth,scroll:el.scrollWidth,height:el.clientHeight,scrollHeight:el.scrollHeight})));
    for(const b of bounds){assert.ok(b.scroll<=b.width+1,`${width}px ${kind} button text clipped: ${JSON.stringify(b)}`);assert.ok(b.scrollHeight<=b.height+1,`${width}px ${kind} button height clipped`);}
    const surface=await page.locator('#surface').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(surface.scroll<=surface.width+1,`${width}px ${kind} surface overflow`);
    await page.screenshot({path:path.join(root,`test-results/screenshots/layout-${kind}-${width}.png`),fullPage:true});
  }
  await go('social');
  const cards=await page.locator('.sns-social-action').evaluateAll(els=>els.map(el=>({name:el.getAttribute('aria-label'),height:el.getBoundingClientRect().height})));
  assert.ok(cards.every(c=>c.height<160),`${width}px excessive social card heights: ${JSON.stringify(cards)}`);
  assert.ok(cards.find(c=>c.name==='Empatia').height<110);
  assert.ok(cards.find(c=>c.name==='Encorajar').height<110);
  await page.screenshot({path:path.join(root,`test-results/screenshots/layout-social-${width}.png`),fullPage:true});
  results.push(`${width}px: action text fits, rows stay inside the sheet, social cards remain compact`);
}
await page.setViewportSize({width:1080,height:950});await go('summary');
assert.equal(await page.locator('.sns-profile-card').count(),0);assert.equal(await page.getByRole('button',{name:'Descansar',exact:true}).count(),1);
await go('conditions');await page.getByRole('button',{name:'Ativar Agarrado',exact:true}).click();
await go('summary');await page.getByRole('button',{name:'Desativar Agarrado',exact:true}).click();
assert.equal(await page.getByRole('button',{name:'Desativar Agarrado',exact:true}).count(),0);
results.push('Summary condition can be deactivated directly; rest remains in the footer');
assert.deepEqual(errors,[]);
await writeFile(path.join(root,'test-results/layout-results.json'),JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({results,errors},null,2));
await browser.close();
