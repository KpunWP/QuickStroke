import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),speech=read('speech-test.html'),result=read('result.html'),arm=read('arm-test.html');
const ja=JSON.parse(read('locales/ja-JP/ui.json'));
const en=JSON.parse(read('locales/en-US/ui.json'));
for(const side of ['left','right']) {
  assert.equal(en.arm['vWait_'+side], 'Raise your '+side+' arm forward and hold still.');
  assert.ok(en.arm['vWait_'+side].length<55);
}
for(const side of ['left','right']) {
  assert.ok(ja.arm['vWait_'+side].length<=30,'Japanese '+side+' raise-arm voice must remain brief');
  assert.match(ja.arm['vWait_'+side],/腕を前に伸ばし/);
  assert.match(ja.arm['vWait_'+side],/動かさないでください/);
}
assert.match(arm,/speakNow\(T\['vWait_'\+arm\], \(\) => \{/);
assert.match(index,/const publicTtsQuery = new URLSearchParams\(location\.search\)\.get\('publicTtsTrial'\)/);
assert.match(index,/if \(\(APP_MODE\?\.resolveMode\?\.\(\) \|\| 'public'\) === 'public'\)/);
assert.match(index,/else if \(publicTtsQuery === '0'\) sessionStorage\.removeItem\('qs_public_tts_trial'\)/);
assert.match(speech,/const PUBLIC_SPEECH_TTS_TRIAL = iosJssfContext\.appMode === 'public'/);
assert.match(speech,/sessionStorage\.getItem\('qs_public_tts_trial'\) === '1'/);
assert.match(speech,/&& !IOS_ASR_ONLY_TRIAL/);
const prep=speech.slice(speech.indexOf('async function playSpeechInstructionBeforeCapture()'),speech.indexOf('let iosInitialPreparePromise'));
assert.ok(prep.indexOf('if (PUBLIC_SPEECH_TTS_TRIAL)')>=0);
assert.ok(prep.indexOf('await speakSpeechCue(message)')>prep.indexOf('if (PUBLIC_SPEECH_TTS_TRIAL)'));
assert.ok(prep.indexOf('if (SPEECH_SILENT_START_TRIAL)')>prep.indexOf('await speakSpeechCue(message)'));
assert.match(speech,/const firstUseStream = await ensureMicDisclosureBeforeFirstUse\(\);/);
assert.match(speech,/if \(PUBLIC_SPEECH_TTS_TRIAL\)/);
assert.match(speech,/async function playPublicTtsCountdownDigit\(count\)/);
assert.match(speech,/await playPublicTtsCountdownDigit\(count\)/);
assert.match(speech,/if \(!ANDROID_JSSF_SPEECH_CUES && !PUBLIC_SPEECH_TTS_TRIAL\) await sleep\(1000\)/);
const trials=speech.slice(speech.indexOf("for (const count of [3,2,1])",speech.indexOf("async function playPublicTtsCountdownDigit")),speech.indexOf("const cueStatus = 'visual_only'",speech.indexOf("async function playPublicTtsCountdownDigit")));
assert.ok(trials.indexOf('await playPublicTtsCountdownDigit(count)')>=0);
assert.ok(trials.indexOf('await playPublicTtsCountdownDigit(count)')<trials.indexOf("const cueStatus") || !trials.includes("const cueStatus"));
assert.match(speech,/releaseMicAfterSpeechResult\(ANDROID_JSSF_SPEECH_CUES \|\| PUBLIC_SPEECH_TTS_TRIAL\)/);
const closeSpeech=speech.slice(speech.indexOf("const cleanupAfterResult = releaseMicAfterSpeechResult("),speech.indexOf("requestAnimationFrame(() => {",speech.indexOf("const cleanupAfterResult = releaseMicAfterSpeechResult(")));
assert.match(closeSpeech,/if \(PUBLIC_SPEECH_TTS_TRIAL\) \{/);
assert.ok(closeSpeech.indexOf("void cleanupAfterResult.then")<closeSpeech.indexOf("speakSpeechCue(message)"));
assert.match(closeSpeech,/if\(phase!=='DONE' \|\| audioStartToken!==finishedAudioToken\)return/);
assert.match(closeSpeech,/PUBLIC_TTS_COMPLETION_UNAVAILABLE/);
assert.match(speech,/function preparePublicSpeechPlaybackSession\(\)/);
assert.match(speech,/navigator\.audioSession\.type='playback'/);
assert.match(result,/const PUBLIC_RESULT_TTS_TRIAL = APP_MODE_NAME === 'public'/);
assert.match(result,/function playPublicResultTts\(\)/);
assert.match(result,/if \(!PUBLIC_RESULT_TTS_TRIAL \|\| !isPublicResultSession\(\)\) return/);
assert.match(result,/configurePublicResultTts\(\)/);
assert.match(result,/utterance\.volume=1/);
assert.match(result,/setTimeout\(\(\)=>\{\s*if\(PUBLIC_RESULT_TTS_TRIAL && isPublicResultSession\(\)\)playPublicResultTts\(\)/);
assert.match(result,/const canRecorded=LANG==='th' && !!recorded\?\.fileFor\?\.\(thaiText\)/);
assert.match(result,/void playRecorded\(\)/);
assert.match(result,/const plan=jssfCompletionSpeechPlan\(jssfSpeechLocale\(\)\)/);
assert.match(result,/if \(isRemoteJssf\) \{\s*showJssfTerminalState\(\);\s*speakJssfCompletionOnce\(session\.screeningSessionId\)/);
console.log('PASS Public opt-in voice experiment isolated to Public TH/EN/JA');
console.log('PASS English/Japanese Arm concise; opt-in spoken countdown; automatic Speech/Result completion; JSSF unchanged');
console.log('DEVICE UAT STILL REQUIRED: actual iOS/Android TTS playback and Speech retries');

// Regression for iPhone live-mic spoken countdown route in Public UAT:
// number words are localized, the synthesizer is NOT reset between digits,
// and failure must be visible while retaining a WebAudio tone/visual fallback.
const numberFn=speech.match(/function publicCountdownSpeechWord\(count\) \{[^]*?\n\}/)?.[0];
assert.ok(numberFn,'Public countdown must define a locale-aware number renderer');
for(const [language,expected] of [
  ['th-TH',['สาม','สอง','หนึ่ง']],
  ['en-US',['Three','Two','One']],
  ['ja-JP',['三','二','一']]
]) {
  const fn=vm.runInNewContext(numberFn+'\npublicCountdownSpeechWord',{T:{langCode:language}});
  assert.deepEqual([3,2,1].map(n=>fn(n)),expected,language+' TTS spoken numbers');
}
const digitPlayer=speech.slice(speech.indexOf('async function playPublicTtsCountdownDigit(count) {'),speech.indexOf('// Android JSSF: each verified Thai MP3'));
assert.ok(digitPlayer.startsWith('async function playPublicTtsCountdownDigit'));
assert.match(digitPlayer,/if\(count===3\)synth\.cancel\(\)/,'only reset speech synthesis before first digit');
assert.doesNotMatch(digitPlayer,/^\s*synth\.cancel\(\);/m,'never cancel before EVERY iPhone digit');
assert.match(digitPlayer,/const backupBeep=status!=='ended' && IS_IOS \? playVisualCountdownBeep\(\) : false/);
console.log('PASS: iPhone 3-2-1 spoken number words, no repeated synthesizer reset, safe tone fallback');


assert.doesNotMatch(speech,/id="speech-voice-uat"|id="speech-voice-uat-status"|id="public-countdown-audio-status"/);
assert.doesNotMatch(speech,/ios-exclusive-asr-trial-status|iOS STANDARD · WEB AUDIO \+ ASR|iOS JSSF · ASR ONLY/);
assert.doesNotMatch(speech,/function playPublicSpeechUatCue\(|function showPublicCountdownAudioStatus\(/);
assert.doesNotMatch(result,/id="public-result-tts"|id="public-result-tts-status"|button\.onclick=playPublicResultTts/);
assert.match(speech,/const message=publicSpeechCompletionText\(\);[\s\S]*?preparePublicSpeechPlaybackSession\(\);[\s\S]*?let status=await speakSpeechCue\(message\)/);
assert.match(speech,/const backupBeep=status!=='ended' && IS_IOS \? playVisualCountdownBeep\(\) : false/);
assert.match(result,/function configurePublicResultTts\(\) \{[\s\S]*?if\(!available \|\| publicResultAutoVoiceAttempted\)return;[\s\S]*?playPublicResultTts\(\)/);
console.log('PASS: no playback buttons, iOS badge or countdown TTS status; automatic audio remains wired');
