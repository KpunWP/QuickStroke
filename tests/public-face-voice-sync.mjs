import assert from 'node:assert/strict';
import fs from 'node:fs';
const face=fs.readFileSync(new URL('../face-test.html', import.meta.url),'utf8');
const speech=fs.readFileSync(new URL('../speech-test.html',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

const voice=face.slice(face.indexOf('function speakFace(txt, opts={}){'),face.indexOf('let __lastCountdownShown'));
assert.match(voice,/ut\.onstart = \(\) => \{\s*started = true;\s*opts\.onstart\?\.\(\)/);
assert.match(voice,/const playRecorded=\(\)=>\{/);
assert.match(voice,/opts\.onstart\?\.\(\)/);

const start=face.slice(face.indexOf('function startScreening(){'),face.indexOf('function calibrationTick(){'));
assert.match(start,/const publicMode=window\.QuickStrokeAppMode\?\.resolveMode\?\.\(\)==='public'/);
assert.match(start,/FACE_DATA_CONTRACT\?\.getSessionContext\?\.\(\)\?\.appMode==='public'/);
assert.match(start,/if \(!publicMode\) \{[\s\S]*?speakFace\(FL\.restVoice, \{force:true\}\);[\s\S]*?showCenterCountdown\(countdownVal\);/);
assert.match(start,/faceNeutralCountdownPending=true/);
assert.match(start,/const beginNeutralCount=\(\)=>\{/);
assert.match(start,/if \(!faceNeutralCountdownPending \|\| phase!=='RESTING_PHASE'[\s\S]*?screeningStartedAtMs!==thisRun\) return/);
assert.match(start,/faceNeutralCountdownPending=false;\s*baselineWaitStartMs=Date\.now\(\);/);
assert.match(start,/restCornerAsymSamples=\[\]; restCornerL=\[\]; restCornerR=\[\]; restEyeW=\[\]/);
assert.match(start,/showCenterCountdown\(countdownVal\);\s*countdownTimer=setInterval\(calibrationTick,1000\)/);
assert.ok(start.indexOf('speakFace(FL.restVoice,{force:true,onstart:beginNeutralCount})')>start.indexOf('const beginNeutralCount='));
assert.match(start,/setTimeout\(\(\)=>\{[\s\S]*?speechSynthesis\.cancel\(\);[\s\S]*?beginNeutralCount\(\);[\s\S]*?\},3000\)/);
assert.match(face,/if \(phase==='RESTING_PHASE' && faceNeutralCountdownPending\) return;/);
assert.match(face,/faceNeutralCountdownPending=false;\s*countdownVal=CALIBRATION_SECONDS/);
assert.match(face,/function calibrationTick\(\)/);

// Countdown request and Speech default are deliberately not conflated:
// normal Public iPhone currently has visual-only counts. A spoken countdown
// experiment is opt-in and must not silently change the JSSF capture path.
assert.match(speech,/const PUBLIC_SPEECH_TTS_TRIAL = iosJssfContext\.appMode === 'public'/);
assert.match(speech,/else if \(PUBLIC_SPEECH_TTS_TRIAL\) \{\s*await playPublicTtsCountdownDigit\(count\)/);
assert.match(speech,/const SPEECH_SILENT_START_TRIAL = IS_IOS && !IOS_ASR_ONLY_TRIAL/);
assert.match(index,/if \(publicTtsQuery === '1'\) sessionStorage\.setItem\('qs_public_tts_trial', '1'\)/);
console.log('PASS: Face Public countdown synchronizes to native voice onstart, begins baseline together, has bounded visual fallback; JSSF timing intact');
console.log('PASS: Speech Public spoken count remains explicitly opt-in pending safe real-device iOS microphone validation');
