// Actual Speech document + diagnostic, synthetic metadata/stage outcomes. Chromium, not Safari.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const root=path.resolve(__dirname,'..');
const sha='83e99b3f3f486d7d14663eaad8d80933d9fdec2b';let gateCalls=0;
const server=http.createServer((req,res)=>{let n=new URL(req.url,'http://localhost').pathname;if(n==='/seed')return res.end('<!doctype html>Seed');if(n==='/api/speech-retry-debug-gate'){gateCalls++;assert.equal(req.method,'POST');res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({eligible:true,sha}));}try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(n)]||'application/octet-stream');res.end(fs.readFileSync(path.join(root,n)));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
 const c=await b.newContext({serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}),p=await c.newPage();let mic=0;const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());await p.exposeFunction('__micForbidden',()=>{mic++;});
 await c.addInitScript(()=>{navigator.mediaDevices.getUserMedia=()=>{window.__micForbidden();return Promise.reject(Error('No hardware in test'));};speechSynthesis.speak=()=>{};speechSynthesis.cancel=()=>{};});
 for(const mode of ['public','research','dev'])for(const flag of [false,true]){
  await p.goto(origin+'/seed');await p.evaluate(mode=>{sessionStorage.clear();sessionStorage.setItem('fast_lang','en');sessionStorage.setItem('fast_session_app_mode',mode);sessionStorage.setItem('fast_session_analysis_role',mode==='dev'?'engineering_only':mode==='research'?'research_candidate':'public_ephemeral');sessionStorage.setItem('quickstroke_dev_mode','1');},mode);
  const before=gateCalls;await p.goto(origin+'/speech-test.html'+(flag?'?speechRetryDebug=1':''));await p.waitForFunction(()=>!!T);
  if(mode!=='dev'||!flag){assert.equal(await p.locator('#qs-speech-retry-diagnostic').count(),0);assert.equal(gateCalls,before);continue;}
  await p.waitForSelector('#qs-speech-retry-diagnostic');assert.equal(gateCalls,before+1);
  await p.evaluate(async()=>{
   traceSpeechRetryStage('USER_START');traceSpeechRetryStage('USER_RETRY');traceSpeechRetryStage('IOS_REUSE_PIPELINE_REJECTED');
   try{await waitForSpeechMicStep(Promise.reject(Object.assign(new Error('SECRET'),{name:'NotAllowedError'})),'acquire_microphone',500);}catch(_){}
   try{await waitForSpeechMicStep(new Promise(()=>{}),'audio_context_resume',1);}catch(_){}
   await waitForSpeechMicStep(Promise.resolve(null),'get_user_media',500);
   traceSpeechRetryStage('ASR_RESULT');
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}});
  });
  await p.locator('#qs-speech-retry-diagnostic summary').click();await p.getByRole('button',{name:'Copy stage summary'}).click();let text=await p.locator('#qs-speech-retry-diagnostic textarea').inputValue();assert.match(text,/STEP_ERROR .*acquire_microphone:NotAllowedError/);assert.match(text,/STEP_TIMEOUT .*audio_context_resume/);assert.match(text,/STEP_OK .*get_user_media/);assert.match(text,/ASR_RESULT/);assert.ok(!text.includes('SECRET'));assert.ok(!text.includes('The sky is blue today'));
  await p.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});});await p.getByRole('button',{name:'Copy stage summary'}).click();assert.equal(await p.evaluate(()=>window.__copied),text);
 }
 assert.equal(mic,0);assert.deepEqual(errors,[]);console.log('PASS: real document hooks and gate; Public/Research/default isolation; mic rejection/context timeout/success; clipboard fallback and success; zero media requests. Synthetic Chromium iPhone UA, not Safari.');await c.close();
 }finally{await b.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
