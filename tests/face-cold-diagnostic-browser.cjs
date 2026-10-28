// Synthetic fixtures only; no hardware, research API or clinical payloads.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fixture=`<!doctype html><html><body data-public-face-startup="preparing"><div id="video-container"><video id="video"></video></div><script type="module">
import {activate} from '/js/face-cold-diagnostic.mjs';
let enabled=true,s={phase:'BEFORE_START',countdown:null,attempts:0,invalid:null},models=[null,null];
const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=2;canvas.height=2;
const f={detectLoop(){return 42},startScreening(){s.phase='RESTING_PHASE';return 43},startActionPhase(){s.phase='ACTION_PHASE';return 44},onResults(){return 'unchanged'},showSmilePrompt(){},showStatusPanel(){},showCenterCountdown(n){s.countdown=n},speakFace(){},reportFaceTts(){},getMouthVisibility(){ctx.drawImage(canvas,0,0);return ctx.getImageData(0,0,1,1)}};
const originals={...f};
await activate({allowed:()=>enabled,state:()=>s,models:()=>models,pixels:()=>ctx,instructionKey:t=>t==='SMILE_SECRET'?'smile':'still',wrap:(n,decorator)=>{const old=f[n];f[n]=decorator(old);return()=>{f[n]=old}}});
window.fixture={f,s,originals,setModels(){models=[{detectForVideo(){return 'face-secret'}},{detectForVideo(){return 'hand-secret'}}];return models},disable(){enabled=false},proto:CanvasRenderingContext2D.prototype.getImageData};
</script></body></html>`;
let gateRequests=0,bodies=[];
const server=http.createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/fixture'){res.setHeader('Content-Type','text/html');res.end(fixture);return}if(u.pathname==='/api/face-cold-debug-gate'){gateRequests++;bodies.push(body);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({schema:1,preview:true,sha:'a'.repeat(40),host:req.headers.host.split(':')[0]}));return}const f=path.join(process.cwd(),u.pathname);res.setHeader('Content-Type',f.endsWith('.mjs')||f.endsWith('.js')?'application/javascript':f.endsWith('.html')?'text/html':'text/plain');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end()}})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});try{
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await context.route('https://**',r=>r.abort());const p=await context.newPage();
let diagnosticAssets=0; p.on('request',r=>{if(/face-cold-diagnostic|face-cold-debug-gate/.test(r.url()))diagnosticAssets++});
await p.goto('http://127.0.0.1:'+server.address().port+'/face-test.html?mode=public');await p.waitForTimeout(300);assert.equal(diagnosticAssets,0);assert.equal(await p.locator('#face-cold-diagnostic').count(),0);
await p.evaluate(()=>{sessionStorage.setItem('fast_session_app_mode','research');sessionStorage.setItem('quickstroke_selected_app_mode','research')});
await p.goto('http://127.0.0.1:'+server.address().port+'/face-test.html?mode=research&faceColdStartDebug=1&entry=cold');await p.waitForTimeout(300);assert.equal(diagnosticAssets,0);
const base='http://127.0.0.1:'+server.address().port;
await p.goto(base+'/fixture?faceColdStartDebug=1&entry=cold');await p.waitForFunction(()=>!!window.fixture);await p.waitForTimeout(50);
await p.evaluate(()=>{document.body.dataset.publicFaceStartup='ready';});await p.waitForTimeout(50);
const result=await p.evaluate(()=>{const x=fixture,m=x.setModels();const a=x.f.detectLoop();const f=m[0].detectForVideo('RAW_LANDMARK_SECRET'),h=m[1].detectForVideo();const start=x.f.startScreening();x.f.showCenterCountdown(1);x.f.startActionPhase();x.f.showSmilePrompt('SMILE_SECRET');x.f.speakFace('SMILE_SECRET');x.f.getMouthVisibility();x.s.attempts=1;x.s.invalid='NO_SMILE_DETECTED';x.f.onResults('PARTICIPANT_SECRET');return{a,f,h,start,protoUnchanged:CanvasRenderingContext2D.prototype.getImageData===x.proto}});
assert.deepEqual(result,{a:42,f:'face-secret',h:'hand-secret',start:43,protoUnchanged:true});await p.waitForTimeout(50);
await p.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('fixture denial'))}})});
await p.locator('summary').click();await p.getByRole('button',{name:'Copy Summary',exact:true}).click();const text=await p.locator('textarea').inputValue();
for(const key of ['preparing @','ready @','start @','smile @','firstFaceMs=','firstHandMs=','firstPixelReadMs=','attempts=1','NO_SMILE_DETECTED','smile','SHA '+ 'a'.repeat(40)])assert.ok(text.includes(key),key);
assert.doesNotMatch(text,/RAW_LANDMARK_SECRET|PARTICIPANT_SECRET|SMILE_SECRET|face-secret|hand-secret|http:|127\.0\.0\.1/);
assert.equal(gateRequests,1);assert.deepEqual(bodies,['']);
await p.evaluate(()=>{for(let i=0;i<500;i++){fixture.s.countdown=i;fixture.f.onResults('PRIVATE')} });
await p.getByRole('button',{name:'Copy Summary',exact:true}).click();assert.ok((await p.locator('textarea').inputValue()).length<=2800);
await p.evaluate(()=>{fixture.disable();fixture.f.detectLoop()});assert.equal(await p.locator('#face-cold-diagnostic').count(),0);
assert.equal(await p.evaluate(()=>Object.keys(fixture.f).every(k=>fixture.f[k]===fixture.originals[k])),true);
// Clipboard success path and warm label; missing stages are explicit.
await p.goto(base+'/fixture?faceColdStartDebug=1&entry=warm');await p.waitForFunction(()=>!!window.fixture);await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{window.copied=t;return Promise.resolve()}}}));await p.locator('summary').click();await p.getByRole('button',{name:'Copy Summary',exact:true}).click();assert.ok(await p.evaluate(()=>copied.includes('entry=warm')&&copied.includes('start: MISSING')));
console.log('PASS actual default/Research page isolation; enabled synthetic geometry/state/inference/readback observations; exact return values and prototype restoration; bounded summary; no secrets; empty POST only; clipboard/fallback; missing stages; teardown. rAF is not proof of paint.');
await context.close();}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
