import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");
const server=fs.readFileSync(new URL("../supabase/functions/jssf-remote-ingest/payload.mjs",import.meta.url),"utf8");

// Fallbacks must match the current pre-pilot source of truth.
const expectedFallbacks = [
  ["FACE_MODULE_VERSION","face-prepilot-1.6.0"],
  ["FACE_RESEARCH_PAYLOAD_VERSION","face-research-0.9.0"],
  ["SMILE_DETECT_MIN","0.030"],
  ["SMILE_DETECT_SIDE","0.045"],
  ["SMILE_VALID_STRENGTH","0.020"],
  ["CLOSED_SMILE_RISE_MIN","0.0018"],
  ["SMILE_REAL_MIN","0.018"],
  ["MIN_VALID_SMILE_RATIO","0.05"],
  ["SMILE_ASYM_WARN","0.22"],
  ["SMILE_ASYM_BAD","0.32"]
];
for (const [name,value] of expectedFallbacks) {
  const pattern = new RegExp(`const ${name} = [^;]*\\?\\?[^;]*${value.replace(".","\\.")}|const ${name} = [^;]*\\|\\| [^;]*${value.replaceAll(".","\\.")}`);
  assert.match(face,pattern,`${name} fallback drifted from config`);
}

// realMoveMin is retained only for backwards config compatibility and must not
// silently become an active algorithm threshold again.
assert.match(config,/Deprecated\/unused in Face 1\.6\.0/);
assert.doesNotMatch(face,/\bREAL_MOVE_MIN\b/);

// Active timing/retry/quality controls must be captured in both local result
// threshold snapshot and remote sanitized research summary.
for (const token of [
  "calibrationSeconds","actionDurationMs","maxAssessAttempts","retryDelayMs",
  "smileNudgeMinMs","maxWaitForSmileMs","baselineAlignmentTimeoutMs",
  "criticalNoticeMs","researchSampleIntervalMs","minValidSmileFrames",
  "minVisibleMouthFrames","minValidSmileRatio","smileOcclusionResetMs",
  "baselineMinValidFrames","baselineNeutralSmileMax","baselineCornerMadMax",
  "distanceAcceptMin","distanceAcceptMax","maxAllowedYaw","restSafetyMaxYaw"
]) {
  assert.ok(face.includes(token),`local threshold snapshot missing ${token}`);
  assert.ok(server.includes(token),`remote threshold sanitizer missing ${token}`);
}

// Explicit policy boundary remains visible in source.
assert.match(config,/NOT clinical cutoffs/);
assert.match(config,/research\/shadow only/);

console.log("PASS: final Face threshold review keeps config/fallback/replay snapshots aligned and marks dead threshold compatibility explicitly");
