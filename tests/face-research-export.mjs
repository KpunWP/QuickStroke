import assert from "node:assert/strict";
import { flattenFaceResearch } from "../research/jssf-face-export.mjs";

const fields=["tMs","poseValid","smileLeft","smileRight","eyeDistanceRatioFromBaseline"];
const bundle={
  sessions:[{
    id:"remote-session-1",study_id:"QS-TEST",platform_family:"ios",
    browser_family:"safari",locale:"th"
  }],
  events:[
    {
      session_id:"remote-session-1",event_type:"face_research_attempt",
      payload:{
        testAttemptId:"TA-1",moduleRunId:"MR-1",outcome:"valid",
        baseline:{baselineSmileLeft:0.02,baseMouthWidth:0.9},
        capacity:{peakSmileLeft:0.7,peakSmileRight:0.5},
        detection:{startPath:"relative"},
        dynamic:{pairedAsymP90:0.2},
        runtime:{handModelAvailable:true,faceDelegate:"GPU"},
        versions:{algorithmVersion:"face-asymmetry-1.4.0"},
        thresholds:{maxAllowedYaw:15,minMouthVisibilityScore:0.052},
        quality:{poseValidRatio:0.95}
      }
    },
    {
      session_id:"remote-session-1",event_type:"face_research_samples",
      payload:{
        testAttemptId:"TA-1",moduleRunId:"MR-1",batchNo:1,totalBatches:1,
        fields,rows:[
          [100,1,0.1,0.08,1.0],
          [200,1,0.3,0.18,0.98]
        ]
      }
    }
  ]
};

const out=flattenFaceResearch(bundle);
assert.equal(out.attempts.length,1);
assert.equal(out.samples.length,2);
assert.equal(out.samples[1].tMs,200);
assert.equal(out.samples[1].smileLeft,0.3);
assert.equal(out.samples[1].studyId,"QS-TEST");
assert.equal(out.samples[1].platformFamily,"ios");
assert.equal(out.samples[1].browserFamily,"safari");
assert.equal(out.samples[1].baseline.baselineSmileLeft,0.02);
assert.equal(out.samples[1].capacity.peakSmileRight,0.5);
assert.equal(out.samples[1].dynamic.pairedAsymP90,0.2);
assert.equal(out.samples[1].runtime.handModelAvailable,true);
assert.equal(out.samples[1].thresholds.maxAllowedYaw,15);
assert.equal(out.samples[1].versions.algorithmVersion,"face-asymmetry-1.4.0");
assert.throws(()=>flattenFaceResearch({
  events:[{event_type:"face_research_samples",payload:{testAttemptId:"TA-X",fields:["a","b"],rows:[[1]]}}]
}),/row\/field length mismatch/);

console.log("PASS: Face remote JSONB can be flattened and joined with attempt/session metadata for analysis");
