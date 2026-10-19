import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),speech=read('speech-test.html'),result=read('result.html'),arm=read('arm-test.html');
const ja=JSON.parse(read('locales/ja-JP/ui.json'));
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
assert.match(speech,/id="speech-voice-uat"/);
assert.match(speech,/function playPublicSpeechUatCue\(\)/);
assert.match(speech,/if \(!PUBLIC_SPEECH_TTS_TRIAL \|\| !\['IDLE','DONE'\]\.includes\(phase\)\) return/);
assert.match(result,/const PUBLIC_RESULT_TTS_TRIAL = APP_MODE_NAME === 'public'/);
assert.match(result,/function playPublicResultTts\(\)/);
assert.match(result,/if \(!PUBLIC_RESULT_TTS_TRIAL \|\| !isPublicResultSession\(\)\) return/);
assert.match(result,/id="public-result-tts" type="button" hidden/);
assert.match(result,/button\.onclick=playPublicResultTts/);
assert.match(result,/configurePublicResultTts\(\)/);
assert.match(result,/utterance\.volume=1/);
assert.match(result,/const plan=jssfCompletionSpeechPlan\(jssfSpeechLocale\(\)\)/);
assert.match(result,/if \(isRemoteJssf\) \{\s*showJssfTerminalState\(\);\s*speakJssfCompletionOnce\(session\.screeningSessionId\)/);
console.log('PASS Public opt-in voice experiment isolated to Public TH/EN/JA');
console.log('PASS Japanese Arm voice short; Speech TTS before mic; Result TTS replay; JSSF paths unchanged by trial');
console.log('DEVICE UAT STILL REQUIRED: actual iOS/Android TTS playback and iOS mic retry after using Speech voice test');
