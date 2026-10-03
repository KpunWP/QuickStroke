import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

const evalStart=face.indexOf("function evaluateSmileEvidence");
const evalEnd=face.indexOf("function bs(",evalStart);
assert.ok(evalStart>=0 && evalEnd>evalStart);
const evalFn=face.slice(evalStart,evalEnd);

// Strong absolute blendshape remains an independent fast path.
assert.match(evalFn,/absoluteConfirmed\s*=\s*directBlendThreshold\s*\|\|\s*blendSupportedGeometry/);

// Relative path requires both baseline-relative blendshape and geometry.
assert.match(evalFn,/relativeCandidate\s*=\s*relativeBlendEvidence\s*&&\s*relativeGeometryEvidence/);
assert.match(evalFn,/relativeBlendEvidence\s*=\s*strongDeltaBlend\s*>=\s*relativeDeltaThreshold/);
assert.match(evalFn,/strongRise\s*>=\s*CLOSED_SMILE_RISE_MIN/);
assert.match(evalFn,/CLOSED_SMILE_LATERAL_MIN/);
assert.match(evalFn,/CLOSED_SMILE_WIDTH_INCREASE_MIN/);

// Geometry alone cannot confirm start; relative start persistence is external.
assert.match(evalFn,/confirmed:absoluteConfirmed\s*\|\|\s*\(mode\s*===\s*'valid'\s*&&\s*relativeCandidate\)/);

const actionStart=face.indexOf("const startEvidence = evaluateSmileEvidence");
const actionEnd=face.indexOf("// voice nudge + timeout",actionStart);
const action=face.slice(actionStart,actionEnd);
assert.match(action,/relativeSmileCandidateSinceMs/);
assert.match(action,/CLOSED_SMILE_PERSISTENCE_MS/);
assert.match(action,/startEvidence\.absoluteConfirmed\s*\|\|\s*relativePersisted/);
assert.match(action,/startPath\s*=\s*startEvidence\.absoluteConfirmed\s*\?\s*'absolute'\s*:\s*'relative'/);

// Final validity still requires absolute blendshape floor.
assert.match(face,/if\s*\(strongBlend\s*<\s*SMILE_REAL_MIN\)\s*\{[\s\S]*?finishInvalid\('SMILE_TOO_WEAK'\)/);

// Relative research trajectory is retained for replay/analysis.
for (const key of [
  "deltaSmileLeft","deltaSmileRight","mouthWidthDelta",
  "lateralOutwardLeft","lateralOutwardRight",
  "relativeBlendEvidence","relativeGeometryEvidence",
  "relativeSmileCandidate","relativeSmilePersisted","smileStartEvidencePath"
]) assert.match(face,new RegExp(key));

assert.match(config,/algorithmVersion:\s*"face-asymmetry-1\.5\.0"/);
assert.match(config,/researchPayloadVersion:\s*"face-research-0\.7\.0"/);
assert.match(config,/P0-C engineering\/pre-pilot closed-mouth path\. NOT clinical cutoffs\./);
assert.match(config,/closedSmilePersistenceMs:\s*250/);

console.log("PASS: P0-C closed-mouth path preserves absolute fast path, requires relative blend+geometry+persistence, and forbids geometry-only start");
