const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const source=fs.readFileSync('js/speech-retry-diagnostic.js','utf8'),gate=fs.readFileSync('api/speech-retry-debug-gate.js','utf8');
const sha='83e99b3f3f486d7d14663eaad8d80933d9fdec2b';
for(const env of ['preview','production','development'])for(const host of ['immutable.vercel.app','alias.vercel.app'])for(const flag of ['1','0',undefined])for(const method of ['POST','GET']){
 const box={module:{exports:{}},process:{env:{VERCEL_ENV:env,VERCEL_URL:'immutable.vercel.app',VERCEL_GIT_COMMIT_SHA:sha}}};vm.runInNewContext(gate,box);let status,body;
 box.module.exports({method,query:{speechRetryDebug:flag},headers:{host}},{setHeader:(k,v)=>assert.equal(v,'no-store'),status(n){status=n;return this;},json(v){body=v;}});
 assert.equal(status===200,env==='preview'&&host==='immutable.vercel.app'&&flag==='1'&&method==='POST');assert.equal(body.eligible,status===200);
}
const original=cp.execFileSync('git',['show',sha+':speech-test.html'],{encoding:'utf8'});let restored=fs.readFileSync('speech-test.html','utf8');
for(const op of JSON.parse(fs.readFileSync('tests/fixtures/speech-retry-diagnostic-patch.json','utf8')).reverse()){assert.equal(restored.split(op.after).length,2);restored=restored.replace(op.after,op.before);}assert.equal(restored,original,'ONLY inventoried observer hooks; all acquisition/audio/ASR/scoring/navigation bytes retained');
assert.doesNotMatch(source,/getUserMedia|AudioContext|new .*Recognition|setInterval|setTimeout|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|console\./);
assert.equal((source.match(/global.fetch\(/g)||[]).length,1);assert.match(source,/method:'POST',cache:'no-store',credentials:'same-origin'/);assert.doesNotMatch(source,/body:/);
(async()=>{
 for(const mode of ['public','research','dev'])for(const role of ['engineering_only','research_candidate'])for(const flag of ['0','1'])for(const iphone of [true,false]){
  const nodes=[],events={},root={append:n=>nodes.push(n)};let requests=0,now=100,clipboard='';
  let eligibleMode=mode;
  function node(){return {children:[],style:{},append(...n){this.children.push(...n);},setAttribute(){},focus(){},select(){},remove(){this.removed=true;}};}
  const w={QuickStrokeDevMode:{isEnabled:()=>true},QuickStrokeAppMode:{resolveMode:()=>eligibleMode,getAnalysisRole:()=>role},QuickStrokeDataContract:{getSessionContext:()=>({appMode:eligibleMode})},addEventListener:(k,v)=>events[k]=v,fetch:async(url,options)=>{requests++;assert.equal(url,'/api/speech-retry-debug-gate?speechRetryDebug=1');assert.equal(options.body,undefined);return {ok:true,json:async()=>({eligible:true,sha})};}};
  const c={window:w,navigator:{userAgent:iphone?'iPhone':'Android',clipboard:{writeText:async text=>{clipboard=text;throw Error('denied');}}},location:{search:'?speechRetryDebug='+flag},URLSearchParams,performance:{now:()=>now++},document:{createElement:node,getElementById:()=>root}};
  vm.runInNewContext(source,c);await new Promise(r=>setImmediate(r));
  const enabled=mode==='dev'&&role==='engineering_only'&&flag==='1'&&iphone;assert.equal(requests,Number(enabled));
  if(!enabled){assert.equal(w.QuickStrokeSpeechRetryDiagnostic,undefined);continue;}
  const d=w.QuickStrokeSpeechRetryDiagnostic;assert.ok(d.active());
  for(const code of ['USER_START','RELEASE_KEEP','IOS_REUSE_PIPELINE_REJECTED','STEP_TIMEOUT','START_ERROR','USER_RETRY','ASR_RESULT'])d.record(code,{phase:'RECORDING',context:'suspended',track:'ended',detail:'acquire_microphone:NotAllowedError',transcript:'SECRET',sessionId:'SECRET'});
  d.record('SECRET',{detail:'SECRET'});d.record('START_ERROR',{phase:'SECRET',context:'SECRET',track:'SECRET',detail:'SECRET:SECRET'});
  const panel=nodes[0],button=panel.children[1],area=panel.children[2];await button.onclick();assert.equal(area.hidden,false);assert.ok(clipboard.includes('IOS_REUSE_PIPELINE_REJECTED'));assert.ok(clipboard.includes('acquire_microphone:NotAllowedError'));assert.ok(!clipboard.includes('SECRET'));
  for(let i=0;i<170;i++)d.record('USER_RETRY',{});await button.onclick();assert.match(area.value,/Bounded events 160; dropped /);
  eligibleMode='research';assert.ok(!d.active());events['quickstroke:app-mode-change']();assert.ok(panel.removed);
 }
 console.log('PASS: exact engine boundary; 36 server gates; 24 client gates; bounded allowlisted privacy; gesture-only copy/fallback; mode disposal.');
})().catch(e=>{console.error(e);process.exitCode=1;});
