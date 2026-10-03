import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { sanitizeBatch } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const face=read("face-test.html");
const config=read("config.js");
const sync=read("js/jssf-remote-sync.js");
const migration=read("supabase/migrations/20261003072000_jssf_face_research_events.sql");

assert.match(config,/version: "face-prepilot-1\.5\.0"/);
assert.match(config,/algorithmVersion: "face-asymmetry-1\.3\.0"/);
assert.match(config,/researchPayloadVersion: "face-research-0\.4\.0"/);
assert.match(config,/smileDeltaMin: 0\.018/);
assert.match(config,/closedSmileEvidenceHoldMs: 250/);
assert.match(config,/maxAllowedYaw: 15/);
assert.match(config,/maxAllowedPitch: 18/);
assert.match(config,/maxAllowedRoll: 15/);

assert.match(face,/baseL = median\(restCornerL\)/);
assert.match(face,/baseR = median\(restCornerR\)/);
assert.match(face,/baseEyeW = candidateEyeDistance/);
assert.doesNotMatch(face,/baseL = average\(restCornerL\)/);
assert.match(face,/medianAbsoluteDeviation/);
assert.match(face,/BASELINE_UNSTABLE/);

assert.match(face,/baselineRelativeClosedCandidate/);
assert.match(face,/smileDeltaLeft/);
assert.match(face,/mouthWidthDelta/);
assert.match(face,/CLOSED_SMILE_EVIDENCE_HOLD_MS/);
assert.match(face,/validFrameAsymmetryTimeline/);
assert.match(face,/summarizePairedBlendAsymmetry/);
assert.match(face,/pairedDynamicAsymmetryRole: 'shadow_research_only'/);
assert.match(face,/shadowWouldFlagWeakSide: weakRatio !== null/);

assert.match(sync,/face_research_summary/);
assert.match(sync,/face_research_chunk/);
assert.match(sync,/queueFaceResearchAttempt/);
assert.match(sync,/const chunkSize=8/);
assert.match(sync,/slice\(0,8\)/);
assert.match(migration,/face_research_summary/);
assert.match(migration,/face_research_chunk/);

const now=new Date().toISOString();
const attempt="TA-faceP0test";
const run="MR-faceP0test";
const events=[
  {
    eventId:randomUUID(),eventType:"face_research_summary",module:"face",occurredAt:now,
    payload:{
      moduleRunId:run,testAttemptId:attempt,algorithmVersion:"face-asymmetry-1.3.0",
      researchPayloadVersion:"face-research-0.4.0",sampleIntervalMs:100,storesImagesOrVideo:false,
      frameCount:2,
      baseline:{sampleCount:20,baseSmileLeft:0.01,baseSmileRight:0.01,baseMouthWidth:1.25,rawImage:"FORBIDDEN"},
      summary:{representativeAsym:0.12,pairedBlendAsymP90:0.18,riskLevel:"ok",participantName:"FORBIDDEN"},
      thresholds:{smileDeltaMin:0.018,maxAllowedYaw:15,secret:"FORBIDDEN"}
    }
  },
  {
    eventId:randomUUID(),eventType:"face_research_chunk",module:"face",occurredAt:now,
    payload:{
      moduleRunId:run,testAttemptId:attempt,chunkNo:1,chunkCount:1,sampleIntervalMs:100,
      frames:[
        {tMs:100,phase:"ACTION_WAIT_SMILE",smileLeft:0.12,smileRight:0.10,
         smileDeltaLeft:0.08,smileDeltaRight:0.06,pairedBlendAsymmetry:0.09,
         mouthWidth:1.31,mouthWidthDelta:0.06,yawDeg:2,pitchDeg:1,rollDeg:0.5,
         rawVideo:"FORBIDDEN"},
        {tMs:200,phase:"ACTION_WAIT_SMILE",smileLeft:0.14,smileRight:0.11,
         mouthAssessable:true,handMouthOverlap:false}
      ]
    }
  }
];
const clean=sanitizeBatch(events);
const serialized=JSON.stringify(clean);
assert.equal(clean.length,2);
assert.ok(!serialized.includes("FORBIDDEN"));
assert.ok(!serialized.includes("participantName"));
assert.ok(!serialized.includes("rawImage"));
assert.ok(!serialized.includes("rawVideo"));
assert.equal(clean[0].payload.storesImagesOrVideo,false);
assert.equal(clean[1].payload.frames.length,2);

assert.throws(()=>sanitizeBatch([{
  ...events[0],
  eventId:randomUUID(),
  payload:{...events[0].payload,storesImagesOrVideo:true}
}]),/must not store images or video/);

console.log("PASS: Face P0 robust baseline, closed-mouth path, shadow dynamics and sanitized JSSF telemetry");
