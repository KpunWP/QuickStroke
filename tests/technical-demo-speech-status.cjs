// Actual Speech callbacks and Start/Retry dispatch; synthetic ASR/acquisition/evaluation boundaries.
// Never requests media, plays audio, calls remote services or changes application source.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),base='87a2211e97a0c17e561f22852eb1c83fd422ed6a';
const old=cp.execFileSync('git',['show',base+':speech-test.html'],{cwd:root,encoding:'utf8'});
assert.equal(fs.readFileSync(path.join(root,'speech-test.html'),'utf8'),old.replace("phase, target:T?.target || '', attempt:speechAttemptNo,","phase, target:T?.target || '', run:speechModuleStartedAtMs, attempt:speechAttemptNo,"),'ONLY read-only adapter run binding may change; all callbacks/timers/ASR/audio/Retry/scoring remain byte exact');
for(const f of ['face-test.html','arm-test.html','js/app-mode.js','js/dev-mode.js','service-worker.js'])assert.ok(fs.readFileSync(path.join(root,f)).equals(cp.execFileSync('git',['show',base+':'+f],{cwd:root})),f+' unchanged');
const server=http.createServer((q,s)=>{try{let n=new URL(q.url,'http://localhost').pathname;if(n==='/seed'){s.setHeader('Content-Type','text/html');return s.end('<!doctype html>Seed')}if(n==='/')n='/index.html';s.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(n)]||'application/octet-stream');s.end(fs.readFileSync(path.join(root,n)))}catch{s.statusCode=404;s.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
let attempts=0;const errors=[];
for(const iphone of [false,true]){
 const c=await b.newContext({serviceWorkers:'block',...(iphone?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})}),p=await c.newPage();
 await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await c.addInitScript(()=>{window.__unexpectedMic=0;speechSynthesis.speak=()=>{};speechSynthesis.cancel=()=>{};navigator.mediaDevices.getUserMedia=()=>{window.__unexpectedMic++;return Promise.reject(Error('Media forbidden in synthetic test'))};});p.on('pageerror',e=>errors.push(e.message));
 async function load(mode='dev'){
  await p.goto(origin+'/seed');await p.evaluate(mode=>{sessionStorage.clear();sessionStorage.setItem('fast_lang','en');sessionStorage.setItem('quickstroke_dev_mode','1');sessionStorage.setItem('fast_session_app_mode',mode);sessionStorage.setItem('fast_session_analysis_role',mode==='dev'?'engineering_only':mode==='research'?'research_candidate':'public_ephemeral');},mode);
  await p.goto(origin+'/speech-test.html');await p.waitForFunction(()=>!!T);
 }
 const status=()=>p.locator('[data-metric=recognition]');const tx=()=>p.locator('[data-metric=transcript]');
 async function setup(){await load();await p.evaluate(()=>{
  window.__captures=0;window.__evaluations=[];window.__instances=[];
  window.SpeechRecognition=window.webkitSpeechRecognition=class{
   constructor(){window.__instances.push(this)}start(){}stop(){this.onend?.()}abort(){this.onend?.()}
  };
  // Real UI dispatch and recognition callbacks remain. Substitute hardware boundary only.
  primeSpeechCue=()=>{};playSpeechInstructionBeforeCapture=async()=>{};ensureMicDisclosureBeforeFirstUse=async()=>null;
  startRecording=async()=>{window.__captures++;speechAttemptNo++;lastAsrErrorCode=null;recordingStartedMs=null;phase='CALIBRATING';};
  // ASR-output evaluation boundary: engine scoring tested by original regression suites.
  evaluateSpeech=(text)=>{window.__evaluations.push(text);document.getElementById('domain-phrase-status').textContent=speechTranscriptMatchesAcceptedPhrase(text)?'Accepted variant':'Phrase mismatch';phase='DONE';recognitionStarted=false;document.getElementById('action-btn').textContent=T.btnRetry;document.getElementById('action-btn').disabled=false;};
  document.getElementById('test-screen').style.display='flex';phase='IDLE';document.getElementById('action-btn').disabled=false;
 });}
 await setup();await assert.doesNotReject(()=>status().waitFor());assert.equal(await status().textContent(),'—');
 let previousRun=null;
 for(let i=0;i<4;i++){
  await p.locator('#action-btn').click(); // Original first Start, then three original Retry dispatches.
  const state=await p.evaluate(()=>({attempt:speechAttemptNo,run:speechModuleStartedAtMs,captures:window.__captures}));
  assert.equal(state.attempt,1,'Manual retry really resets original attempt counter');assert.notEqual(state.run,previousRun);previousRun=state.run;assert.equal(state.captures,i+1);
  if(i===0){await p.waitForTimeout(230);assert.equal(await tx().textContent(),'—');assert.equal(await status().textContent(),'—');}
  // Subsequent retries deliberately skip a UI polling tick in the reset phase.
  await p.evaluate(async()=>{phase='RECORDING';await beginSpeechRecognition();window.__asr=window.__instances.at(-1);window.__asr.onstart();});
  await p.waitForTimeout(230);assert.equal(await status().textContent(),'Ready');assert.equal(await tx().textContent(),'—','No transcript retained across a new module run with counter=1');
  await p.evaluate(()=>window.__asr.onaudiostart());await p.waitForTimeout(230);assert.equal(await status().textContent(),'Listening');
  const text=await p.evaluate(i=>i===2?'An unrelated phrase':i===1?(T.keywords?.[1]||T.target):T.target,i);
  await p.evaluate(text=>{const result=[{transcript:text,confidence:.95}];result.isFinal=true;window.__asr.onresult({resultIndex:0,results:[result]});},text);
  await p.waitForTimeout(230);assert.equal(await status().textContent(),'Recognizing');assert.equal(await tx().textContent(),text);
  await p.evaluate(()=>{window.__asr.onaudioend();window.__asr.onend();});await p.waitForTimeout(230);
  assert.equal(await p.evaluate(()=>recognitionStarted),false);assert.equal(await status().textContent(),'Complete','Cleanup flag must not erase successful recognition');assert.equal(await tx().textContent(),text);
  assert.equal(await p.locator('[data-metric=match]').textContent(),i===2?'Phrase mismatch':'Accepted variant');attempts++;
 }
 // Full lifecycle between UI ticks still yields Complete, never stale Not active.
 await p.locator('#action-btn').click();await p.evaluate(async()=>{phase='RECORDING';await beginSpeechRecognition();const asr=window.__instances.at(-1);asr.onstart();asr.onaudiostart();const r=[{transcript:T.target,confidence:.95}];r.isFinal=true;asr.onresult({resultIndex:0,results:[r]});asr.onend();});await p.waitForTimeout(230);assert.equal(await status().textContent(),'Complete');
 for(const error of ['not-allowed','network','audio-capture']){
  await setup();await p.locator('#action-btn').click();await p.evaluate(async error=>{phase='RECORDING';await beginSpeechRecognition();window.__instances.at(-1).onerror({error});},error);await p.waitForTimeout(230);assert.equal(await status().textContent(),'Unavailable');assert.equal(await tx().textContent(),'—');await p.evaluate(async()=>{await shutdownRecognition();phase='DONE';});
 }
 await setup();await p.evaluate(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;});await p.locator('#action-btn').click();await p.evaluate(async()=>{phase='RECORDING';await beginSpeechRecognition();});await p.waitForTimeout(230);assert.equal(await status().textContent(),'Unavailable');await p.evaluate(async()=>{await shutdownRecognition();phase='DONE';});
 assert.equal(await p.evaluate(()=>window.__unexpectedMic),0);
 for(const mode of ['public','research']){await load(mode);assert.equal(await p.locator('#qs-technical-demo').count(),0);assert.equal(await p.evaluate(()=>typeof QuickStrokeTechnicalDemo),'undefined');}
 await c.close();
}
assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,syntheticUaProfiles:['Chromium desktop','Chromium with iPhone UA (not Safari)'],firstPlusThreeRetries:attempts,rapidLifecycle:true,permissionAndAsrFailures:true,unsupported:true,noMediaRequests:true,modeIsolation:true,frozenCallbacks:true,errors},null,2));
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
