// Synthetic/local only: every tel click is prevented. No camera, mic or live Research API.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const cp=require('node:child_process');let revision='new';const historical=new Map();
const server=http.createServer((q,s)=>{try{let n=new URL(q.url,'http://localhost').pathname;if(n==='/')n='/index.html';if(n==='/seed'){s.end('<!doctype html>');return}const f=path.join(root,n);const historicalFiles=['/service-worker.js','/index.html','/face-test.html','/arm-test.html','/speech-test.html','/result.html','/config.js','/js/i18n.js','/js/thai-recorded-audio.js','/locales/th-TH/ui.json'];if(revision==='old'&&historicalFiles.includes(n)){if(!historical.has(n))historical.set(n,cp.execFileSync('git',['show','9ae7b0f:'+n.slice(1)],{cwd:root}));s.setHeader('Content-Type',n.endsWith('.html')?'text/html':n.endsWith('.json')?'application/json':'application/javascript');return s.end(historical.get(n))}s.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.mp3':'audio/mpeg','.mjs':'application/javascript'})[path.extname(f)]||'application/octet-stream');s.end(fs.readFileSync(f))}catch{s.statusCode=404;s.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});let cases=0;const errors=[];
try{const c=await b.newContext({serviceWorkers:'block'});await c.route('https://**',r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));
for(const lang of ['th','en','ja'])for(const event of [false,true])for(const mode of ['public','research','dev'])for(const page of ['index.html','result.html'])for(const urgent of [false,true]){
 if(process.env.EMERGENCY_PROGRESS)console.error('case',lang,mode,page,urgent);await p.setViewportSize({width:320,height:568});await p.goto(base+'/seed');await p.evaluate(({lang,mode,urgent,event})=>{sessionStorage.clear();localStorage.clear();if(event){sessionStorage.setItem('quickstroke_public_event','jssf2026');sessionStorage.setItem('quickstroke_public_home_language',lang);}sessionStorage.setItem('fast_lang',lang);sessionStorage.setItem('fast_session_app_mode',mode);sessionStorage.setItem('quickstroke_selected_app_mode',mode);sessionStorage.setItem('fast_mode','full');if(mode==='dev')sessionStorage.setItem('quickstroke_dev_mode','1');for(const m of ['face','arm','speech'])sessionStorage.setItem('fast_'+m,JSON.stringify({riskLevel:urgent&&m==='face'?'bad':'ok'}));},{lang,mode,urgent,event});
 await p.goto(base+'/'+page);await p.waitForSelector('[data-emergency-countries]');await p.evaluate(()=>{window.__telClicks=[];document.addEventListener('click',e=>{const a=e.target.closest('a[href^="tel:"]');if(a){e.preventDefault();window.__telClicks.push(a.getAttribute('href'))}},true)});
 const compact=page==='index.html'?await p.evaluate(()=>isOrdinaryPublicHome()):mode==='public';
 const expected=compact?[event&&lang!=='th'?'tel:119':'tel:1669']:['tel:1669','tel:119'];
 if(page==='index.html'){
  // Disclaimer is independently populated even before the visitor dismisses it.
  assert.equal(await p.locator('.disc-emergency-text').evaluate(e=>e.parentElement.querySelectorAll('[data-emergency-countries] a').length),expected.length);
  for(const size of ['100%','200%']){await p.evaluate(size=>document.documentElement.style.fontSize=size,size);const disclaimerLinks=p.locator('.disc-emergency-text').locator('..').locator('a[href^="tel:"]');for(const link of await disclaimerLinks.all()){await link.scrollIntoViewIfNeeded();const box=await link.boundingBox();assert.ok(box.width>=48&&box.height>=48);assert.ok(box.x>=-1&&box.x+box.width<=321);}}await p.evaluate(()=>document.documentElement.style.fontSize='100%');await p.evaluate(()=>acceptDisclaimer());await p.locator('#disclaimer-overlay').waitFor({state:'hidden'});
 }
 for(const scale of [1,2]){
  await p.evaluate(scale=>document.documentElement.style.fontSize=scale===2?'200%':'100%',scale);
  const host=page==='index.html'?p.locator('#emergency-card'):p.locator('#emergency-action:not([hidden]),#emergency-reminder:not([hidden])');
  const links=host.locator('a[href^="tel:"]');assert.deepEqual(await links.evaluateAll(es=>es.map(e=>e.getAttribute('href'))),expected);
  for(let i=0;i<expected.length;i++){const a=links.nth(i);await a.scrollIntoViewIfNeeded();const box=await a.boundingBox();assert.ok(box.height>=48&&box.width>=48);assert.ok((await a.textContent()).includes(expected[i].slice(4)));await a.evaluate(e=>e.click());}
  assert.equal(await host.locator('[data-emergency-countries]').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);cases++;
 }
 assert.deepEqual(await p.evaluate(()=>window.__telClicks),[...expected,...expected]);
}
// Real page boots retain the existing tab-scoped event flag across module URLs,
// reload and history traversal; no capture or participant submissions occur.
await p.goto(base+'/seed');await p.evaluate(()=>{sessionStorage.clear();localStorage.clear()});
await p.goto(base+'/index.html?event=jssf2026');await p.waitForSelector('#emergency-card a[href="tel:119"]');
for(const module of ['face-test.html','arm-test.html','speech-test.html']){
 await p.goto(base+'/'+module+'?mode=public');
 assert.equal(await p.evaluate(()=>sessionStorage.getItem('quickstroke_public_event')),'jssf2026');
 await p.reload();assert.equal(await p.evaluate(()=>sessionStorage.getItem('quickstroke_public_event')),'jssf2026');
}
await p.goto(base+'/result.html?mode=public');await p.waitForSelector('[data-emergency-countries]');
assert.deepEqual(await p.locator('[data-emergency-countries] a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['tel:119']);
await p.goBack();assert.equal(await p.evaluate(()=>sessionStorage.getItem('quickstroke_public_event')),'jssf2026');
await p.goForward();await p.waitForSelector('[data-emergency-countries]');
await p.goto(base+'/index.html');await p.waitForSelector('#emergency-card a[href="tel:119"]');
// Explicit Public choice is shared by Home/disclaimer/Result, survives language changes,
// reload, same-tab navigation and takes precedence over exhibition defaults.
for (const event of [false,true]) for (const lang of ['th','en','ja']) {
 await p.goto(base+'/seed');await p.evaluate(()=>{sessionStorage.clear();localStorage.clear()});
 await p.goto(base+'/index.html'+(event?'?event=jssf2026':''));await p.waitForSelector('[data-public-compact="1"]');
 await p.evaluate(lang=>setLang(lang),lang);
 const initial=event&&lang!=='th'?'119':'1669';
 assert.equal(await p.locator('#emergency-card a[href^="tel:"]').getAttribute('href'),'tel:'+initial);
 const picker=p.locator('.disc-emergency-text').locator('..').locator('select[data-emergency-country-picker]');
 await picker.locator('..').locator('summary').click();await picker.selectOption('JP');
 assert.equal(await p.locator('#emergency-card a[href^="tel:"]').getAttribute('href'),'tel:119');
 for(const next of ['th','en','ja']){await p.evaluate(l=>setLang(l),next);assert.equal(await p.locator('#emergency-card a[href^="tel:"]').getAttribute('href'),'tel:119');}
 await p.reload();await p.waitForSelector('#emergency-card a[href="tel:119"]');
 await p.evaluate(()=>acceptDisclaimer());
 for(const width of [320,360,390,430])for(const text of ['100%','200%']) {
  await p.setViewportSize({width,height:568});await p.evaluate(t=>document.documentElement.style.fontSize=t,text);
  const host=p.locator('#emergency-card');await host.locator('summary').click();
  for(const el of await host.locator('a,summary,select').all()){await el.scrollIntoViewIfNeeded();const box=await el.boundingBox();assert.ok(box.width>=48&&box.height>=48);}
  await host.locator('summary').focus();assert.ok(await host.locator('summary').evaluate(e=>document.activeElement===e));await host.locator('select').focus();assert.ok(await host.locator('select').evaluate(e=>document.activeElement===e));
  await host.locator('select').selectOption('TH');assert.equal(await host.locator('a').getAttribute('href'),'tel:1669');
  await host.locator('summary').click();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);cases++;
 }
 await p.goto(base+'/result.html');await p.waitForSelector('[data-public-compact="1"]');assert.equal(await p.locator('[data-public-compact] a').getAttribute('href'),'tel:1669');
 await p.locator('[data-public-compact] summary').click();await p.locator('[data-public-compact] select').selectOption('JP');
 await p.goto(base+'/index.html');await p.waitForSelector('#emergency-card a[href="tel:119"]');
}
await c.close();
// New SW preloads the new filename even if old audio remains in a separate cache.
revision='old';const offline=await b.newContext({serviceWorkers:'allow'});await offline.route('https://**',r=>r.abort());const q=await offline.newPage();await q.goto(base+'/seed');await q.evaluate(async()=>{const c=await caches.open('quickstroke-jssf-th-audio-v3');await c.put('/audio/th/arm_11_alert.mp3',new Response('OLD 1669 BYTES'));await navigator.serviceWorker.register('/service-worker.js');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('SW readiness timeout')),20000))])});await q.waitForFunction(()=>!!navigator.serviceWorker.controller);assert.ok(await q.evaluate(async()=>(await caches.keys()).includes('quickstroke-pwa-v104')));await q.evaluate(()=>sessionStorage.setItem('release-recovery-sentinel','preserve'));revision='new';await q.evaluate(async()=>{window.__oldSW=navigator.serviceWorker.controller;const registration=await navigator.serviceWorker.getRegistration();await registration.update()});await q.waitForFunction(()=>navigator.serviceWorker.controller!==window.__oldSW);await q.waitForFunction(async()=>(await caches.keys()).includes('quickstroke-pwa-v105'));await q.waitForFunction(async()=>!!await caches.match('/audio/th/arm_11_alert_local_emergency_v2.mp3'));await q.reload();await q.evaluate(()=>sessionStorage.setItem('quickstroke_audio_ab','recorded'));await q.addScriptTag({content:fs.readFileSync(path.join(root,'js/thai-recorded-audio.js'),'utf8')});await q.evaluate(()=>QuickStrokeThaiRecorded.prepareAll());assert.equal(await q.evaluate(()=>sessionStorage.getItem('release-recovery-sentinel')),'preserve');
await offline.setOffline(true);await q.goto(base+'/index.html');await q.waitForSelector('[data-emergency-countries]');const evidence=await q.evaluate(async()=>{const r=await fetch('/audio/th/arm_11_alert_local_emergency_v2.mp3');const bytes=await r.arrayBuffer();const pack=await(await fetch('/locales/th-TH/ui.json')).json();return{ok:r.ok,bytes:bytes.byteLength,sha:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join(''),alert:pack.arm.vFinalBad,cache:await caches.keys(),links:[...document.querySelectorAll('#emergency-card a[href^="tel:"]')].map(a=>a.getAttribute('href'))}});assert.equal(evidence.bytes,31104);assert.equal(evidence.sha,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'audio/th/arm_11_alert_local_emergency_v2.mp3'))).digest('hex'));assert.ok(evidence.cache.includes('quickstroke-jssf-th-audio-v4'));assert.ok(!evidence.cache.includes('quickstroke-pwa-v104'));assert.ok(evidence.ok);assert.ok(!evidence.alert.includes('1669'));assert.deepEqual(evidence.links,['tel:1669']);await offline.close();assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,cases,telephoneCallsMade:0,offline:evidence,errors},null,2));
}finally{await b.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
