// Hosted HTTPS E2E for the isolated QuickStroke JSSF staging project.
// Synthetic data only. Requires JSSF_TEST_CREDENTIAL in the environment.
// Never run against the production project ref.
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const STAGING_REF = "aijnsaqnjacuqoltadcp";
const FORBIDDEN_PRODUCTION_REF = "pzzjfnfwppdeketjdhfo";
const ORIGIN = "https://engineering.invalid";
const CONSENT_VERSION = "SYNTHETIC_HOSTED_TEST_ONLY";
const BASE = `https://${STAGING_REF}.supabase.co/functions/v1/jssf-remote-ingest`;
const credential = process.env.JSSF_TEST_CREDENTIAL || "";

assert.notEqual(STAGING_REF, FORBIDDEN_PRODUCTION_REF, "ABORT: staging ref matches production ref");
assert.ok(BASE.includes(STAGING_REF), "ABORT: hosted target does not contain staging ref");
assert.ok(!BASE.includes(FORBIDDEN_PRODUCTION_REF), "ABORT: hosted target points at production");
assert.ok(/^[0-9a-f]{64}$/i.test(credential), "ABORT: set JSSF_TEST_CREDENTIAL in the environment first");

function token(){ return randomBytes(32).toString("hex"); }
function clientSessionId(){ return "S-" + randomUUID().replaceAll("-",""); }
function eventId(){ return randomUUID(); }
function now(){ return new Date().toISOString(); }

async function request(route,{method="POST",body=null,sessionToken=null,testCredential=credential,origin=ORIGIN}={}){
  const headers={ Origin:origin };
  if(body!==null) headers["content-type"]="application/json";
  if(sessionToken) headers["x-qs-session-token"]=sessionToken;
  if(testCredential) headers["x-qs-test-credential"]=testCredential;
  const response=await fetch(BASE+"/"+route,{
    method,headers,
    ...(body===null?{}:{body:JSON.stringify(body)}),
    signal:AbortSignal.timeout(20000)
  });
  let parsed=null;
  try{ parsed=await response.json(); }catch(_){ parsed=null; }
  return {status:response.status,body:parsed,headers:response.headers};
}

const enrollment={
  consentAccepted:true,
  age18plus:true,
  participationScope:"usability_nonclinical",
  consentVersion:CONSENT_VERSION,
  clientSessionId:clientSessionId(),
  studyId:"QS-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF",
  uploadToken:token(),
  platformFamily:"desktop",
  browserFamily:"chrome",
  locale:"th",
  appVersion:"1.0.21",
  appBuildId:"SYNTHETIC_HOSTED_E2E"
};

let receipt=null;
try{
  let res=await request("health",{method:"GET",body:null,testCredential:null});
  assert.equal(res.status,200);
  assert.equal(res.body?.collectionEnabled,true);
  console.log("PASS: hosted health reports collectionEnabled=true on isolated staging");

  res=await request("enroll",{body:enrollment,testCredential:null});
  assert.equal(res.status,401);
  assert.equal(res.body?.error,"TEST_ADMISSION_REQUIRED");

  res=await request("enroll",{body:enrollment,testCredential:"f".repeat(64)});
  assert.equal(res.status,401);
  assert.equal(res.body?.error,"TEST_ADMISSION_REQUIRED");
  console.log("PASS: missing/wrong developer credential rejected before enrollment");

  res=await request("enroll",{body:{...enrollment,consentAccepted:false}});
  assert.equal(res.status,422);
  console.log("PASS: invalid consent rejected");

  res=await request("enroll",{body:enrollment,origin:"https://attacker.invalid"});
  assert.equal(res.status,403);
  console.log("PASS: disallowed Origin rejected");

  res=await request("enroll",{body:enrollment});
  assert.equal(res.status,201);
  receipt=res.body;
  assert.equal(receipt.studyId,enrollment.studyId);
  assert.equal(receipt.uploadToken,enrollment.uploadToken);
  assert.match(receipt.sessionId,/^[0-9a-f-]{36}$/i);
  console.log("PASS: authorized synthetic enrollment created");

  res=await request("enroll",{body:enrollment});
  assert.equal(res.status,200);
  assert.equal(res.body?.reused,true);
  assert.equal(res.body?.sessionId,receipt.sessionId);
  console.log("PASS: enrollment retry is idempotent");

  const events=[
    {eventId:eventId(),eventType:"module_run_completed",module:"face",occurredAt:now(),
      payload:{moduleRunId:"MR-face-hosted-1",sequenceNo:1,runStatus:"completed",validityStatus:"valid",observationStatus:"no_alert",qualityStatus:"acceptable",attemptCount:1}},
    {eventId:eventId(),eventType:"module_run_completed",module:"arm",occurredAt:now(),
      payload:{moduleRunId:"MR-arm-hosted-1",sequenceNo:1,runStatus:"completed",validityStatus:"valid",observationStatus:"no_alert",qualityStatus:"acceptable",attemptCount:1}},
    {eventId:eventId(),eventType:"module_run_completed",module:"speech",occurredAt:now(),
      payload:{moduleRunId:"MR-speech-hosted-1",sequenceNo:1,runStatus:"completed",validityStatus:"valid",observationStatus:"no_alert",qualityStatus:"acceptable",attemptCount:1}}
  ];

  const upload={sessionId:receipt.sessionId,events};
  res=await request("events",{body:upload,sessionToken:"e".repeat(64)});
  assert.equal(res.status,401);
  console.log("PASS: wrong session capability rejected");

  res=await request("events",{body:upload,sessionToken:receipt.uploadToken});
  assert.equal(res.status,200);
  assert.equal(res.body?.acknowledged?.length,3);

  res=await request("events",{body:upload,sessionToken:receipt.uploadToken});
  assert.equal(res.status,200);
  assert.equal(res.body?.acknowledged?.length,3);
  console.log("PASS: hosted Face/Arm/Speech summaries accepted and duplicate retry acknowledged");

  const completion={
    eventId:eventId(),eventType:"session_completed",occurredAt:now(),
    payload:{completedModules:["face","arm","speech"]}
  };
  res=await request("events",{body:{sessionId:receipt.sessionId,events:[completion]},sessionToken:receipt.uploadToken});
  assert.equal(res.status,200);
  assert.equal(res.body?.sessionCompleted,true);

  res=await request("events",{body:{sessionId:receipt.sessionId,events:[completion]},sessionToken:receipt.uploadToken});
  assert.equal(res.status,200);
  assert.equal(res.body?.duplicates,true);
  console.log("PASS: session completion locks and duplicate completion remains idempotent");

  res=await request("withdraw",{body:{sessionId:receipt.sessionId},sessionToken:"d".repeat(64)});
  assert.equal(res.status,401);
  console.log("PASS: unauthorized withdrawal rejected");

  res=await request("withdraw",{body:{sessionId:receipt.sessionId},sessionToken:receipt.uploadToken});
  assert.equal(res.status,200);
  assert.equal(res.body?.remoteDataDeleted,true);

  res=await request("withdraw",{body:{sessionId:receipt.sessionId},sessionToken:receipt.uploadToken});
  assert.equal(res.status,200);
  assert.equal(res.body?.alreadyAbsent,true);
  console.log("PASS: hosted withdrawal atomically deletes and lost-ack retry is safe");

  console.log("PASS: HOSTED HTTPS EDGE E2E completed; verify zero rows server-side next");
}catch(error){
  console.error("FAIL:",error?.stack||error);
  if(receipt?.sessionId){
    console.error("NOTE: a synthetic staging session may remain and must be cleaned up before closing this gate.");
  }
  process.exitCode=1;
}
