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
assert.doesNotMatch(measure, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'measurement must not hide guide');
assert.match(measure, /setArmGuideMeasurementMode\(true\);[\s\S]*showArmGuide\(\)/, 'measurement must keep compact guide');

assert.match(fn('finishArm'), /setArmGuideMeasurementMode\(false\);[\s\S]*showArmGuide\(\)/, 'post-measure must retain guide');
assert.match(fn('handleBtn'), /phase === 'BETWEEN' && arm === 'left'[\s\S]*arm = 'right';[\s\S]*startWait\(\)/, 'explicit next-arm action must switch to right flow');
assert.match(fn('updatePoseGuide'), /pose-left[\s\S]*arm === 'left'[\s\S]*pose-right[\s\S]*arm === 'right'/, 'guide activation must track arm side');

const reset = fn('resetAll');
assert.match(reset, /arm='left';[\s\S]*showArmGuide\(\)/, 'reset must restore left guide');
assert.doesNotMatch(reset, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'reset must not hide guide');

const flow = fn('handleArmFastFlow');
assert.match(flow, /window\.location\.href\s*=\s*['"]speech-test\.html['"]/, 'completed full flow must still go to Speech');
assert.doesNotMatch(flow, /pose-guide[^\n]*display\s*=\s*['"]none['"]/, 'guide must disappear by page transition, not early hide');

assert.match(source, /#test-screen\.arm-guide-measuring \.arm-wrap\{display:none!important;\}/, 'measurement layout must free vertical space');
assert.match(source, /@media \(max-height:760px\)[\s\S]*arm-guide-measuring[\s\S]*height:146px!important/, 'short phones need compact guide sizing');

console.log('PASS arm guide persistence UX regression');
