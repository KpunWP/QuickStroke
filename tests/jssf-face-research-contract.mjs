import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sanitizeBatch, CONTRACT_VERSION } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const now=()=>new Date().toISOString();
const ids={attempt:"TA-faceResearch123",run:"MR-faceResearch123"};

const summary=sanitizeBatch([{
  eventId:randomUUID(),eventType:"face_research_attempt",module:"face",occurredAt:now(),
  payload:{
    testAttemptId:ids.attempt,moduleRunId:ids.run,attemptNo:1,sampleIntervalMs:100,sourceFrameCount:40,
    outcome:"valid",invalidReasonCode:null,
    baseline:{sampleCount:30,baseLeft:0.12,baseRight:0.13,baseEyeDistance:0.18,baseLeftMean:0.121,baseRightMean:0.131,baseEyeDistanceMean:0.181,baselineSmileLeft:0.02,baselineSmileRight:0.03,baselineSmileLeftMean:0.021,baselineSmileRightMean:0.031,baseNormalizedMouthLeftX:-0.48,baseNormalizedMouthRightX:0.49,baseMouthWidth:0.97,baseMouthWidthMean:0.971,stability:{stable:true,leftMad:0.004,rightMad:0.005,eyeMad:0.002,eyeRelativeMad:0.011,validFrameCount:30,rejectedNeutralFrameCount:4},restAsymMean:0.01,restAsymMax:0.02,criticalTriggered:false},
    quality:{faceDetectedRatio:1,poseValidRatio:0.95,mouthAssessableRatio:0.9,handOverlapRatio:0,avgMouthVisibilityScore:0.2,avgEyeDistance:0.18,minEyeDistanceRatioFromBaseline:0.9,maxEyeDistanceRatioFromBaseline:1.08},
    capacity:{peakSmileLeft:0.71,peakSmileRight:0.68,peakNormalizedRiseLeft:0.07,peakNormalizedRiseRight:0.06,aggregatedSignedRiseLeft:0.05,aggregatedSignedRiseRight:0.04,effectiveRiseLeft:0.05,effectiveRiseRight:0.04},
    detection:{startPath:"relative",relativeCandidateFrames:5,relativeValidSmileFrames:22},
    dynamic:{method:"paired-valid-smile-frames-shadow-v1",pairedFrameCount:20,candidateThreshold:0.22,geometryMinMagnitude:0.01,pairedAsymMedian:0.05,pairedAsymP75:0.08,pairedAsymP90:0.12,pairedBlendAsymMedian:0.04,pairedBlendAsymP75:0.06,pairedBlendAsymP90:0.09,pairedGeometryAsymMedian:0.03,pairedGeometryAsymP75:0.05,pairedGeometryAsymP90:0.08,framesOverCandidateThresholdRatio:0.1,longestContinuousAsymmetryMs:300,leftOnsetMs:900,rightOnsetMs:1100,onsetDelayMs:200,weakSideByPeakBlend:"right",weakSideLagMs:200,leftTimeToPeakMs:1800,rightTimeToPeakMs:2100,timeToPeakDifferenceMs:300},
    versions:{appVersion:"1.0.21",buildId:"20261003-face-p0",configVersion:"face-prepilot",faceModuleVersion:"face-prepilot-1.4.0",algorithmVersion:"face-asymmetry-1.3.0",researchPayloadVersion:"face-research-0.5.0",configHash:"abc123"},
    thresholds:{weakSideRatioBad:0.4,weakSideRatioShadow:0.55,smileAsymWarn:0.35,smileAsymBad:0.5,restAsymCritical:0.4,smileDetectMin:0.25,smileDetectSide:0.35,smileValidStrength:0.2,smileRealMin:0.045,closedSmileRiseMin:0.003,closedSmileDeltaSideStart:0.02,closedSmileDeltaSideValid:0.012,closedSmileLateralMin:0.006,closedSmileWidthIncreaseMin:0.012,closedSmilePersistenceMs:250,dynamicAsymCandidateThreshold:0.22,dynamicGeometryMinMagnitude:0.01},
    derivedNumericTelemetryOnly:true,
    rawImage:"FORBIDDEN_IMAGE",rawVideo:"FORBIDDEN_VIDEO",userAgent:"FORBIDDEN_PRECISE_UA"
  }
}])[0];

assert.equal(CONTRACT_VERSION,"jssf-remote-ingest-0.4.0");
assert.equal(summary.event_type,"face_research_attempt");
assert.equal(summary.module,"face");
assert.equal(summary.payload.testAttemptId,ids.attempt);
assert.equal(summary.payload.derivedNumericTelemetryOnly,true);
assert.equal(summary.payload.rawImage,undefined);
assert.equal(summary.payload.rawVideo,undefined);
assert.equal(summary.payload.userAgent,undefined);
assert.equal(summary.payload.dynamic.pairedBlendAsymP90,0.09);
assert.equal(summary.payload.dynamic.pairedAsymP90,0.12);
assert.equal(summary.payload.dynamic.weakSideByPeakBlend,"right");
assert.equal(summary.payload.dynamic.timeToPeakDifferenceMs,300);
assert.equal(summary.payload.baseline.baselineSmileLeft,0.02);
assert.equal(summary.payload.baseline.baseMouthWidth,0.97);
assert.equal(summary.payload.baseline.stability.stable,true);
assert.equal(summary.payload.baseline.stability.rejectedNeutralFrameCount,4);
assert.equal(summary.payload.detection.startPath,"relative");
assert.equal(summary.payload.detection.relativeCandidateFrames,5);
assert.equal(summary.payload.thresholds.closedSmilePersistenceMs,250);

const fieldsCount=41;
const row=[
  100,2,1,2,-1,0.5,0.18,1.02,
  0.4,0.6,0.6,0.6,
  -0.5,0.2,0.5,0.2,
  0.01,0.02,0.015,0.018,
  0.4,0.35,0.38,0.32,1.02,0.05,0.01,0.01,1,1,1,1,1,
  0.2,0.03,0.02,0.04,
  1,0,1,1
];
assert.equal(row.length,fieldsCount);
const samples=sanitizeBatch([{
  eventId:randomUUID(),eventType:"face_research_samples",module:"face",occurredAt:now(),
  payload:{testAttemptId:ids.attempt,moduleRunId:ids.run,batchNo:1,totalBatches:1,sampleIntervalMs:100,rows:[row]}
}])[0];
assert.equal(samples.payload.rows.length,1);
assert.equal(samples.payload.fields.length,fieldsCount);
assert.equal(samples.payload.rows[0][0],100);

assert.throws(()=>sanitizeBatch([{
  eventId:randomUUID(),eventType:"face_research_samples",module:"arm",occurredAt:now(),
  payload:{testAttemptId:ids.attempt,moduleRunId:ids.run,batchNo:1,totalBatches:1,sampleIntervalMs:100,rows:[row]}
}]),/Face research events require face module/);

const bad=[...row]; bad[3]="not-a-number";
assert.throws(()=>sanitizeBatch([{
  eventId:randomUUID(),eventType:"face_research_samples",module:"face",occurredAt:now(),
  payload:{testAttemptId:ids.attempt,moduleRunId:ids.run,batchNo:1,totalBatches:1,sampleIntervalMs:100,rows:[bad]}
}]),/Invalid face sample value/);

console.log("PASS: P0-A Face research payload is numeric, allowlisted, bounded and media-free");
