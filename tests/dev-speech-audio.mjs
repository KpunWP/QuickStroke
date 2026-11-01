import fs from 'node:fs';import cp from 'node:child_process';import assert from 'node:assert/strict';import vm from 'node:vm';
const file='speech-test.html',source=fs.readFileSync(file,'utf8'),base=cp.execFileSync('git',['show','e0e1280f142e022f1b5b17688242d35a31ccc753:'+file],{encoding:'utf8'}),plan=JSON.parse(fs.readFileSync('tests/fixtures/dev-speech-audio-patch.json','utf8'));
assert.deepEqual(Object.keys(plan),[file]);let restored=source;
for(const op of [...plan[file]].reverse()){assert.equal(restored.split(op.after).length,2);restored=restored.replace(op.after,op.before);}assert.equal(restored,base,'All changes explicitly inventoried; all remaining engine/audio/ASR/scoring/navigation bytes exact');
function section(s,a,b){return s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)))}
for(const [a,b]of [['async function beginSpeechRecognition()', '// ═══ iOS KEEP-ALIVE MODE'],['async function handleAction()', '// Public iPhone retry:'],['async function startRecording(', '// iPhone Public:'],['function evaluateSpeech(', '// FAST FLOW']]){
 const before=section(base,a,b),after=section(source,a,b);assert.ok(before.length>100,a);if(a==='async function handleAction()')assert.equal(after.replace('!DEMO_SPEECH_AUDIO && ',''),before);else assert.equal(after,before,a+' unchanged');
}
const gate=source.match(/const DEMO_SPEECH_AUDIO =[^]*?;/)[0];for(const mode of ['public','research','dev',undefined])for(const eligible of [false,true])for(const trial of [false,true]){const c={iosJssfContext:{appMode:mode},IOS_ASR_ONLY_TRIAL:trial,QuickStrokeDemoPresentation:{enabled:()=>eligible}};vm.createContext(c);vm.runInContext(gate+'\nthis.result=DEMO_SPEECH_AUDIO;',c);assert.equal(c.result,!trial&&mode==='dev'&&eligible);}
const cue=section(source,'async function playDemoSpeechReadyCues(', 'async function startRecording(');assert.ok(cue.indexOf('await releasePublicSpeakerFirstCalibrationMic')<cue.indexOf('await speakSpeechCue'));assert.ok(cue.indexOf('await playPublicIosUnifiedCountdown')<cue.indexOf('await restorePublicSpeakerFirstMic'));assert.ok(cue.indexOf('speechSynthesis?.cancel')<cue.indexOf('await restorePublicSpeakerFirstMic'));assert.doesNotMatch(cue,/beginSpeechRecognition\(|\.start\(|fetch\(|localStorage|sessionStorage|queueTtsTelemetry/);
for(const f of ['face-test.html','arm-test.html','index.html','result.html','js/app-mode.js','js/data-contract.js','js/technical-demo.js','js/thai-recorded-audio.js','service-worker.js','locales/th-TH/ui.json','locales/en-US/ui.json','locales/ja-JP/ui.json','audio/th/arm_11_alert_local_emergency_v2.mp3'])assert.ok(fs.readFileSync(f).equals(cp.execFileSync('git',['show','e0e1280f142e022f1b5b17688242d35a31ccc753:'+f])),f+' frozen');
console.log('PASS: strict Dev-only audio gate; exact unchanged ASR callbacks, acquisition/Retry, calibration/scoring/navigation, Public flags, all other pages/audio/assets/SW; voice output before capture.');
// This revision must not change any accepted b114 acquisition/ASR/calibration behavior.
const revision=JSON.parse(fs.readFileSync('tests/fixtures/dev-speech-audio-safari-revision.json','utf8'));
let original=source;for(const op of [...revision[file]].reverse()){assert.equal(original.split(op.after).length,2);original=original.replace(op.after,op.before);}
assert.equal(original,cp.execFileSync('git',['show','b114d8446e458f3909aea162c94fe2fcc49fb408:'+file],{encoding:'utf8'}));
const debug=section(source,'// Explicit engineering-only, in-memory audio evidence.', 'function speechCuePlan(');
assert.doesNotMatch(debug,/fetch\(|sendBeacon|XMLHttpRequest|indexedDB|localStorage|sessionStorage|getUserMedia|beginSpeechRecognition|T\.target|speechAttempt|derivedMetrics|rawObservations/);
for(const enabled of [false,true])for(const flag of [false,true]){
 const c={URLSearchParams,location:{search:flag?'?speechAudioDebug=1':''},performance:{now:()=>100},DEMO_SPEECH_AUDIO:enabled,iosJssfContext:{appMode:enabled?'dev':'public'},phase:'IDLE',audioCtx:null,streamRef:null,recognitionStarted:false,T:{langCode:'en-US'},navigator:{audioSession:{type:'playback'}},hasLiveAudioTrack:()=>false,QuickStrokeDemoPresentation:{enabled:()=>enabled},QuickStrokeAppMode:{resolveMode:()=>enabled?'dev':'public',getAnalysisRole:()=>enabled?'engineering_only':'public_ephemeral'},speechSynthesis:{getVoices:()=>[{lang:'en-US',name:'Do not collect this name'}]}};c.window=c;vm.createContext(c);vm.runInContext(debug,c);
 vm.runInContext("demoAudioNote('engine','ASR_PRIVATE_TRANSCRIPT_SHOULD_NOT_APPEAR');for(let i=0;i<100;i++)demoAudioNote('diagnostic','ready');this.report=demoAudioSummary();this.count=demoAudioEvents.length;",c);
 const report=JSON.parse(c.report);assert.equal(c.count,enabled&&flag?60:0);assert.doesNotMatch(c.report,/PRIVATE_TRANSCRIPT|Do not collect this name|voiceURI|screeningSessionId|testAttemptId/);if(enabled&&flag){assert.equal(report.events.length,24);assert.ok(report.dropped>0);assert.equal(report.state.eligible,true);}
}
console.log('PASS: b114 runtime boundary, explicit strict-Dev diagnostic gate, bounded language-only/status allowlist, no media/participant payloads/network/persistence.');

for(const block of source.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g))if(block[1].trim())new vm.Script(block[1]);
console.log('PASS: all inline Speech scripts parse.');

const voiceContext={window:{speechSynthesis:{getVoices:()=>[...Array.from({length:40},(_,i)=>({lang:'en-X'+String(i).padStart(2,'0')})),{lang:'th-TH'}]}}};vm.createContext(voiceContext);vm.runInContext(section(source,'function demoVoiceLanguages()', 'function demoAudioState()')+'this.languages=demoVoiceLanguages();',voiceContext);assert.ok(voiceContext.languages.includes('th-TH'),'Selected-language evidence cannot disappear behind a voice-list cap');
