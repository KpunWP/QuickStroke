import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../arm-test.html', import.meta.url), 'utf8');

function fn(name) {
  const needle = `function ${name}(`;
  const start = source.indexOf(needle);
  assert.notEqual(start, -1, `${name}() must exist`);
  const next = source.indexOf('\nfunction ', start + needle.length);
  return source.slice(start, next === -1 ? source.length : next);
}

for (const asset of [
  'arm-left-step-1.webp','arm-left-step-2.webp','arm-left-step-3.webp',
  'arm-right-step-1.webp','arm-right-step-2.webp','arm-right-step-3.webp'
]) {
  assert.match(source, new RegExp(asset.replace('.', '\\\.')), `dedicated guide asset missing: ${asset}`);
}
assert.doesNotMatch(source, /arm-left-guide\.webp|arm-right-guide\.webp/, 'combined poster assets must no longer be used');
assert.doesNotMatch(source, /background-size:300%/, 'dedicated assets must not be poster-cropped');
assert.match(source, /guide-step-visual[\s\S]*object-fit:contain/, 'guide images must remain fully visible without cropping');
assert.match(source, /#pose-guide\[data-guide-step="1"\][\s\S]*step-1[\s\S]*data-guide-step="2"[\s\S]*step-2[\s\S]*data-guide-step="3"[\s\S]*step-3/, 'only the current progressive step should be shown');
assert.match(source, /guide-step-copy\{[^}]*text-align:center/, 'instruction copy must remain HTML below the artwork');

const setStage = fn('setArmGuideStage');
assert.match(setStage, /guide\.dataset\.guideSide = safeSide/);
assert.match(setStage, /guide\.dataset\.guideStep = String\(safeStep\)/);

const selectLang = fn('selectLang');
assert.match(selectLang, /arm = 'left';[\s\S]*setArmGuideStage\('left', 1\)[\s\S]*showArmGuide\(\)/, 'Arm page must start on left Step 1');

const handle = fn('handleBtn');
assert.match(handle, /phase === 'IDLE'[\s\S]*setArmGuideStage\('left', 2\)[\s\S]*confirmCurrentArmSide/, 'left confirmation tap must advance immediately to Step 2');
assert.match(handle, /phase === 'BETWEEN' && arm === 'left'[\s\S]*arm = 'right';[\s\S]*setArmGuideStage\('right', 2\)/, 'right confirmation tap must advance immediately to right Step 2');
assert.match(handle, /phase === 'RETRY_ARM'[\s\S]*setArmGuideStage\(arm, 2\)/, 'retry confirmation must return to Step 2');

const wait = fn('startWait');
assert.match(wait, /setArmGuideStage\(arm, 2\);[\s\S]*showArmGuide\(\)/, 'instruction/readiness must keep current side on Step 2');

const measure = fn('startMeasure');
const syncLayout = fn('syncArmGuideMeasurementLayout');
assert.match(syncLayout, /phase === 'MEASURE'[\s\S]*countdown\?\.style\.display === 'flex'[\s\S]*setArmGuideStage\(arm, 3\);[\s\S]*showArmGuide\(\)/, 'countdown presentation must switch to Step 3 without touching measurement logic');
assert.match(measure, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'frozen measurement line remains present while presentation CSS overrides it');
assert.match(source, /#pose-guide\{display:block!important;/, 'guide presentation must override the legacy inline hide');
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\.step-3[\s\S]*display:flex!important/, 'measurement must keep Step 3 visible');
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\.step-3 \.guide-step-copy\{display:block!important;\}/, 'Step 3 HTML instruction must remain visible during measurement');
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\.step-3 \.guide-step-visual[\s\S]*object-fit:contain!important/, 'measurement Step 3 must show the full dedicated image');

const retest = fn('showArmRetest');
assert.match(retest, /setArmGuideStage\(arm, 1\);[\s\S]*showArmGuide\(\)/, 'retest screen must return to Step 1 before confirmation');

const finish = fn('finishArm');
assert.match(finish, /arm==='left'[\s\S]*setArmGuideStage\('right', 1\)[\s\S]*armStartButtonText\('right'\)/, 'after left measurement, next-arm prompt must show right Step 1');
assert.match(finish, /setArmGuideStage\('right', 3\)[\s\S]*setTimeout\(showFinal, 600\)/, 'after right measurement, right Step 3 must persist into final transition');

const reset = fn('resetAll');
assert.match(reset, /phase='IDLE'; arm='left';[\s\S]*setArmGuideStage\('left', 1\)/, 'reset must restore left Step 1');

const updateGuide = fn('updatePoseGuide');
assert.match(updateGuide, /currentArmGuideSide\(\)/, 'guide side must be independent from measurement side during between-arm prompt');

const flow = fn('handleArmFastFlow');
assert.match(flow, /const speechMissing = !sessionStorage\.getItem\('fast_speech'\)/, 'Arm flow must detect an untested Speech module');
assert.match(flow, /mode === 'full' && \(!returningFromResultRetry \|\| speechMissing\)/, 'full flow Arm retry must continue to missing Speech');
assert.match(flow, /window\.location\.href\s*=\s*['"]speech-test\.html['"]/, 'completed full flow must still go to Speech');

const th = fs.readFileSync(new URL('../locales/th-TH/ui.json', import.meta.url), 'utf8');
const en = fs.readFileSync(new URL('../locales/en-US/ui.json', import.meta.url), 'utf8');
const ja = fs.readFileSync(new URL('../locales/ja-JP/ui.json', import.meta.url), 'utf8');
assert.match(th,/เหยียดแขนซ้ายไปข้างหน้าตามภาพ/);
assert.match(th,/เหยียดแขนขวาไปข้างหน้าตามภาพ/);
assert.doesNotMatch(th,/ค่อย ๆ ยกแขนซ้ายไปข้างหน้าจนถึงระดับไหล่/);
assert.match(th,/เริ่มแล้ว หลับตา ค้างแขนให้นิ่ง/);
assert.match(en,/Slowly raise your left arm forward to shoulder height/);
assert.match(en,/Start\. Close your eyes and keep your arm still\./);
assert.match(ja,/左腕をゆっくり前方へ肩の高さまで上げ/);
assert.doesNotMatch(ja,/お疲れ様でした。左腕をまっすぐ前に伸ばし/);
assert.match(source,/arm-left-step-1\.webp\?v=20261005-arm-image-hotfix-v2/);
assert.match(source,/arm-right-step-3\.webp\?v=20261005-arm-image-hotfix-v2/);
console.log('PASS arm progressive guide UX regression');
