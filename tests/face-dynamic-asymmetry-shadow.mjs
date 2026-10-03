import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

const blendStart=face.indexOf("function pairedBlendAsymmetry");
const geomStart=face.indexOf("function pairedGeometryAsymmetry");
const summaryStart=face.indexOf("function summarizeDynamicAsymmetry");
const attemptStart=face.indexOf("function captureAttempt");
const finishStart=face.indexOf("function finishFace");
const finishEnd=face.indexOf("function saveAndShow",finishStart);
assert.ok(blendStart>=0 && geomStart>blendStart && summaryStart>geomStart);
assert.ok(attemptStart>summaryStart && finishStart>attemptStart && finishEnd>finishStart);

const geom=face.slice(geomStart,summaryStart);
assert.match(geom,/normalizedSignedDisplacementLeft/);
assert.match(geom,/normalizedSignedDisplacementRight/);
assert.match(geom,/Math\.abs\(left\)\+Math\.abs\(right\)/);
assert.doesNotMatch(geom,/Math\.max\(0/);

const summary=face.slice(summaryStart,attemptStart);
for (const token of [
  "ACTION_WAIT_SMILE","poseValid===true","mouthAssessable===true","smileConfirmed===true",
  "pairedAsymMedian","pairedAsymP75","pairedAsymP90",
  "pairedBlendAsymMedian","pairedBlendAsymP90",
  "pairedGeometryAsymMedian","pairedGeometryAsymP90",
  "framesOverCandidateThresholdRatio","longestContinuousAsymmetryMs",
  "leftOnsetMs","rightOnsetMs","onsetDelayMs","weakSideLagMs",
  "leftTimeToPeakMs","rightTimeToPeakMs","timeToPeakDifferenceMs"
]) assert.ok(summary.includes(token), "missing dynamic token: "+token);

const attempt=face.slice(attemptStart,finishStart);
assert.match(attempt,/const dynamicAsymmetry = summarizeDynamicAsymmetry\(frames\)/);
assert.match(attempt,/dynamicAsymmetry:\s*JSON\.parse/);

const finish=face.slice(finishStart,finishEnd);
assert.doesNotMatch(finish,/dynamicAsymmetry|DYNAMIC_ASYM|DYNAMIC_GEOMETRY/);
assert.match(finish,/peakSmileL/);
assert.match(finish,/peakSmileR/);
assert.match(finish,/currentGeometryRiseAggregation\(\)/);

assert.match(face,/dynamic:legacySnapshot\?\.dynamicAsymmetry \|\| summarizeDynamicAsymmetry\(frameSnapshot\)/);
assert.match(config,/P0-D research\/shadow only; these values never change the user-facing result\./);
assert.match(config,/dynamicAsymCandidateThreshold:\s*0\.22/);
assert.match(config,/dynamicGeometryMinMagnitude:\s*0\.01/);
assert.match(config,/researchPayloadVersion:\s*"face-research-0\.8\.0"/);

console.log("PASS: P0-D paired dynamics are signed, paired-frame, timing-rich, remotely persisted and shadow-only");
