import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

assert.match(config,/P0-E engineering\/pre-pilot pose gates\. NOT clinical cutoffs\./);
assert.match(config,/maxAllowedYaw:\s*15/);
assert.match(config,/maxAllowedPitch:\s*18/);
assert.match(config,/maxAllowedRoll:\s*15/);
assert.match(config,/restSafetyMaxYaw:\s*12/);
assert.match(config,/restSafetyMaxPitch:\s*15/);
assert.match(config,/restSafetyMaxRoll:\s*12/);
assert.match(config,/poseBadTripFrames:\s*3/);
assert.match(config,/poseGoodResumeFrames:\s*8/);

const measurementStart=face.indexOf("function poseWithinMeasurementGate");
const restStart=face.indexOf("function poseWithinRestSafetyGate");
const computeStart=face.indexOf("function computePose",restStart);
assert.ok(measurementStart>=0 && restStart>measurementStart && computeStart>restStart);
const measurement=face.slice(measurementStart,restStart);
const rest=face.slice(restStart,computeStart);
assert.match(measurement,/MAX_ALLOWED_YAW/);
assert.match(measurement,/MAX_ALLOWED_PITCH/);
assert.match(measurement,/MAX_ALLOWED_ROLL/);
assert.match(rest,/REST_SAFETY_MAX_YAW/);
assert.match(rest,/REST_SAFETY_MAX_PITCH/);
assert.match(rest,/REST_SAFETY_MAX_ROLL/);

assert.match(face,/const sampledPoseValid = poseWithinMeasurementGate\(yawDeg,pitchDeg,rollDeg\)/);
assert.match(face,/const restSafetyPoseValid = poseWithinRestSafetyGate\(yawDeg,pitchDeg,rollDeg\)/);
assert.match(face,/const poseBadNow\s*=\s*!poseWithinMeasurementGate\(yawDeg,pitchDeg,rollDeg\)/);
assert.match(face,/poseBadFrames >= POSE_BAD_TRIP_FRAMES/);
assert.match(face,/poseGoodFrames < POSE_GOOD_RESUME_FRAMES/);

// High-weight resting abnormal evidence must use the tighter full 3-axis gate.
assert.match(face,/avg > REST_ASYM_CRITICAL && !criticalFired && restSafetyPoseValid/);
assert.doesNotMatch(face,/avg > REST_ASYM_CRITICAL && !criticalFired && absRoll < 12/);

// Raw pose remains available so JSSF can re-stratify/replay future gates.
assert.match(face,/yawDeg:roundMetric\(yawDeg,2\)/);
assert.match(face,/pitchDeg:roundMetric\(pitchDeg,2\)/);
assert.match(face,/rollDeg:roundMetric\(rollDeg,2\)/);

assert.match(config,/algorithmVersion:\s*"face-asymmetry-1\.5\.0"/);
assert.match(config,/researchPayloadVersion:\s*"face-research-0\.7\.0"/);

console.log("PASS: P0-E uses 15/18/15 measurement pose, 12/15/12 rest-safety pose, preserves 3/8 hysteresis and raw pose telemetry");
