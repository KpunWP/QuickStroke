import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('face-test.html','utf8');
const block=html.match(/\/\* PUBLIC FACE STARTUP PRESENTATION[^]*?\/\* END PUBLIC FACE STARTUP PRESENTATION \*\//)[0];
assert.doesNotMatch(block,/\b(?:modelReady|isCameraRunning|phase)\s*=(?!=)|getUserMedia|loadModel\(|startCamera\(|startScreening\(|primeSpeech\(|\.play\(|fetch\(|setInterval|setTimeout|requestAnimationFrame|setItem|preventDefault|stopPropagation/);
assert.match(block,/modelReady && isCameraRunning/);
assert.match(block,/phase === 'BEFORE_START'/);
assert.match(block,/dataset.facePublic === '1'/);
assert.match(block,/!document.body.classList.contains\('result-visible'\)/);
assert.equal(html.match(/<style id="public-face-startup-style">\n([^]*?)<\/style>/)[1],fs.readFileSync('assets/public-face-startup.css','utf8'));
assert.doesNotMatch(fs.readFileSync('assets/public-face-startup.css','utf8'),/#video|#canvas|object-fit|transform:|animation:/);
for(const locale of ['th-TH','en-US','ja-JP']) {
 const face=JSON.parse(fs.readFileSync(`locales/${locale}/ui.json`)).face;
 for(const key of ['publicStartupTitle','publicStartupHint','publicReadyHint'])assert.ok(face[key]);
}
// Execute the real unchanged bootstrap: locale settles before both starts; neither is awaited.
const bootstrap=html.match(/async function bootstrapFaceTest\(\) \{[^]*?\n\}/)[0];
{
 const calls=[];let localeResolve;
 const ctx={getPreferredFaceLang:()=> 'en',switchFaceLang:()=>new Promise(r=>localeResolve=r),FL:{loading:'Opening camera'},initProgressDots:()=>calls.push('progress'),setUI:x=>calls.push(x),startCamera:()=>calls.push('camera'),loadModel:()=>calls.push('model'),statusMsg:{},startBtn:{classList:{add(){}}}};
 vm.createContext(ctx);vm.runInContext(bootstrap+';globalThis.run=bootstrapFaceTest;',ctx);
 const pending=ctx.run();assert.deepEqual(calls,[]);localeResolve(true);await pending;
 assert.deepEqual(calls.slice(-2),['camera','model']);assert.equal(calls[1].showStart,false);
}
// Run actual model initialization with deferred synthetic Face/Hand promises, not model assets.
const modelSource=html.match(/async function loadModel\(\) \{[^]*?\n\}/)[0].replace(/await import\([^]*?\)/,'await stubImport()');
let faceResolve,handResolve;const events=[];
const ctx={modelReady:false,isCameraRunning:true,faceDelegateUsed:null,handDelegateUsed:null,faceLandmarker:null,handLandmarker:null,ENFORCE_HAND_MODEL:false,FL:{pressStart:'Start'},runtimeQualityFlags:new Set(),console,
 stubImport:async()=>({FilesetResolver:{forVisionTasks:async()=>({})},FaceLandmarker:{createFromOptions:()=>new Promise(r=>{faceResolve=r;events.push('face')})},HandLandmarker:{createFromOptions:()=>new Promise(r=>{handResolve=r;events.push('hand')})}}),setUI:x=>events.push(x),saveTechnicalInvalid:()=>assert.fail('unexpected failure'),startBtn:{classList:{add(){}}}};
vm.createContext(ctx);vm.runInContext(modelSource+';globalThis.run=loadModel;',ctx);const loading=ctx.run();await new Promise(setImmediate);assert.equal(ctx.modelReady,false);assert.deepEqual(events,['face']);faceResolve({});await new Promise(setImmediate);assert.equal(ctx.modelReady,false);assert.deepEqual(events,['face','hand']);handResolve({});await loading;assert.equal(ctx.modelReady,true);assert.equal(events.at(-1).showStart,true);


// Terminal model failure keeps readiness false and invokes the existing error path.
const failures=[];const failCtx={...ctx,modelReady:false,faceLandmarker:null,handLandmarker:null,
 stubImport:async()=>({FilesetResolver:{forVisionTasks:async()=>({})},FaceLandmarker:{createFromOptions:async()=>{throw new Error('synthetic model failure')}}}),
 console:{error(){},warn(){}},saveTechnicalInvalid:(code)=>failures.push(code),startBtn:{classList:{add:c=>failures.push(c)}}};
vm.createContext(failCtx);vm.runInContext(modelSource+';globalThis.run=loadModel;',failCtx);await failCtx.run();assert.equal(failCtx.modelReady,false);assert.deepEqual(failures,['MODEL_LOAD_FAILED','hidden']);


// Stream attachment is the existing camera flag; it does not await decoded frames/play resolution.
const cameraSource=html.match(/function initCamera\(stream\)\{[^]*?\n\}/)[0];
for(const model of [false,true]) {
 const updates=[];const cameraCtx={modelReady:model,isCameraRunning:false,phase:'old',cameraRuntime:null,clearRecoveredCameraInvalid(){},runtimeQualityFlags:new Set(),document:{getElementById:()=>null},videoEl:{readyState:0,play:()=>new Promise(()=>{})},detectLoop(){updates.push('detect')},FL:{pressStart:'Start',loadingModel:'Preparing'},setUI:x=>updates.push(x)};
 vm.createContext(cameraCtx);vm.runInContext(cameraSource+';globalThis.run=initCamera;',cameraCtx);cameraCtx.run({getVideoTracks:()=>[{getSettings:()=>({width:640,height:480})}]});
 assert.equal(cameraCtx.isCameraRunning,true);assert.equal(cameraCtx.videoEl.readyState,0);assert.equal(updates.at(-1).showStart,model);assert.equal(cameraCtx.phase,'BEFORE_START');
}

console.log('PASS: read-only Public startup projection; localized atomic presentation; unchanged locale-first concurrent bootstrap and Face→Hand readiness/failure contracts');
