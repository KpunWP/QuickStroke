// Actual Result build/summary/reminder and country helper. Local synthetic data only.
// External requests blocked; all telephone navigation prevented; no participant submissions.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
let old=false;const original=cp.execFileSync('git',['show','7942ebb283de0ae8d24af97016780c78e1ac89ce:result.html'],{encoding:'utf8',cwd:root});
const server=http.createServer((q,s)=>{try{const n=new URL(q.url,'http://localhost').pathname;if(n==='/seed'){s.setHeader('Content-Type','text/html');return s.end('<!doctype html>Navigation boundary')}s.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(n)]||'application/octet-stream');s.end(old&&n==='/result.html'?original:fs.readFileSync(path.join(root,n)))}catch{s.statusCode=404;s.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
 const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage(),errors=[];let cases=0,restorations=0;
 await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await c.addInitScript(()=>{document.addEventListener('click',e=>{if(e.target.closest('a[href^="tel:"]')){e.preventDefault();window.__telPrevented=(window.__telPrevented||0)+1}},true);speechSynthesis.speak=()=>{};});p.on('pageerror',e=>errors.push(e.message));
 async function load(mode,lang,urgent,flow='full',eligible=true){
  await p.goto(origin+'/seed');await p.evaluate(({mode,lang,urgent,flow,eligible})=>{sessionStorage.clear();localStorage.clear();sessionStorage.setItem('fast_lang',lang);sessionStorage.setItem('fast_session_app_mode',mode);sessionStorage.setItem('fast_session_analysis_role',mode==='dev'?'engineering_only':mode==='research'?'research_candidate':'public_ephemeral');sessionStorage.setItem('quickstroke_selected_app_mode',mode);sessionStorage.setItem('fast_mode',flow);if(mode==='dev'&&eligible)sessionStorage.setItem('quickstroke_dev_mode','1');sessionStorage.setItem('quickstroke_public_event','jssf2026');if(flow==='individual')sessionStorage.setItem('fast_result_source','face');for(const m of ['face','arm','speech']){if(flow==='individual'&&m!=='face')continue;sessionStorage.setItem('fast_'+m,JSON.stringify({riskLevel:urgent&&m==='face'?'bad':'ok'}));}},{mode,lang,urgent,flow,eligible});
  await p.goto(origin+'/result.html');await p.waitForSelector('[data-emergency-countries]');await p.waitForFunction(()=>!!CURRENT&&!!T);
 }
 const host=()=>p.locator('#emergency-action:not([hidden]),#emergency-reminder:not([hidden])');
 async function one(country){const h=host();assert.equal(await h.count(),1);assert.equal(await h.locator('[data-public-compact="1"]').count(),1);const a=h.locator('a[href^="tel:"]');assert.equal(await a.count(),1);assert.equal(await a.getAttribute('href'),'tel:'+(country==='TH'?'1669':'119'));assert.equal(await a.getAttribute('data-emergency-country'),country);const lang=await p.evaluate(()=>LANG);const labels={th:{TH:'ประเทศไทย',JP:'ญี่ปุ่น'},en:{TH:'Thailand',JP:'Japan'},ja:{TH:'タイ',JP:'日本'}};assert.equal(await a.textContent(),labels[lang][country]+' · '+(country==='TH'?'1669':'119'));assert.ok((await a.getAttribute('aria-label')).includes(country==='TH'?'1669':'119'));assert.equal(await h.locator('select').count(),1);assert.ok((await h.locator('[data-emergency-countries]').textContent()).length>40);}
 async function choose(country){const h=host();if(!await h.locator('details').evaluate(e=>e.open))await h.locator('summary').click();await h.locator('select').selectOption(country);await one(country);}
 for(const mode of ['public','dev'])for(const lang of ['th','en','ja'])for(const urgent of [false,true])for(const flow of ['full','individual']){
  await load(mode,lang,urgent,flow);await one(lang==='th'?'TH':'JP');assert.equal(await p.evaluate(()=>effectiveResultAppMode()),mode);assert.equal(await p.evaluate(()=>isPublicResultSession()),mode==='public');assert.equal(await p.evaluate(()=>QuickStrokeDemoPresentation.enabled()),mode==='dev');assert.equal(await p.locator('#emergency-action').isVisible(),urgent);
  const meaning=await p.evaluate(()=>({state:CURRENT.state,scope:CURRENT.scope,attention:CURRENT.attention,summary:document.getElementById('summary-desc').textContent,warning:document.getElementById('next-step').textContent}));
  for(const width of [320,360,390,430])for(const scale of [1,2]){
   await p.setViewportSize({width,height:width===320?568:844});await p.evaluate(scale=>document.documentElement.style.fontSize=scale===2?'200%':'100%',scale);await one(lang==='th'?'TH':'JP');
   for(const el of await host().locator('a,summary').all()){await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();assert.ok(r.width>=48&&r.height>=48);assert.ok(r.x>=-1&&r.x+r.width<=width+1)}
   const rects=await host().locator('a,summary').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom}}));const [a,d]=rects;assert.ok(Math.min(a.r,d.r)<=Math.max(a.l,d.l)+1||Math.min(a.b,d.b)<=Math.max(a.t,d.t)+1,'No emergency-control overlap');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);cases++;
  }
  await choose('TH');for(const next of ['en','ja','th']){await p.evaluate(l=>resultSwitchLang(l),next);await one('TH')};await choose('JP');for(const next of ['th','en','ja']){await p.evaluate(l=>resultSwitchLang(l),next);await one('JP')};await p.evaluate(l=>resultSwitchLang(l),lang);
  assert.deepEqual(await p.evaluate(()=>({state:CURRENT.state,scope:CURRENT.scope,attention:CURRENT.attention,summary:document.getElementById('summary-desc').textContent,warning:document.getElementById('next-step').textContent})),meaning,'Country/language changes do not change interpretation or warning');
  await p.reload();await p.waitForSelector('[data-public-compact="1"]');await one('JP');await p.goto(origin+'/seed');await p.goBack();await p.waitForSelector('[data-public-compact="1"]');await one('JP');await p.goForward();await p.goBack();await p.waitForSelector('[data-public-compact="1"]');await one('JP');restorations++;
 }
 // Existing tab-scoped country selection also carries between Demo Home and Result.
 for(const event of [false,true]){
  await load('dev','en',false);await p.evaluate(event=>{sessionStorage.removeItem('quickstroke_public_emergency_country');if(!event)sessionStorage.removeItem('quickstroke_public_event')},event);
  await p.goto(origin+'/index.html?dev=1');await p.waitForSelector('#emergency-card [data-public-compact="1"]');
  await p.locator('#disc-accept-btn').waitFor({state:'visible'});await p.locator('#disc-accept-btn').click();
  await p.locator('#emergency-card summary').click();await p.locator('#emergency-card select').selectOption('TH');
  await p.goto(origin+'/result.html?dev=1');await p.waitForSelector('[data-public-compact="1"]');await one('TH');await choose('JP');
  await p.goBack();await p.waitForSelector('#emergency-card a[href="tel:119"]');assert.equal(await p.locator('#emergency-card a').count(),1);
 }
 // Research and Dev without eligible engineering presentation match the exact old DOM.
 for(const mode of ['research','dev'])for(const urgent of [false,true]){
  const views=[];for(const before of [true,false]){old=before;await load(mode,'en',urgent,'full',false);assert.equal(await p.evaluate(()=>QuickStrokeDemoPresentation.enabled()),false);assert.deepEqual(await host().locator('a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['tel:1669','tel:119']);views.push(await host().evaluate(e=>e.outerHTML));}assert.equal(views[0],views[1]);
 }
 old=false;
 // Canonical Research state wins over a stale Dev flag/query; no remote profile/data.
 await load('research','en',true);await p.evaluate(async()=>{sessionStorage.setItem('quickstroke_dev_mode','1');RESULT_DATA_CONTEXT={...RESULT_DATA_CONTEXT,session:{...(RESULT_DATA_CONTEXT?.session||{}),appMode:'research'}};await buildResult()});assert.equal(await p.evaluate(()=>isResearchResultSession()),true);assert.equal(await p.evaluate(()=>QuickStrokeDemoPresentation.enabled()),false);assert.deepEqual(await host().locator('a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['tel:1669','tel:119']);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,layouts:cases,reloadAndHistory:restorations,modes:true,manualOverridesBothDirections:true,interpretationAndWarningUnchanged:true,telephoneCalls:0,syntheticChromiumOnly:true,errors},null,2));await c.close();
 }finally{await b.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
