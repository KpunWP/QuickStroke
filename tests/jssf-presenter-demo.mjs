// JSSF 2026 presenter code-path/contract checks. Not a substitute for real device UAT.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const presenter=read("presenter-demo.html");
const sw=read("service-worker.js");
const index=read("index.html");
const result=read("result.html");
const face=read("face-test.html");
const arm=read("arm-test.html");
const speech=read("speech-test.html");
const remote=read("js/jssf-remote-sync.js");

const script=presenter.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script,"Presenter inline script exists");
new vm.Script(script[1],{filename:"presenter-demo.inline.js"});
assert.match(presenter,/<html lang="en">/);
assert.match(presenter,/<iframe id="engine-frame"[^>]+allow="camera; microphone; accelerometer; gyroscope"/);
assert.match(presenter,/id="gate-error" role="alert"/);
assert.match(script[1],/if\(!safeDemoSession\(sessionStorage\)\)\s*\{[\s\S]*?return;/);
assert.match(script[1],/resetPublicSession\(sessionStorage\)/);
assert.match(script[1],/URLS=\{face:"face-test\.html\?mode=public&mesh=1",arm:"arm-test\.html\?mode=public",speech:"speech-test\.html\?mode=public"\}/);
assert.doesNotMatch(script[1],/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|indexedDB)\s*\(/,
  "The presenter may not make direct uploads or persist research media");
assert.doesNotMatch(presenter,/rawFrames|rawLandmarks|recordedAudio/);
assert.match(script[1],/contentWindow\.location\.pathname/);
assert.match(script[1],/pick\("drift-num"\)/);
assert.match(script[1],/pick\("word-target"\)/);
assert.match(script[1],/pick\("transcript-box"\)/);

// Execute the actual fail-closed guard and displayed-drift parser.
const guardCode=script[1].slice(script[1].indexOf("function safeDemoSession("),script[1].indexOf("function resetPublicSession("));
const driftCode=script[1].slice(script[1].indexOf("function parseDrift("),script[1].indexOf("function text("));
assert.ok(guardCode.startsWith("function safeDemoSession(")&&driftCode.startsWith("function parseDrift("));
const {safeDemoSession,parseDrift}=new Function(guardCode+"\n"+driftCode+"\nreturn {safeDemoSession,parseDrift};")();
const store=values=>{
  const data=new Map(Object.entries(values||{}));
  return {get length(){return data.size},key:i=>[...data.keys()][i],
    getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),
    removeItem:k=>data.delete(k)};
};
assert.equal(safeDemoSession(store({})),true);
assert.equal(safeDemoSession(store({fast_session_app_mode:"public",fast_session_analysis_role:"public_ephemeral"})),true);
for(const values of [
  {quickstroke_selected_app_mode:"research"},
  {quickstroke_selected_app_mode:"dev"},
  {fast_session_app_mode:"research"},
  {fast_session_app_mode:"dev"},
  {fast_session_analysis_role:"research_candidate"},
  {fast_session_research_metadata:"{}"},
  {quickstroke_research_context:"{}"},
  {quickstroke_dev_mode:"1"},
  {fast_dev_mode:"1"},
  {jssf_remote_enrollment_token:"present"}
])assert.equal(safeDemoSession(store(values)),false,JSON.stringify(values));
assert.equal(parseDrift("1.40°"),1.4);
assert.equal(parseDrift("0.0°"),0);
assert.equal(parseDrift("not measuring"),null);
assert.equal(parseDrift("500°"),null);

// Reuse existing engines in their Public mode rather than cloning the algorithms.
assert.match(face,/const DEV_MESH = FACE_DEV_MODE \|\| new URLSearchParams\(location\.search\)\.has\('mesh'\)/);
assert.match(arm,/id="drift-num"/);
assert.match(speech,/recognition\.lang\s*=\s*T\.langCode/);
assert.match(speech,/id="word-target"/);
assert.match(speech,/id="transcript-box"/);

// No direct JSSF uploads from a public-ephemeral session.
assert.match(remote,/value\.appMode === "research"[\s\S]*?researchProfile === "community_remote_qr"[\s\S]*?consentStatus === "consented"/);
assert.match(index,/id="combined-view"/);
assert.match(index,/id="individual-view"/);
assert.match(index,/body:not\(\.qs-technical-entry\) \.mode-zone/);
assert.match(index,/body:not\(\.qs-technical-entry\) \.dev-zone/);
assert.match(index,/body:not\(\.qs-technical-entry\) \.jssf-draft-zone/);
assert.match(index,/params.get\('tools'\) === '1'/);
assert.match(index,/document.body.classList.toggle\('qs-technical-entry', technicalEntry\)/);

assert.match(index,/prepareScreeningSession\('full'\)/);
assert.match(index,/prepareScreeningSession\('individual'\)/);
assert.match(result,/function moduleStatus\(name, d\) \{[\s\S]*?if \(!d\) return \{[\s\S]*?text: T\.notTested/);
assert.match(result,/const scope = mode === 'individual' && source \? 'individual' : 'combined'/);
assert.match(result,/if \(scope === 'individual'\)/);

// Install must fail if Presenter + original engines, local packs or model assets cannot be cached.
assert.match(sw,/quickstroke-pwa-v102/);
for(const path of [
 "/presenter-demo.html","/index.html","/face-test.html","/arm-test.html",
 "/speech-test.html","/result.html","/locales/en-US/ui.json",
 "/locales/ja-JP/ui.json","/locales/th-TH/ui.json",
 "/models/face_landmarker.task","/models/tasks-vision/vision_bundle.mjs",
 "/models/wasm/vision_wasm_internal.wasm"
])assert.ok(sw.includes('"'+path+'"'),"Offline asset not in Service Worker: "+path);
assert.match(sw,/const REQUIRED_OFFLINE_ASSETS = \[\s*\.\.\.CORE_SHELL,\s*\.\.\.FACE_OFFLINE_ASSETS/);

console.log("PASS: Presenter inline JS syntax, engine reuse, isolation, i18n and PWA asset contract");
console.log("PASS: Result not-tested/individual and JSSF upload gates unchanged");
console.log("NOTE: Browser permissions, real ASR/TTS, drift, tracking and airplane-mode need phone/iPad UAT");
