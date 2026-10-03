import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const result=fs.readFileSync(new URL("../result.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

const ensureStart=face.indexOf("function ensureEarlySafetyAction");
const exitStart=face.indexOf("async function exitToEarlySafetyResult",ensureStart);
const homeStart=face.indexOf("function goBackHome",exitStart);
assert.ok(ensureStart>=0 && exitStart>ensureStart && homeStart>exitStart);

const ensureFn=face.slice(ensureStart,exitStart);
const exitFn=face.slice(exitStart,homeStart);

// Safety action is offered only after resting abnormal evidence; it is not auto-executed.
assert.match(ensureFn,/if \(!criticalFired\) return/);
assert.match(ensureFn,/face-early-safety-btn/);
assert.match(ensureFn,/btn\.onclick=async\(\)=>/);
assert.match(ensureFn,/await exitToEarlySafetyResult\(\)/);

const criticalTrigger=face.slice(
  face.indexOf("if (avg > REST_ASYM_CRITICAL"),
  face.indexOf("/* ── ACTION:",face.indexOf("if (avg > REST_ASYM_CRITICAL"))
);
assert.match(criticalTrigger,/criticalFired = true/);
assert.match(criticalTrigger,/ensureEarlySafetyAction\(\)/);
assert.doesNotMatch(criticalTrigger,/exitToEarlySafetyResult\(\)/);

// Choosing safety exit creates a distinct research reason and preserves resting abnormal.
assert.match(exitFn,/EARLY_SAFETY_EXIT/);
assert.match(exitFn,/captureAttempt\('invalid','EARLY_SAFETY_EXIT'/);
assert.match(exitFn,/patientSafetyExit:true/);
assert.match(exitFn,/actionPerformed:false/);
assert.match(exitFn,/resting_asymmetry_early_safety_exit/);
assert.match(exitFn,/saveAndShow\(20,'bad'/);
assert.match(exitFn,/smileActionPerformed:false/);

// Research persistence is given a bounded flush opportunity before leaving the module.
assert.match(exitFn,/flushFaceResearchPersistence\(\)/);
assert.match(exitFn,/window\.location\.href='result\.html'/);

// If the participant does not choose early exit but later cannot smile, rest abnormal
// remains independent safety evidence rather than becoming technical invalid only.
const invalidStart=face.indexOf("function finishInvalid");
const invalidEnd=face.indexOf("function addNavButton",invalidStart);
const invalidFn=face.slice(invalidStart,invalidEnd);
assert.match(invalidFn,/if \(criticalFired\)/);
assert.match(invalidFn,/resting_asymmetry_with_unassessable_smile/);
assert.match(invalidFn,/saveAndShow\(20, 'bad'/);

// Result page already treats one abnormal module as urgent even when protocol incomplete
// and renders a direct emergency action.
assert.match(result,/SINGLE_POSITIVE_OVERRIDE && bad\.length/);
assert.match(result,/state = 'urgent'/);
assert.match(result,/className = 'emergency-call'/);
assert.match(result,/location\.href = `tel:\$\{phone\}`/);

assert.match(config,/version:\s*"face-prepilot-1\.6\.0"/);
assert.match(config,/algorithmVersion:\s*"face-asymmetry-1\.6\.0"/);

console.log("PASS: resting abnormal offers optional early safety exit without auto-stopping research flow, preserves bad evidence, and reaches emergency guidance");
