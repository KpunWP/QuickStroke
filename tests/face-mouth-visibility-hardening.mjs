import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

assert.match(config,/smileOcclusionResetMs:\s*300/);
assert.match(config,/algorithmVersion:\s*"face-asymmetry-1\.6\.0"/);
assert.match(config,/researchPayloadVersion:\s*"face-research-0\.8\.0"/);

const reasonStart=face.indexOf("function mouthAssessabilityReason");
const reasonEnd=face.indexOf("function isMouthAssessable",reasonStart);
const reasonFn=face.slice(reasonStart,reasonEnd);
assert.match(reasonFn,/lastHandMouthOverlap.*HAND_OCCLUSION/s);
assert.match(reasonFn,/heuristicAvailable !== true.*PIXEL_HEURISTIC_FAILURE/s);
assert.match(reasonFn,/visible !== true.*MOUTH_VISIBILITY_LOW/s);

const waitStart=face.indexOf("if (lastHandMouthOverlap){",face.indexOf("const validSmileNow"));
const waitEnd=face.indexOf("smileFrameCount++;",waitStart);
assert.ok(waitStart>=0 && waitEnd>waitStart,"mouth visibility smile-window block not found");
const wait=face.slice(waitStart,waitEnd);
assert.match(wait,/if \(lastHandMouthOverlap\)\{[\s\S]*?resetSmileWindowToAction/);
assert.match(wait,/now - mouthBlockedSinceMs >= SMILE_OCCLUSION_RESET_MS/);
assert.match(wait,/mouthVis\?\.heuristicAvailable === true[\s\S]*?'mouth_visibility_low'[\s\S]*?'pixel_heuristic_failure'/);

// Per-frame research data must distinguish heuristic availability.
assert.match(face,/mouthVisibilityHeuristicAvailable:mouthVis\.heuristicAvailable === true/);
assert.doesNotMatch(wait,/MOUTH_NOT_VISIBLE/);

console.log("PASS: hand occlusion resets immediately, pixel visibility uses 300 ms grace, and failure reasons remain distinguishable");
