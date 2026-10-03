// Dependency-free deterministic fake-IndexedDB test for the gated JSSF outbox.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const client=fs.readFileSync(path.join(root,"js/jssf-remote-sync.js"),"utf8");
const tables=new Map();
function request(fn) {
  const r={};
  Promise.resolve().then(()=>{
    try {r.result=fn();r.onsuccess?.({target:r});}
    catch(error){r.error=error;r.onerror?.({target:r});}
  });
  return r;
}
function table(name,key){
  if(!tables.has(name))tables.set(name,{key,rows:new Map(),indexes:new Map()});
  return tables.get(name);
}
function store(t){
  return {
    createIndex(name,key){t.indexes.set(name,key);},
    get(key){return request(()=>t.rows.get(key)||null);},
    put(row){t.rows.set(row[t.key],row);return request(()=>row);},
    getAll(){return request(()=>[...t.rows.values()]);},
    delete(key){t.rows.delete(key);return request(()=>undefined);},
    add(row){
      if(t.rows.has(row[t.key]))throw Error("duplicate primary key");
      t.rows.set(row[t.key],row);return request(()=>row);
    },
    index(name){
      const key=t.indexes.get(name);
      return {
        get(value){return request(()=>[...t.rows.values()].find(row=>row[key]===value)||null);},
        getAll(value){return request(()=>[...t.rows.values()].filter(row=>row[key]===value));}
      };
    }
  };
}
const db={
  objectStoreNames:{contains:key=>tables.has(key)},
  createObjectStore(name,options){return store(table(name,options.keyPath));},
  transaction(name){
    const tx={objectStore:(requested)=>store(tables.get(requested || (Array.isArray(name)?name[0]:name)))};
    Object.defineProperty(tx,"oncomplete",{set(fn){Promise.resolve().then(()=>fn());}});
    return tx;
  }
};
const indexedDB={
  open(){
    const r={};
    Promise.resolve().then(()=>{
      r.result=db;
      if(!tables.size)r.onupgradeneeded?.({target:r});
      r.onsuccess?.({target:r});
    });
    return r;
  }
};
let sequence=0,networkDown=true,withdrawNetworkDown=true,enrolls=0,withdrawals=0;
let enrollmentResponseLost=true;
const enrollmentTokens=[];
const localPurges=[];
const preferences=new Map();
const localStorage={setItem:(k,v)=>preferences.set(k,v),getItem:k=>preferences.get(k)||null,
  removeItem:k=>preferences.delete(k)};
const uploads=[];
const cfg={
  version:"1.0.21",buildId:"synthetic-test",
  research:{profiles:{community_remote_qr:{enabled:true,dataCollectionEnabled:true}}},
  jssfRemote:{
    enabled:true,consentApproved:true,agePolicyApproved:true,retentionPolicyApproved:true,
    minimumAge18Enforced:true,consentVersion:"CONSENT-TEST-1",
    retentionDays:90,privacyContact:"qa@example.org",
    endpoint:"https://example.invalid/functions/v1/jssf-remote-ingest"
  }
};
const context={
  appMode:"research",screeningSessionId:"S-00000000000000000000",
  researchMetadata:{
    researchProfile:"community_remote_qr",consentStatus:"consented",
    consentVersion:"CONSENT-TEST-1",studyId:"QS-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF"
  }
};
const sample={
  module:"arm",screeningSessionId:context.screeningSessionId,
  moduleRunId:"MR-1234567890abcdef",moduleRunSequenceNo:1,
  moduleRunStatus:"completed",validityStatus:"valid",
  observationStatus:"abnormal",qualityStatus:"acceptable",attemptCount:2,
  startedAt:new Date(Date.now()-12000).toISOString(),
  completedAt:new Date().toISOString(),rawAudio:"SENSITIVE-NEVER-UPLOAD"
};
function clientWindow(){
  const win={
    console,QS_CONFIG:cfg,QuickStrokeDataContract:{getSessionContext:()=>context},
    QuickStrokeI18n:{getLocale:()=>"th-TH"},
    indexedDB,localStorage,navigator:{userAgent:"iPhone Safari"},
    QuickStrokeResearchStore:{purgeRemoteSessionLocal:async id=>{localPurges.push(id);return {deleted:true};}},
    crypto:{
      randomUUID:()=>"550e8400-e29b-41d4-a716-"+(++sequence).toString(16).padStart(12,"0"),
      getRandomValues:(bytes)=>{for(let i=0;i<bytes.length;i++)bytes[i]=(i+17)%256;return bytes;}
    },
    addEventListener(){},
    fetch:async(url,options)=>{
      const body=JSON.parse(options.body);
      if(url.endsWith("/enroll")){
        enrolls++;
        enrollmentTokens.push(body.uploadToken);
        if(enrollmentResponseLost){
          enrollmentResponseLost=false;
          throw Error("Simulated lost enrollment response");
        }
        return {
          ok:true,json:async()=>({
            sessionId:"550e8400-e29b-41d4-a716-446655440000",
            studyId:body.studyId,uploadToken:body.uploadToken,reused:true,
            createdAt:new Date().toISOString(),expiresAt:"2030-01-01T00:00:00Z"
          })
        };
      }
      if(url.endsWith("/events")){
        if(networkDown)throw Error("Simulated offline");
        uploads.push(...body.events);
        return {ok:true,json:async()=>({acknowledged:body.events.map(x=>x.eventId)})};
      }
      if(url.endsWith("/withdraw")){
        withdrawals++;
        if(withdrawNetworkDown)throw Error("Simulated offline withdrawal");
        return {ok:true,json:async()=>({withdrawn:true,remoteDataDeleted:true})};
      }
      throw Error("Unexpected URL: "+url);
    }
  };
  new Function("window",client)(win);
  return win.QuickStrokeJssfRemote;
}
const sync=clientWindow();
assert.equal(sync.featureReady(),true);
assert.equal(sync.canSync(),true);
await assert.rejects(sync.enroll(),/Simulated lost enrollment response/);
const originalStudyId=context.researchMetadata.studyId;
context.researchMetadata.studyId="QS-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ";
await assert.rejects(sync.enroll(),/does not match the current consent context/);
assert.equal(enrolls,1);
context.researchMetadata.studyId=originalStudyId;
const enrollment=await sync.enroll();
assert.equal(enrollment.studyId,context.researchMetadata.studyId);
assert.equal(enrolls,2);
assert.equal(enrollmentTokens.length,2);
assert.match(enrollmentTokens[0],/^[0-9a-f]{64}$/);
assert.equal(enrollmentTokens[1],enrollmentTokens[0]);
assert.equal(enrollment.reused,true);
await assert.rejects(
  sync.activate({
    sessionId:enrollment.sessionId,
    studyId:"QS-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ",
    uploadToken:enrollmentTokens[0],
    createdAt:new Date().toISOString(),
    expiresAt:"2030-01-01T00:00:00Z"
  },context.screeningSessionId,enrollmentTokens[0],context.researchMetadata.studyId),
  /Invalid or expired server enrollment/
);
console.log("PASS: lost enrollment response retries with the same capability while stale context and mismatched server Study ID fail closed");

assert.equal(await sync.queueFinalized("module_run",sample),true);
await sync.flush().catch(()=>null);
assert.equal((await sync.pending(enrollment.sessionId)).length,1);
assert.equal(uploads.length,0);
console.log("PASS: offline failure preserves pending upload in IndexedDB");

networkDown=false;
assert.equal((await sync.flush()).sent,1);
assert.equal((await sync.pending(enrollment.sessionId)).length,0);
assert.equal(uploads.length,1);
assert.equal(uploads[0].payload.observationStatus,"abnormal");
assert.equal(uploads[0].payload.attemptCount,2);
assert.equal(uploads[0].payload.retryCount,0);
assert.doesNotMatch(JSON.stringify(uploads),/SENSITIVE-NEVER-UPLOAD/);
console.log("PASS: automatic retry delivers a sanitized event and persists acknowledgement");

const faceUploadStart=uploads.length;
const faceQueued=await sync.queueFaceResearch({
  testAttemptId:"TA-faceResearch123",
  moduleRunId:"MR-faceResearch123",
  attemptNo:1,
  completedAt:new Date().toISOString(),
  sampleIntervalMs:100,
  baseline:{sampleCount:20,baseLeft:0.1,baseRight:0.11,baseEyeDistance:0.18,restAsymMean:0.01,restAsymMax:0.02,criticalTriggered:false},
  attemptSummary:{
    outcome:"valid",invalidReasonCode:null,
    quality:{faceDetectedRatio:1,poseValidRatio:1,mouthAssessableRatio:0.9,handOverlapRatio:0,avgMouthVisibilityScore:0.2,avgEyeDistance:0.18,minEyeDistanceRatioFromBaseline:0.95,maxEyeDistanceRatioFromBaseline:1.05},
    metrics:{peakSmileLeft:0.7,peakSmileRight:0.65,peakNormalizedRiseLeft:0.06,peakNormalizedRiseRight:0.05,aggregatedSignedRiseLeft:0.05,aggregatedSignedRiseRight:0.04,effectiveRiseLeft:0.05,effectiveRiseRight:0.04}
  },
  versions:{algorithmVersion:"face-asymmetry-1.2.0",researchPayloadVersion:"face-research-0.3.0",configHash:"abc123"},
  thresholds:{smileDetectMin:0.25,smileDetectSide:0.35,smileRealMin:0.045,closedSmileRiseMin:0.003},
  frames:[
    {tMs:100,phase:"RESTING_PHASE",poseValid:true,yawDeg:1,pitchDeg:2,rollDeg:0.5,eyeDistance:0.18,eyeDistanceRatioFromBaseline:1,rawMouthLeftX:0.4,rawMouthLeftY:0.6,rawMouthRightX:0.6,rawMouthRightY:0.6,normalizedMouthLeftX:-0.5,normalizedMouthLeftY:0.2,normalizedMouthRightX:0.5,normalizedMouthRightY:0.2,rawSignedDisplacementLeft:0,rawSignedDisplacementRight:0,normalizedSignedDisplacementLeft:0,normalizedSignedDisplacementRight:0,smileLeft:0.02,smileRight:0.02,mouthVisibilityScore:0.2,mouthDarkRatio:0.03,mouthCentralDarkRatio:0.02,mouthLineScore:0.04,mouthAssessable:true,handMouthOverlap:false,blendSmileEvidence:false,geometrySmileEvidence:false},
    {tMs:200,phase:"ACTION_PHASE",poseValid:true,yawDeg:1,pitchDeg:2,rollDeg:0.5,eyeDistance:0.18,eyeDistanceRatioFromBaseline:1,rawMouthLeftX:0.4,rawMouthLeftY:0.58,rawMouthRightX:0.6,rawMouthRightY:0.59,normalizedMouthLeftX:-0.5,normalizedMouthLeftY:0.15,normalizedMouthRightX:0.5,normalizedMouthRightY:0.17,rawSignedDisplacementLeft:0.02,rawSignedDisplacementRight:0.01,normalizedSignedDisplacementLeft:0.05,normalizedSignedDisplacementRight:0.03,smileLeft:0.5,smileRight:0.4,mouthVisibilityScore:0.25,mouthDarkRatio:0.04,mouthCentralDarkRatio:0.03,mouthLineScore:0.05,mouthAssessable:true,handMouthOverlap:false,blendSmileEvidence:true,geometrySmileEvidence:true}
  ]
});
assert.equal(faceQueued.queued,2);
for(let i=0;i<5 && (await sync.pending(enrollment.sessionId)).length;i++) await sync.flush();
const faceUploads=uploads.slice(faceUploadStart);
assert.equal(faceUploads.length,2);
assert.deepEqual(faceUploads.map(x=>x.eventType).sort(),["face_research_attempt","face_research_samples"]);
assert.equal(faceUploads.find(x=>x.eventType==="face_research_samples").payload.rows.length,2);
assert.doesNotMatch(JSON.stringify(faceUploads),/rawImage|rawVideo|uploadToken|userAgent/);
console.log("PASS: derived Face research summary and 10 Hz numeric rows persist through the outbox without raw media");
const uploadsAfterFace=uploads.length;

await sync.queueFinalized("module_run",sample);
await sync.flush();
assert.equal(uploads.length,uploadsAfterFace);
const reopened=clientWindow();
const recoveredStore={
  stores:{screeningSessions:"screeningSessions",moduleRuns:"moduleRuns",testAttempts:"testAttempts"},
  getAllByIndex:async(name)=>name==="moduleRuns"?[sample]:[],
  get:async(name,id)=>name==="screeningSessions"&&id===context.screeningSessionId
    ? {screeningSessionId:id,sessionStatus:"finalized"}
    : null
};
await reopened.recoverCompleted(recoveredStore);
await reopened.flush();
assert.equal(uploads.length,uploadsAfterFace+1);
assert.equal(uploads[uploads.length-1].eventType,"session_completed");
await reopened.recoverCompleted(recoveredStore);
await reopened.flush();
assert.equal(uploads.length,uploadsAfterFace+1);
console.log("PASS: reload recovery restores a missing finalized-session completion event once without duplicate upload");

const savedContext={
  appMode:context.appMode,
  screeningSessionId:context.screeningSessionId,
  researchMetadata:context.researchMetadata
};
context.appMode="public";
context.screeningSessionId=null;
context.researchMetadata=null;
const withdrawables=await reopened.listWithdrawableEnrollments();
assert.equal(withdrawables.length,1);
assert.equal(withdrawables[0].clientSessionId,savedContext.screeningSessionId);
assert.equal(withdrawables[0].studyId,enrollment.studyId);
assert.equal(Object.prototype.hasOwnProperty.call(withdrawables[0],"uploadToken"),false);
const offlineWithdrawal=await reopened.requestWithdrawal(withdrawables[0].clientSessionId);
assert.equal(offlineWithdrawal.complete,false);
assert.equal(offlineWithdrawal.pending,true);
assert.equal(offlineWithdrawal.localDeleted,true);
assert.equal(offlineWithdrawal.remoteDeleted,false);
assert.equal(localPurges[0],savedContext.screeningSessionId);
assert.equal((await sync.pending(enrollment.sessionId)).length,0);
context.appMode=savedContext.appMode;
context.screeningSessionId=savedContext.screeningSessionId;
context.researchMetadata=savedContext.researchMetadata;
assert.equal(await sync.queueFinalized("module_run",sample),false);
assert.equal((await sync.flush()).reason,"withdrawal_pending");
console.log("PASS: tab-close recovery lists only safe enrollment metadata and can start offline withdrawal without sessionStorage");

withdrawNetworkDown=false;
const resumed=await reopened.resumePendingWithdrawals();
assert.equal(resumed.length,1);
assert.equal(resumed[0].complete,true);
assert.equal(resumed[0].remoteDeleted,true);
assert.equal(resumed[0].localDeleted,true);
assert.equal((await sync.pending(enrollment.sessionId)).length,0);
assert.equal((await sync.privacyMaintenance()).skipped,true);
assert.ok ? assert.ok(withdrawals>=2) : assert.equal(withdrawals>=2,true);
console.log("PASS: reconnect confirms server deletion, clears the capability and removes the outbox marker");
