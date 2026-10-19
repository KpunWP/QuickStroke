import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const index=read('index.html'), face=read('face-test.html'), arm=read('arm-test.html');
const speech=read('speech-test.html'), result=read('result.html'), recorded=read('js/thai-recorded-audio.js');

const scriptPath='<script src="./js/languages.js?v=20260717-lang-v1"></script>';
const loader=index.indexOf(scriptPath), firstPicker=index.indexOf('QuickStrokeLanguages.renderPicker(');
assert.ok(loader>=0 && firstPicker>loader, 'Public home must load language code BEFORE inline renderPicker');
assert.equal(index.split(scriptPath).length-1, 1, 'Public should load language registry only once');
assert.equal((index.match(/QuickStrokeLanguages\.renderPicker\(/g)||[]).length,2, 'Public header and disclaimer must both show language selector');

for (const [name,html] of [['Face',face],['Arm',arm],['Speech',speech],['Result',result]]) {
  const reg=html.search(/<script src="\.\/js\/languages\.js/);
  const pick=html.indexOf('QuickStrokeLanguages.renderPicker(');
  assert.ok(reg>=0&&pick>reg,name+' must initialize language registry before picker');
}
for (const code of ['th-TH','en-US','ja-JP']) {
  const pack=JSON.parse(read('locales/'+code+'/ui.json'));
  assert.ok(pack.face?.restVoice?.trim()&&pack.face?.smileVoice?.trim(),code+' Face voice prompts');
  for (const field of ['instrDone_left','btnNext','vWait_left','vWait_right','vReady','vDone','btnConfirmStart_right']) {
    assert.ok(pack.arm?.[field]?.trim(),code+' Arm '+field);
  }
  assert.ok(pack.speech?.target?.trim()&&pack.speech?.preparePrompt?.trim(),code+' Speech phrase and readiness');
  assert.ok(pack.result,code+' Result locale');
}

assert.match(index,/await prepareScreeningSession\('full'\);[\s\S]*location\.href = \`\$\{screeningState\.nextModule\}-test\.html\`/);
assert.match(index,/await prepareScreeningSession\('individual'\);[\s\S]*location\.href = \`\$\{moduleName\}-test\.html\`/);
assert.match(face,/speakFace\(FL\.restVoice,\s*\{force:true\}\)/);
assert.match(face,/speakFace\(FL\.smileVoice,\s*\{force:true\}\)/);
// Regression: Full used to skip Arm/Speech and jump straight to Result when
// a stale or on-page Face retry was labeled "result_retry".
const routeSource=face.match(/function decideFaceCompletionTarget\([^]*?\n\}/)?.[0];
assert.ok(routeSource,'Face should expose a pure testable completion routing decision');
const faceNext=vm.runInNewContext(routeSource+'\ndecideFaceCompletionTarget', {});
const cases=[
  ['fresh Full', 'full',false,false,false,'arm-test.html'],
  ['stale Face result-retry Full', 'full',true,false,false,'arm-test.html'],
  ['repeated Face Full without Arm', 'full',true,false,true,'arm-test.html'],
  ['Full after Arm with missing Speech', 'full',true,true,false,'speech-test.html'],
  ['Full after on-page reattempt with Arm done', 'full',false,true,false,'arm-test.html'],
  ['completed Full explicit Result retry', 'full',true,true,true,'result.html'],
  ['Individual', 'individual',false,false,false,'result.html']
];
for(const [name,mode,retry,armDone,speechDone,expected] of cases) {
  assert.equal(faceNext(mode,retry,armDone,speechDone),expected,name);
}
assert.match(face,/const target = decideFaceCompletionTarget\([\s\S]*?Boolean\(sessionStorage\.getItem\('fast_arm'\)\),\s*Boolean\(sessionStorage\.getItem\('fast_speech'\)\)/);
assert.match(face,/btn\.dataset\.nextPage=target/);
assert.match(face,/navBtn\.textContent = faceCompletionNavLabel\(navBtn\.dataset\.nextPage/);
assert.match(index,/function clearAbandonedPublicResultRetry\(\)[\s\S]*?resolveMode\?\.\(\) \|\| 'public'\) === 'public'/);
for(const code of ['th-TH','en-US','ja-JP']) assert.ok(JSON.parse(read('locales/'+code+'/ui.json')).face.navSpeech);


assert.match(arm,/function startWait\(\)[\s\S]*?speakNow\(T\['vWait_'\+arm\]/);
assert.match(arm,/function startMeasure\(\)[\s\S]*?speak\(T\.vReady\)/);
assert.match(arm,/function rightArmConfirmationVoice\(\)/);
assert.match(arm,/speak\(rightArmConfirmationVoice\(\)\)/);
assert.match(arm,/if \(arm==='left'\) \{\s*setArmGuideStage\('right', 1\);[\s\S]*?\$\('instr'\)\.textContent = T\.instrDone_left;[\s\S]*?\$\('sub-instr'\)\.textContent = T\.btnNext;/);
assert.doesNotMatch(arm,/\$\('sub-instr'\)\.textContent = 'เริ่มทดสอบแขนขวา'/);
assert.match(arm,/function handleArmFastFlow\(\)[\s\S]*?speech-test\.html/);

assert.match(speech,/recognition\.lang\s*=\s*T\.langCode/);
assert.match(speech,/const SPEECH_SILENT_START_TRIAL = IS_IOS && !IOS_ASR_ONLY_TRIAL/);
assert.match(speech,/async function playSpeechInstructionBeforeCapture\(\)/);
assert.match(speech,/if \(SPEECH_SILENT_START_TRIAL\) return 'silent_trial'/);
assert.match(speech,/if \(!String\(T\?\.langCode \|\| ''\)\.toLowerCase\(\)\.startsWith\('th'\)\) return 'skipped'/);
assert.match(speech,/const firstUseStream = await ensureMicDisclosureBeforeFirstUse\(\)/);
assert.match(speech,/for \(const count of \[3,2,1\]\)/);
assert.match(speech,/markSpeechRecognitionReady\('audio_start'\)/);
assert.match(speech,/function handleFastFlow\(riskLevel\)[\s\S]*?window\.location\.href = 'result\.html'/);
assert.match(speech,/await stopAll\(true\)/);

// Both Thai recorded audio and browser TTS remain intentionally present.
// This is NOT an assertion of playback success on physical devices.
assert.match(recorded,/function isConsentedJssf\(\)/);
assert.match(recorded,/function use\(lang\)/);
assert.match(recorded,/function play\(text/);
assert.match(result,/if \(isRemoteJssf\) \{\s*showJssfTerminalState\(\);\s*speakJssfCompletionOnce\(session\.screeningSessionId\)/);

// No regression to JSSF-only iOS shortcut from ordinary Public.
assert.match(speech,/const IOS_JSSF_ASR_ONLY = IS_IOS && isConsentedJssfSpeech/);
assert.match(speech,/iosJssfContext\.appMode === 'research'/);

console.log('PASS: Public Full/Individual source routes; language loaders; TH/EN/JA prompt resources; Arm next-side localization');
console.log('PASS: Face/Arm/Speech source cue wiring, Speech ASR gating, JSSF isolation');
console.log('DEVICE UAT REQUIRED: audible output, exact order, iOS silent start, Android Thai recorded fallback, retry, permission and Result announcement');
console.log('KNOWN GAPS: Public iOS Speech has deliberately silent pre-capture cue; EN/JA Speech cue function skips pre-capture TTS; Public Result has no JSSF terminal voice');
