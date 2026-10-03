import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

assert.match(config,/distanceIdealMin:\s*0\.85/);
assert.match(config,/distanceIdealMax:\s*1\.15/);
assert.match(config,/distanceAcceptMin:\s*0\.80/);
assert.match(config,/distanceAcceptMax:\s*1\.20/);
assert.match(config,/algorithmVersion:\s*"face-asymmetry-1\.6\.0"/);
assert.match(config,/researchPayloadVersion:\s*"face-research-0\.8\.0"/);

assert.match(face,/function distanceWithinAcceptableGate\(ratio\)/);
assert.match(face,/ratio>=DISTANCE_ACCEPT_MIN && ratio<=DISTANCE_ACCEPT_MAX/);
assert.match(face,/function distanceWithinIdealBand\(ratio\)/);

// Gate is applied only as quality control around action/smile measurement.
assert.match(face,/phase==='ACTION_PHASE' \|\| phase==='ACTION_WAIT_SMILE'/);
assert.match(face,/!distanceAcceptable/);
assert.match(face,/DISTANCE_OUT_OF_RANGE/);

// The raw ratio remains available, and normalized geometry continues to use
// the current eye distance directly. No ratio-based second correction is added.
assert.match(face,/eyeDistanceRatioFromBaseline:roundMetric\(eyeDistanceRatioFromBaseline\)/);
assert.match(face,/scaleNormalizationFactor:1 \/ eyeFrame\.eyeDistance/);
assert.doesNotMatch(face,/normalized.*\/\s*eyeDistanceRatioFromBaseline/i);
assert.doesNotMatch(face,/eyeDistanceRatioFromBaseline\s*\*\s*normalized/i);

for(const key of ["distanceIdealMin","distanceIdealMax","distanceAcceptMin","distanceAcceptMax"]) {
  assert.match(face,new RegExp(key.replace(/[A-Z]/g,m=>"[_ -]?"+m.toLowerCase()),"i"));
}

console.log("PASS: distance gate uses 0.80–1.20 baseline-relative quality bounds without duplicate geometry correction");
