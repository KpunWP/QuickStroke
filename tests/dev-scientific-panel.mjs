import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const face = read('face-test.html');
const arm = read('arm-test.html');
const speech = read('speech-test.html');
const config = read('config.js');
const consent = read('jssf-consent.html');

// The existing modes and JSSF recruitment boundary must stay unchanged.
assert.match(config, /allowedModes:\s*\["public", "research", "dev"\]/);
assert.match(consent, /JSSF Remote/);
for (const [label, source, panel] of [
  ['face', face, 'face-science-panel'],
  ['arm', arm, 'arm-science-panel'],
  ['speech', speech, 'speech-science-panel']
]) {
  assert.match(source, new RegExp('id="' + panel + '"'), label + ': scientific panel exists');
  assert.match(source, new RegExp('#' + panel + '\\{display:none'), label + ': hidden by default');
}
assert.match(face, /body\.qs-science-dev-mode #face-science-panel\{display:block\}/);
assert.match(face, /if \(!FACE_SCIENCE_DEMO \|\| phase === 'FACE_DONE'/);
assert.match(face, /updateFaceSciencePanel\(smileL, smileR, smileAsym, yawDeg, pitchDeg, rollDeg, sampledPoseValid\)/);
assert.match(face, /finishFaceSciencePanel\(rep\)/);
assert.match(face, /drawFaceMesh\(lm\)/);
assert.match(face, /FACE_SCIENCE_DEMO = FACE_DEV_MODE && window\.QuickStrokeAppMode\?\.resolveMode\?\.\(\) === 'dev'/);

assert.match(arm, /body\.qs-science-dev-mode #arm-science-panel\{display:block\}/);
assert.match(arm, /const driftReady = \['MEASURE','BETWEEN','POST_TASK_QUESTION','DONE'\]/);
assert.match(arm, /set\('qs-arm-peak', driftReady \? formatDevAngle\(driftMax\) : '—'\)/);
assert.match(arm, /set\('qs-arm-source', gravitySource \|\| '—'\)/);
assert.match(arm, /function toggleArmDevPanel\(/);
assert.match(arm, /ARM_SCIENCE_DEMO = ARM_DEV_MODE && window\.QuickStrokeAppMode\?\.resolveMode\?\.\(\) === 'dev'/);

assert.match(speech, /body\.qs-science-dev-mode #speech-science-panel\{display:flex\}/);
assert.match(speech, /#test-screen\.speech-countdown-active #speech-science-panel\{display:none!important\}/);
assert.match(speech, /if \(!SPEECH_SCIENCE_DEMO\) return;/);
assert.match(speech, /speechScienceCompleted = \{/);
assert.match(speech, /coverage: Number\.isFinite\(transcriptCoverageRatio\)/);
assert.match(speech, /function updateDevLogTools\(/);
assert.match(speech, /SPEECH_SCIENCE_DEMO = DEBUG_ON && window\.QuickStrokeAppMode\?\.resolveMode\?\.\(\) === 'dev'/);
assert.doesNotMatch(speech.match(/<aside id="speech-science-panel"[\s\S]*?<\/aside>/)?.[0] || '', /transcript-box|textContent =.*transcript/i);
console.log('PASS developer-only read-only Face/Arm/Speech presenter panels; mode/consent boundaries retained');
