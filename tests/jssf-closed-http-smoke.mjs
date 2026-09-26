// Closed HTTP smoke test for deployed JSSF Edge Function.
// Read-only health check plus deliberately invalid /enroll, /events, and /withdraw
// requests. This test MUST NOT create a participant or enable collection.
// Requires Node 18+ and Internet access from the test computer.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,"config.js"),"utf8"),sandbox);
const cfg=sandbox.window.QS_CONFIG?.jssfRemote;
assert.ok(cfg && typeof cfg.endpoint==="string","JSSF remote configuration missing");
assert.equal(cfg.enabled,false,"ABORT: public enrollment configuration is enabled");
assert.equal(cfg.consentApproved,false,"ABORT: approved consent gate is enabled");
assert.equal(cfg.agePolicyApproved,false,"ABORT: age approval gate is enabled");
assert.equal(cfg.retentionPolicyApproved,false,"ABORT: full retention gate is enabled");
assert.equal(cfg.retentionDays,90,"Expected 90-day primary data retention");
const endpoint=new URL(cfg.endpoint.replace(/\/$/,"")+"/");
assert.equal(endpoint.protocol,"https:","HTTPS required");
assert.equal(endpoint.hostname,"pzzjfnfwppdeketjdhfo.supabase.co","Unexpected remote backend");
assert.equal(endpoint.pathname,"/functions/v1/jssf-remote-ingest/","Unexpected function path");

async function call(path,init) {
  const res=await fetch(new URL(path,endpoint),{
    ...init,
    signal:AbortSignal.timeout(15000),
    redirect:"error",
    headers:{
      ...(init?.body?{"content-type":"application/json"}:{}),
      ...(init?.headers||{})
    }
  });
  let body=null;
  try{body=await res.json();}catch(_){/* Report non-JSON server responses below. */}
  return {res,body};
}

const health=await call("health");
assert.equal(health.res.status,200,"Health endpoint unreachable or unexpected HTTP status");
assert.equal(health.body?.ok,true,"Edge Function health response invalid");
assert.equal(health.body?.collectionEnabled,false,"ABORT: live collection unexpectedly enabled");
console.log("PASS: real HTTPS health endpoint reachable and public data collection disabled");

// The hostile-origin check must reject requests before any database action.
// The synthetic enrollment payload is deliberately invalid as an additional
// safeguard; no valid consent, age proof, token, or real Study ID is supplied.
const hostileOrigin="https://quickstroke-closed-http-test.invalid";
const enroll=await call("enroll",{
  method:"POST",headers:{"Origin":hostileOrigin},
  body:JSON.stringify({
    consentAccepted:false,age18plus:false,
    consentVersion:"NOT_APPROVED_CLOSED_HTTP_TEST",
    clientSessionId:"NOT_A_VALID_SESSION"
  })
});
assert.ok([403,503,422].includes(enroll.res.status),
  "Enrollment was not rejected safely (HTTP "+enroll.res.status+")");
console.log("PASS: server rejects deliberately invalid consent/enrollment");

const impossibleSession="550e8400-e29b-41d4-a716-446655440099";
for (const name of ["events","withdraw"]) {
  const outcome=await call(name,{
    method:"POST",headers:{"Origin":hostileOrigin},
    body:JSON.stringify({sessionId:impossibleSession,events:[]})
  });
  assert.ok([401,403,503,422].includes(outcome.res.status),
    "Unauthenticated "+name+" was not rejected safely (HTTP "+outcome.res.status+")");
  console.log("PASS: unauthenticated "+name+" request rejected over real HTTPS");
}
console.log("PASS: closed HTTP smoke complete; no valid consent, session, or upload credentials were sent");
