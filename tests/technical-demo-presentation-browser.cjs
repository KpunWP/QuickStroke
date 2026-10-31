// Actual module pages, synthetic scalar fixtures; no camera, audio or remote service.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.DEMO_PARITY_SCREENSHOTS;
const fixtureContext={require,__dirname,process:{env:process.env},console,__filename:__filename};
vm.createContext(fixtureContext);vm.runInContext(fs.readFileSync(path.join(__dirname,'public-face-browser.cjs'),'utf8').split('const server=')[0]+'\nthis.fixture=fixtureCode;this.portrait=portrait;',fixtureContext);
let baseline=false;
const cp=require('node:child_process'),base='bde5ead8904a8a9fe385a5b45b842d89a0ff3a29';
function serveFace(s){return s.replace('bootstrapFaceTest();','await switchFaceLang(getPreferredFaceLang());').replace('/* PATCH 3: keep CSS aware when score panel is visible */',fixtureContext.fixture+`\nwindow.__demoFace={signal(v){noFaceCount=0;QuickStrokeTechnicalDemo?.faceSignal(v)},lost(){noFaceCount=1;QuickStrokeTechnicalDemo?.faceLost()}};\n/* PATCH 3: keep CSS aware when score panel is visible */`)}
const server=http.createServer((q,s)=>{try{let n=new URL(q.url,'http://localhost').pathname;if(n.startsWith('/__fonts/')&&process.env.DEMO_PARITY_FONTS){s.setHeader('Content-Type','font/ttf');return s.end(fs.readFileSync(path.join(process.env.DEMO_PARITY_FONTS,path.basename(n))))};if(n==='/seed'){s.setHeader('Content-Type','text/html');return s.end('<!doctype html>Fixture boundary')};if(n==='/')n='/index.html';let body=baseline&&(n.endsWith('.html')||n==='/js/technical-demo.js')?cp.execFileSync('git',['show',base+':'+n.slice(1)],{cwd:root}):fs.readFileSync(path.join(root,n));if(n==='/face-test.html')body=serveFace(body.toString());s.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm'})[path.extname(n)]||'application/octet-stream');s.end(body)}catch(e){s.statusCode=404;s.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}),c=await b.newContext({serviceWorkers:'block',deviceScaleFactor:2}),p=await c.newPage(),errors=[];
await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin)return r.continue();if(u.hostname==='fonts.googleapis.com'&&process.env.DEMO_PARITY_FONTS){const f=(name,file,weight)=>`@font-face{font-family:'${name}';src:url(${origin}/__fonts/${file});font-weight:${weight}}`;return r.fulfill({contentType:'text/css',body:f('Manrope','Manrope.ttf','200 800')+f('IBM Plex Sans Thai','IBMPlexSansThai-Regular.ttf',400)+f('IBM Plex Sans Thai','IBMPlexSansThai-SemiBold.ttf',600)+f('IBM Plex Sans Thai','IBMPlexSansThai-Bold.ttf',700)+f('Noto Sans CJK JP','NotoSansCJKjp-Regular.otf',400)+f('Noto Sans CJK JP','NotoSansCJKjp-Bold.otf',700)})}return r.abort()});
await c.addInitScript(()=>{speechSynthesis.speak=()=>{};speechSynthesis.cancel=()=>{};navigator.mediaDevices.getUserMedia=()=>Promise.reject(Error('Synthetic: no hardware'));});p.on('pageerror',e=>errors.push(e.message));
if(out)fs.mkdirSync(out,{recursive:true});
async function load(name,mode='dev',lang='en',dev=true){await p.goto(origin+'/seed');await p.evaluate(({mode,lang,dev})=>{sessionStorage.clear();localStorage.clear();sessionStorage.setItem('fast_lang',lang);sessionStorage.setItem('fast_session_app_mode',mode);sessionStorage.setItem('fast_session_analysis_role',mode==='dev'?'engineering_only':mode==='research'?'research_candidate':'public_ephemeral');sessionStorage.setItem('quickstroke_selected_app_mode',mode);if(dev)sessionStorage.setItem('quickstroke_dev_mode','1');},{mode,lang,dev});await p.goto(origin+'/'+name+'-test.html');if(name==='face'){await p.waitForFunction(()=>!!window.__faceFixture);await p.evaluate(()=>__faceFixture.set('camera'));await p.locator('#video').evaluate((e,svg)=>e.poster='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),fixtureContext.portrait);}else await p.waitForFunction(()=>!!T);}
async function armFixture(side='left',value=4){await p.evaluate(({side,value})=>{document.getElementById('test-screen').classList.remove('arm-intro-visible');document.getElementById('arm-intro').style.display='none';document.getElementById('test-screen').style.display='flex';arm=side;phase='MEASURE';gravityReady=true;sensorOk=true;currentDrift=value;driftMax=value+1;lastSensorSampleAt=performance.now();mElapsed=2;document.getElementById('pose-guide').style.display='none';document.getElementById('cd-wrap').style.display='flex';document.getElementById('cd-num').textContent='8';document.getElementById('instr').textContent=T.instrMeasure;document.getElementById('sub-instr').textContent=T.subMeasure;}, {side,value});await p.waitForTimeout(230);}
async function speechFixture(){await p.evaluate(()=>{document.getElementById('test-screen').style.display='flex';phase='RECORDING';recognitionStarted=true;recordingStartedMs=performance.now();speechAttemptNo=1;globalThis.QuickStrokeTechnicalDemo?.speechState('Started');globalThis.QuickStrokeTechnicalDemo?.speechResult(T.target);document.getElementById('hint-text').textContent=T.speakNowPrompt;});await p.waitForTimeout(230);}
// Compare the Public design rules against Demo without converting the session.
const expectedMarkers={face:'facePublic',arm:'armPublic',speech:'speechPublic'};
const probes={face:['#video-container','#video','#center-countdown','#start-btn','#score-label'],arm:['#arm-intro-title','#pose-guide .guide-step-visual','#instr','#cd-num','#action-btn'],speech:['#top-lbl','#word-target','#mic-circle','#center-cd','#action-btn']};
async function visual(name){return p.evaluate(selectors=>selectors.map(selector=>{const e=document.querySelector(selector);if(!e)return null;const c=getComputedStyle(e);return [selector,c.fontFamily,c.fontSize,c.fontWeight,c.color,c.backgroundColor,c.borderRadius,c.objectFit];}),probes[name]);}
async function checkMode(name){assert.deepEqual(await p.evaluate(name=>({mode:QuickStrokeAppMode.resolveMode(),role:QuickStrokeAppMode.getAnalysisRole(),visual:document.documentElement.dataset.demoPresentation,publicFlag:document.documentElement.dataset[name+'Public']}),name),{mode:'dev',role:'engineering_only',visual:name,publicFlag:'0'});}
async function armState(state){await p.evaluate(state=>{
 document.getElementById('arm-intro').hidden=true;document.getElementById('test-screen').classList.remove('arm-intro-visible');resetAll();refreshArmLanguageUI();
 if(state==='countdown'){setArmGuideStage('left',3);document.getElementById('pre-cd').style.display='flex';document.getElementById('pre-cd-num').textContent='3';}
 if(state==='right'){arm='right';setArmGuideStage('right',1);}
 if(state==='done'){results={left:'pass',right:'pass'};armAnalysis={left:{key:'normal'},right:{key:'normal'}};driftValues={left:0,right:0};selectedArmAttemptIds={left:'synthetic-left',right:'synthetic-right'};for(const side of ['left','right'])cardState(side,'pass','✓',T.passLbl);setArmGuideStage('right',3);showFinal();}
},state);}
let cases=0;
for(const lang of (process.env.DEMO_PARITY_FLOW_ONLY?[]:['th','en','ja']))for(const width of [320,360,390,430])for(const scale of [1,2])for(const name of ['face','arm','speech']){
 const pair=[];
 for(const mode of ['public','dev']){
  await p.setViewportSize({width,height:width===320?568:844});await load(name,mode,lang,mode==='dev');await p.evaluate(scale=>document.documentElement.style.fontSize=scale===2?'200%':'100%',scale);
  if(name==='face')await p.evaluate(()=>__faceFixture.set('countdown'));if(name==='arm')await armState('left');if(name==='speech')await speechFixture();await p.waitForTimeout(240);
  pair.push(await visual(name));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+'/'+lang+'/'+width+'/'+scale);
  if(mode==='dev'){
   await checkMode(name);assert.equal(await p.locator('#qs-technical-demo').count(),1);
   if(name==='face'){assert.ok(await p.locator('#qs-technical-demo #face-mesh-toggle').count());assert.ok(await p.locator('#face-mesh-toggle').evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=48&&r.height>=48&&getComputedStyle(e).fontSize==='0px';}));}
   if(name==='arm'||name==='speech'){const data=p.locator(name==='arm'?'#qs-technical-demo svg':'[data-metric=transcript]');await data.scrollIntoViewIfNeeded();assert.ok(await data.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'Technical graph/transcript scrolls into view');await p.evaluate(()=>scrollTo(0,0));}
   if(name==='speech')assert.equal(await p.evaluate(()=>PUBLIC_IOS_SPEAKER_FIRST||PUBLIC_SPEECH_TTS_TRIAL),false,'Public audio policies stay off in actual Dev');
  }else{assert.equal(await p.locator('#demo-public-presentation-style,#qs-technical-demo').count(),0);}
 }
 assert.deepEqual(pair[1],pair[0],'Actual approved Public typography/colors/control styles '+name+'/'+lang+'/'+width+'/'+scale);cases++;
}
// Original user gesture dispatch, with acquisition/audio boundaries replaced in
// this local fixture only. No new sensor or microphone request is permitted.
await load('arm');await p.locator('#arm-intro-start').click();assert.equal(await p.locator('#arm-intro').evaluate(e=>e.hidden),true);
await p.evaluate(()=>{window.__waitSides=[];initAudio=()=>{};primeSpeechEngine=()=>Promise.resolve();requestSensor=cb=>cb();startWait=()=>window.__waitSides.push(arm);});
await p.locator('#action-btn').click();await p.waitForFunction(()=>window.__waitSides.length===1);assert.deepEqual(await p.evaluate(()=>window.__waitSides),['left']);
await p.evaluate(()=>{phase='BETWEEN';arm='left';document.getElementById('action-btn').disabled=false;});await p.locator('#action-btn').click();assert.deepEqual(await p.evaluate(()=>window.__waitSides),['left','right']);
await p.evaluate(()=>{phase='RETRY_ARM';document.getElementById('action-btn').disabled=false;});await p.locator('#action-btn').click();assert.deepEqual(await p.evaluate(()=>window.__waitSides),['left','right','right']);
// Original Arm completion/Retry and navigation: no sensor boundary is entered.
for(const flow of ['full','individual']){
 await load('arm');await p.evaluate(flow=>sessionStorage.setItem('fast_mode',flow),flow);await armState('done');await p.waitForSelector('#fast-nav-btn');await checkMode('arm');
 const target=flow==='full'?'speech-test.html':'result.html';await p.route('**/'+target,r=>r.fulfill({contentType:'text/html',body:'<!doctype html>Navigation boundary'}));await p.locator('#fast-nav-btn').click();await p.waitForURL('**/'+target);await p.unroute('**/'+target);
}
await load('arm');await armState('done');await p.locator('#action-btn').click();assert.equal(await p.evaluate(()=>phase),'IDLE');assert.equal(await p.locator('#pose-guide').isVisible(),true);
// Original Face Start/Retry and Full/Individual completion dispatch.
for(const flow of ['full','individual']){
 await load('face');await p.evaluate(flow=>{sessionStorage.setItem('fast_mode',flow);QuickStrokeDataContract.ensureScreeningContext({mode:flow});},flow);await p.evaluate(()=>__faceFixture.set('result'));await p.waitForSelector('#fast-nav-btn');const target=flow==='full'?'arm-test.html':'result.html';assert.equal(await p.locator('#fast-nav-btn').getAttribute('data-next-page'),target);
 await p.route('**/'+target,r=>r.fulfill({contentType:'text/html',body:'<!doctype html>Navigation boundary'}));await p.locator('#fast-nav-btn').click();await p.waitForURL('**/'+target);await p.unroute('**/'+target);
}
for(const state of ['camera','result']){await load('face');await p.evaluate(s=>__faceFixture.set(s),state);await p.evaluate(()=>__faceFixture.boundary());await p.locator('#start-btn').click();assert.equal(await p.evaluate(()=>faceStartCalls),1);}
async function homeResult(name,mode,lang='en',fixture='ok'){
 await p.goto(origin+'/seed');await p.evaluate(({mode,lang,fixture})=>{sessionStorage.clear();localStorage.clear();sessionStorage.setItem('fast_lang',lang);sessionStorage.setItem('fast_session_app_mode',mode);sessionStorage.setItem('fast_session_analysis_role',mode==='dev'?'engineering_only':'public_ephemeral');if(mode==='dev')sessionStorage.setItem('quickstroke_dev_mode','1');for(const m of ['face','arm','speech'])if(fixture!=='fresh')sessionStorage.setItem('fast_'+m,JSON.stringify({riskLevel:'ok',...(fixture==='history'&&m==='face'?{historicalAbnormalRetained:true}:{})}));},{mode,lang,fixture});
 await p.goto(origin+'/'+(name==='home'?'index.html':'result.html')+(mode==='dev'?'?dev=1':''));await p.waitForFunction(()=>document.documentElement.lang.includes('-'));await p.waitForTimeout(100);
}
let homeResultCases=0;
for(const lang of (process.env.DEMO_PARITY_FLOW_ONLY?[]:['th','en','ja']))for(const width of [320,390,430])for(const scale of [1,2])for(const name of ['home','result']){
 await p.setViewportSize({width,height:844});await homeResult(name,'dev',lang,name==='home'?'fresh':scale===2?'history':'ok');await p.evaluate(s=>document.documentElement.style.fontSize=s===2?'200%':'100%',scale);
 assert.equal(await p.evaluate(()=>QuickStrokeAppMode.resolveMode()),'dev');assert.equal(await p.locator('html').getAttribute('data-demo-presentation'),name);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+'/'+lang+'/'+width+'/'+scale);
 if(name==='home'){assert.equal(await p.locator('#public-module-overview').isVisible(),true);assert.equal(await p.locator('.mode-zone').isVisible(),false);assert.equal(await p.locator('#primary-action').evaluate(e=>getComputedStyle(e).width==='100%'),false);}
 else{assert.equal(await p.locator('html').getAttribute('data-result-public'),'0');assert.equal(await p.locator('.module-tile .module-icon svg').count(),3);assert.equal(await p.locator('#public-result-completion').count(),1);if(scale===1)assert.equal(await p.locator('#module-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),3);}
 homeResultCases++;
}
// Visual evidence: same synthetic fixtures, old accepted Dev vs new Public + data.
if(out)for(const name of ['home','face','arm','speech','result'])for(const old of [true,false]){
 baseline=old;await p.setViewportSize({width:390,height:844});
 if(['home','result'].includes(name))await homeResult(name,'dev','en',name==='home'?'fresh':'ok');else{await load(name);if(name==='face'){await p.evaluate(()=>{__faceFixture.set('countdown');__demoFace.signal({yaw:3,pitch:-2,roll:1,asymmetry:.2,aligned:true});__faceFixture.mesh();});}if(name==='arm'){await armFixture();for(const n of [1,2,3,4,3]){await p.evaluate(n=>{currentDrift=n;driftMax=4;lastSensorSampleAt=performance.now();},n);await p.waitForTimeout(210);}}if(name==='speech')await speechFixture();}
 await p.waitForTimeout(250);await p.screenshot({path:path.join(out,name+'-'+(old?'before':'after')+'-390-synthetic.png'),fullPage:false});
 if(!old&&['arm','speech'].includes(name)){await p.locator(name==='arm'?'#qs-technical-demo svg':'[data-metric=transcript]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name+'-after-data-scroll-390-synthetic.png'),fullPage:false});}
}
baseline=false;assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,modulePublicParityCases:cases,homeResultCases,originalFaceStartRetryAndFullIndividualNavigation:true,originalArmRetryAndFullIndividualNavigation:true,syntheticOnly:true,errors},null,2));await c.close();await b.close();server.close();})().catch(e=>{console.error(e);server.close();process.exitCode=1});
