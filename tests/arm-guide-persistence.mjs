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

assert.match(source, /arm-left-guide\.webp\?v=20261005-arm-guide-v1/);
assert.match(source, /arm-right-guide\.webp\?v=20261005-arm-guide-v1/);

assert.match(fn('selectLang'), /arm = 'left';[\s\S]*showArmGuide\(\)/, 'default page state must show left guide');
assert.match(fn('startWait'), /setArmGuideMeasurementMode\(false\);[\s\S]*showArmGuide\(\)/, 'readiness must retain guide');

const measure = fn('startMeasure');
assert.match(measure, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'protected measurement function remains byte-compatible with the frozen baseline');
assert.match(source, /#pose-guide\{[^}]*display:block!important;/, 'presentation layer must override the legacy inline hide');
assert.match(fn('observeArmGuideMeasurementLayout'), /MutationObserver[\s\S]*attributeFilter:\['style'\]/, 'view-only observer must track countdown visibility');
assert.match(fn('syncArmGuideMeasurementLayout'), /phase === 'MEASURE'[\s\S]*countdown\?\.style\.display === 'flex'[\s\S]*setArmGuideMeasurementMode\(measuring\)/, 'compact measurement layout must derive from existing view state');

assert.match(fn('finishArm'), /setArmGuideMeasurementMode\(false\);[\s\S]*showArmGuide\(\)/, 'post-measure must retain guide');
assert.match(fn('handleBtn'), /phase === 'BETWEEN' && arm === 'left'[\s\S]*arm = 'right';[\s\S]*startWait\(\)/, 'explicit next-arm action must switch to right flow');
const updateGuide = fn('updatePoseGuide');
assert.match(updateGuide, /pose-left[\s\S]*classList\.toggle\('active', arm === 'left'\)/, 'left guide activation must track left arm state');
assert.match(updateGuide, /pose-right[\s\S]*classList\.toggle\('active', arm === 'right'\)/, 'right guide activation must track right arm state');

const reset = fn('resetAll');
assert.match(reset, /arm='left';[\s\S]*showArmGuide\(\)/, 'reset must restore left guide');
assert.doesNotMatch(reset, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'reset must not hide guide');

const flow = fn('handleArmFastFlow');
assert.match(flow, /window\.location\.href\s*=\s*['"]speech-test\.html['"]/, 'completed full flow must still go to Speech');
assert.doesNotMatch(flow, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'guide must disappear by page transition, not early hide');

assert.match(source, /#test-screen\.arm-guide-measuring \.arm-wrap\{display:none!important;\}/, 'measurement layout must free vertical space');
assert.match(source, /guide-step-left-1/);
assert.match(source, /guide-step-right-3/);
assert.match(source, /ค่อย ๆ ยกแขน\$\{sideName\}ขึ้นไปข้างหน้าจนถึงระดับไหล่/);
assert.match(source, /ค้างแขนตรงให้นิ่ง/);
const guideCopy = fn('armGuideInstructionCopy');
assert.match(guideCopy, /const lang = currentLangCode\(\)/, 'guide copy must use the Arm locale state');
assert.doesNotMatch(guideCopy, /\bLANG\b/, 'guide copy must not reference an undeclared global LANG');
assert.match(source, /class="guide-step-visual step-1"/, 'step 1 must have its own visual crop');
assert.match(source, /class="guide-step-visual step-2"/, 'step 2 must have its own visual crop');
assert.match(source, /class="guide-step-visual step-3"/, 'step 3 must have its own visual crop');
assert.match(source, /guide-title-left-1/);
assert.match(source, /guide-title-right-3/);
assert.match(source, /guide-step-visual\.step-1\{background-position-x:left;\}/);
assert.match(source, /guide-step-visual\.step-2\{background-position-x:center;\}/);
assert.match(source, /guide-step-visual\.step-3\{background-position-x:right;\}/);
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\.step-3[\s\S]*display:flex!important/, 'measurement must keep only step 3 visible');
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\.step-3 \.guide-step-copy\{display:none!important;\}/, 'measurement must hide overview copy and enlarge the visual');
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\.step-3 \.guide-step-visual[\s\S]*background-position:right bottom!important/, 'measurement must focus the side-specific step 3 crop');
assert.match(source, /arm-guide-measuring #pose-guide \.guide-step\{display:none!important;\}/, 'measurement view must hide non-active guide steps');
assert.match(source, /arm-guide-measuring #arm-hold-cue\{display:block!important;\}/, 'measurement view must show a large hold-still cue');
assert.match(source, /@media \(max-height:760px\)[\s\S]*arm-guide-measuring[\s\S]*min-height:178px!important/, 'short phones need compact Step 3 sizing');

console.log('PASS arm guide persistence UX regression');
