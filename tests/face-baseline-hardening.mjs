import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

// Median, not arithmetic mean, defines the canonical neutral baseline.
assert.match(face,/baseL\s*=\s*median\(restCornerL\)/);
assert.match(face,/baseR\s*=\s*median\(restCornerR\)/);
assert.match(face,/baseEyeW\s*=\s*median\(restEyeW\)/);
assert.doesNotMatch(face,/baseL\s*=\s*average\(restCornerL\)/);
assert.match(face,/baseLeftMean:roundMetric\(average\(restCornerL\)\)/);

// Neutral expression gate must be expression-based, not symmetry-based.
const neutralFn=face.match(/function baselineNeutrality\(blend\)\{[\s\S]*?\n\}/)?.[0] || "";
assert.match(neutralFn,/mouthSmileLeft/);
assert.match(neutralFn,/mouthSmileRight/);
assert.match(neutralFn,/jawOpen/);
assert.match(neutralFn,/mouthPucker/);
assert.doesNotMatch(neutralFn,/asym|symmetr|\bbaseL\b|\bbaseR\b/i);

// Resting asymmetry remains collected from neutral-valid frames.
assert.match(face,/const restAsym = Math\.abs\(mLy - mRy\)/);
assert.match(face,/restCornerAsymSamples/);

// Stability uses robust dispersion and can wait until timeout.
assert.match(face,/function medianAbsoluteDeviation/);
assert.match(face,/BASELINE_CORNER_MAD_MAX/);
assert.match(face,/BASELINE_EYE_DISTANCE_REL_MAD_MAX/);
assert.match(face,/BASELINE_UNSTABLE/);

// Baseline-relative fields required by P0-C are captured now.
assert.match(face,/baselineSmileLeft\s*=\s*median\(restSmileLeft\)/);
assert.match(face,/baselineSmileRight\s*=\s*median\(restSmileRight\)/);
assert.match(face,/baseMouthWidth\s*=\s*median\(restMouthWidth\)/);
assert.match(face,/baseNormalizedMouthLeftX\s*=\s*median\(restNormalizedMouthLeftX\)/);
assert.match(face,/baseNormalizedMouthRightX\s*=\s*median\(restNormalizedMouthRightX\)/);

// Thresholds are explicitly labelled engineering/pre-pilot, not clinical.
assert.match(config,/P0-B engineering\/pre-pilot baseline gates\. These are NOT clinical cutoffs\./);
assert.match(config,/baselineMinValidFrames:\s*12/);
assert.match(config,/baselineNeutralSmileMax:\s*0\.08/);
assert.match(config,/baselineNeutralMouthActivityMax:\s*0\.20/);

console.log("PASS: P0-B baseline uses neutral-valid median, robust stability, resting-asymmetry preservation and relative-smile baseline fields");
