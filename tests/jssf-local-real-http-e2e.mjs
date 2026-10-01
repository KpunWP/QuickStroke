// CLOSED LOCAL-ONLY integration test against real Supabase Edge Runtime + PostgreSQL.
// Run ONLY on the isolated quickstroke-jssf-local Docker stack after binding its
// published ports to 127.0.0.1 and enabling synthetic-only local Edge consent.
// Never use this test against a deployed/remote Supabase project.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cfg=fs.readFileSync(path.join(root,"supabase/config.toml"),"utf8");
const client=fs.readFileSync(path.join(root,"config.js"),"utf8");
assert.match(cfg,/^project_id = "quickstroke-jssf-local"$/m,"ABORT: unexpected Supabase project");
assert.match(client,/enabled: false,[\s\S]*consentApproved: false,[\s\S]*agePolicyApproved: false,[\s\S]*retentionPolicyApproved: false/,
  "ABORT: public client collection gates must stay disabled");

const BASE="http://127.0.0.1:54321/functions/v1/jssf-remote-ingest/";
const ORIGIN="http://127.0.0.1:5173";
const CONSENT="LOCAL_SYNTHETIC_2026_09";
const DB="supabase_db_quickstroke-jssf-local";
const GATEWAY="supabase_kong_quickstroke-jssf-local";

function docker(...args) {
  return execFileSync("docker",args,{encoding:"utf8",timeout:15000}).trim();
}
function query(sql) {
  return docker("exec",DB,"psql","-X","-U","postgres","-d","postgres",
    "-qAt","-v","ON_ERROR_STOP=1","-c",sql);
}
function counts() {
  const output=query("SELECT (SELECT count(*) FROM public.jssf_remote_sessions)::text || '|' || "+
    "(SELECT count(*) FROM public.jssf_remote_events)::text;");
  const match=output.match(/^(\d+)\|(\d+)$/);
  assert.ok(match,"Unexpected database count output");
  return {sessions:Number(match[1]),events:Number(match[2])};
}
function verifyWindowsFirewall() {
  assert.equal(process.platform,"win32",
    "ABORT: non-loopback published ports require verified host isolation");
  assert.equal(process.env.QS_LAN_PROBE_BLOCKED,"YES",
    "ABORT: verify BOTH ports are unreachable from a second LAN device first, then set QS_LAN_PROBE_BLOCKED=YES");
  const script=String.raw`$ErrorActionPreference='Stop'
$checks=@(@{Name='QuickStroke-JSSF-Local-54321';Port='54321'},@{Name='QuickStroke-JSSF-Local-54322';Port='54322'})
foreach($check in $checks) {
  $rule=Get-NetFirewallRule -Name $check.Name -ErrorAction Stop
  if([string]$rule.Enabled -ne 'True' -or [string]$rule.Direction -ne 'Inbound' -or
     [string]$rule.Action -ne 'Block' -or [string]$rule.Profile -ne 'Any') {
    throw ('ABORT: ineffective firewall rule '+$check.Name)
  }
  $port=Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule
  if([string]$port.Protocol -ne 'TCP' -or @($port.LocalPort) -notcontains $check.Port) {
    throw ('ABORT: firewall port mismatch '+$check.Name)
  }
  $address=Get-NetFirewallAddressFilter -AssociatedNetFirewallRule $rule
  if(@($address.RemoteAddress) -notcontains 'Any') {
    throw ('ABORT: firewall remote-address coverage mismatch '+$check.Name)
  }
}
if(@(Get-NetFirewallProfile | Where-Object { $_.Enabled -ne $true }).Count -gt 0) {
  throw 'ABORT: at least one Windows Firewall profile is disabled'
}
Write-Output 'QS-FIREWALL-OK'`;
  const result=execFileSync("powershell.exe",
    ["-NoProfile","-NonInteractive","-Command",script],
    {encoding:"utf8",timeout:15000}).trim();
  assert.equal(result,"QS-FIREWALL-OK","Windows Firewall verification failed");
}
function verifyLocalPorts() {
  const expected=new Set([DB,GATEWAY]);
  const containers=JSON.parse(docker("inspect",DB,GATEWAY));
  let publiclyPublished=false;
  for(const c of containers) {
    const name=c.Name.replace(/^\//,"");
    assert.ok(expected.has(name),"Unexpected Docker container");
    const published=Object.values(c.NetworkSettings.Ports||{}).flatMap(x=>x||[]);
    assert.ok(published.length>0,"No published ports: "+name);
    const expectedHostPort=name===DB?"54322":"54321";
    for(const port of published) {
      assert.equal(port.HostPort,expectedHostPort,"ABORT: unexpected published port: "+name);
      if(!["127.0.0.1","::1"].includes(port.HostIp)) publiclyPublished=true;
    }
  }
  if(publiclyPublished) {
    verifyWindowsFirewall();
    console.log("PASS: non-loopback Docker bindings protected by verified inbound firewall and second-device LAN checks");
  } else {
    console.log("PASS: Docker database and API gateway are bound only to loopback");
  }
}
async function call(route,body=null,capability=null,origin=ORIGIN) {
  const response=await fetch(new URL(route,BASE),{
    method:body===null?"GET":"POST",
    headers:{
      origin,
      ...(body===null?{}:{"content-type":"application/json"}),
      ...(capability?{"x-qs-session-token":capability}:{})
    },
    ...(body===null?{}:{body:JSON.stringify(body)}),
    redirect:"error",
    signal:AbortSignal.timeout(15000)
  });
  let data=null;
  try{data=await response.json();}catch{ /* Preserve status for diagnostics. */ }
  return {
    status:response.status,
    headers:response.headers,
    body:data
  };
}
const digest=value=>createHash("sha256").update(value).digest("hex");
const syntheticSession="S-"+randomUUID().replaceAll("-","");
const enrollment={
  consentAccepted:true,age18plus:true,participationScope:"usability_nonclinical",
  consentVersion:CONSENT,clientSessionId:syntheticSession,
  uploadToken:"d".repeat(64),
  platformFamily:"desktop",browserFamily:"chrome",locale:"th",
  appVersion:"1.0.21",appBuildId:"LOCAL_SYNTHETIC_HTTP_TEST"
};
let receipt=null;
let failure=null;
try {
  verifyLocalPorts();
  assert.equal(counts().sessions,0,"ABORT: local DB already contains sessions");
  assert.equal(counts().events,0,"ABORT: local DB already contains events");
  const health=await call("health");
  assert.equal(health.status,200);
  assert.equal(health.body?.ok,true);
  assert.equal(health.body?.collectionEnabled,true,
    "Local Edge collection must be enabled ONLY for the loopback-only synthetic test");
  console.log("PASS: local Edge Runtime enabled with isolated, empty real PostgreSQL");

  let r;

  for(let i=1;i<=10;i++){
    r=await call("enroll",{...enrollment,consentAccepted:false});
    assert.equal(r.status,422,"Invalid synthetic consent was not rejected before rate limit");
  }

  r=await call("enroll",{...enrollment,consentAccepted:false});
  assert.equal(r.status,429,"Enrollment rate limit did not reject request 11");
  assert.ok(Number(r.headers.get("retry-after"))>0,"429 response missing Retry-After");

  assert.equal(counts().sessions,0);
  assert.equal(counts().events,0);

  query("DELETE FROM quickstroke_private.jssf_remote_rate_limits;");

  console.log("PASS: real PostgreSQL enrollment rate limit returns 429 with Retry-After");

  r=await call("enroll",enrollment,null,"https://untrusted.invalid");
  assert.equal(r.status,403,"Foreign origin was not rejected");
  assert.deepEqual(counts(),{sessions:0,events:0});
  console.log("PASS: invalid consent and foreign origin denied with no stored rows");

  r=await call("enroll",enrollment);
  assert.equal(r.status,201,JSON.stringify({status:r.status,body:r.body}));
  receipt=r.body;
  assert.match(receipt.sessionId,/^[0-9a-f-]{36}$/i);
  assert.match(receipt.uploadToken,/^[0-9a-f]{64}$/);
  const storedHash=query("SELECT upload_token_sha256 FROM public.jssf_remote_sessions "+
    "WHERE id='"+receipt.sessionId+"';");
  assert.equal(storedHash,digest(receipt.uploadToken));
  assert.notEqual(storedHash,receipt.uploadToken);
  assert.deepEqual(counts(),{sessions:1,events:0});

  r=await call("enroll",enrollment);
  assert.equal(r.status,200,JSON.stringify({status:r.status,body:r.body}));
  assert.equal(r.body.reused,true);
  assert.equal(r.body.sessionId,receipt.sessionId);
  assert.equal(r.body.uploadToken,enrollment.uploadToken);
  assert.deepEqual(counts(),{sessions:1,events:0});

  r=await call("enroll",{...enrollment,uploadToken:"e".repeat(64)});
  assert.equal(r.status,409);
  assert.deepEqual(counts(),{sessions:1,events:0});
  console.log("PASS: real local enrollment is recoverable only with the original capability");

  const now=()=>new Date().toISOString();
  const sample=[
    {eventId:randomUUID(),eventType:"module_run_completed",module:"face",
      occurredAt:now(),payload:{moduleRunId:"MR-localFace123",sequenceNo:1,
        runStatus:"completed",validityStatus:"valid",observationStatus:"no_alert",
        qualityStatus:"acceptable",attemptCount:1,rawAudio:"DO_NOT_STORE_LOCAL"}},
    {eventId:randomUUID(),eventType:"test_attempt_completed",module:"arm",
      occurredAt:now(),payload:{testAttemptId:"TA-localArm123",moduleRunId:"MR-localArm123",
        attemptNo:1,measurementTarget:"left_arm",validityStatus:"invalid",
        observationStatus:"indeterminate",invalidReasonCode:"SENSOR_STALE"}},
    {eventId:randomUUID(),eventType:"module_run_completed",module:"arm",
      occurredAt:now(),payload:{moduleRunId:"MR-localArm123",sequenceNo:1,
        runStatus:"completed",validityStatus:"valid",observationStatus:"no_alert",
        qualityStatus:"acceptable",attemptCount:2,retryCount:1}},
    {eventId:randomUUID(),eventType:"module_run_completed",module:"speech",
      occurredAt:now(),payload:{moduleRunId:"MR-localSpeech123",sequenceNo:1,
        runStatus:"completed",validityStatus:"valid",observationStatus:"no_alert",
        qualityStatus:"acceptable",attemptCount:1}}
  ];
  const batch={sessionId:receipt.sessionId,events:sample};
  r=await call("events",batch,"f".repeat(64));
  assert.equal(r.status,401,"Wrong session capability was accepted");
  r=await call("events",batch,receipt.uploadToken);
  assert.equal(r.status,200,JSON.stringify({status:r.status,body:r.body}));
  assert.equal(r.body?.acknowledged?.length,4);
  assert.deepEqual(counts(),{sessions:1,events:4});
  assert.equal(query("SELECT count(*) FROM public.jssf_remote_events "+
    "WHERE payload::text LIKE '%DO_NOT_STORE_LOCAL%';"),"0");
  r=await call("events",batch,receipt.uploadToken);
  assert.equal(r.status,200);
  assert.deepEqual(counts(),{sessions:1,events:4},
    "Duplicate event replay changed the row count");
  console.log("PASS: Face/Arm/Speech and retry are sanitized, capability-protected and idempotent");

  r=await call("events",{sessionId:receipt.sessionId,events:[{
    eventId:randomUUID(),eventType:"module_run_completed",module:"arm",
    occurredAt:now(),payload:{moduleRunId:"MR-badLocal123",sequenceNo:2,
      runStatus:"aborted",observationStatus:"abnormal"}
  }]},receipt.uploadToken);
  assert.equal(r.status,422);
  assert.deepEqual(counts(),{sessions:1,events:4});
  console.log("PASS: invalid clinical-like event rejected without writing raw data");

  const completion={eventId:randomUUID(),eventType:"session_completed",
    occurredAt:now(),payload:{completedModules:["face","arm","speech"]}};
  const finish={sessionId:receipt.sessionId,events:[completion]};
  r=await call("events",finish,receipt.uploadToken);
  assert.equal(r.status,200);
  assert.equal(query("SELECT status FROM public.jssf_remote_sessions "+
    "WHERE id='"+receipt.sessionId+"';"),"completed");
  r=await call("events",finish,receipt.uploadToken);
  assert.equal(r.status,200);
  assert.equal(r.body?.duplicates,true);
  assert.deepEqual(counts(),{sessions:1,events:5});
  r=await call("events",{sessionId:receipt.sessionId,events:[{
    eventId:randomUUID(),eventType:"technical_event",
    occurredAt:now(),payload:{code:"PAGE_HIDDEN"}
  }]},receipt.uploadToken);
  assert.equal(r.status,409);
  console.log("PASS: completion locks session and replay is acknowledged once");

  query("UPDATE public.jssf_remote_sessions SET expires_at=now()-interval '1 minute' "+
    "WHERE id='"+receipt.sessionId+"';");
  r=await call("events",batch,receipt.uploadToken);
  assert.equal(r.status,401,"Expired token still allowed event upload");
  r=await call("withdraw",{sessionId:receipt.sessionId},"f".repeat(64));
  assert.equal(r.status,401,"Wrong withdrawal capability deleted data");
  r=await call("withdraw",{sessionId:receipt.sessionId},receipt.uploadToken);
  assert.equal(r.status,200);
  assert.equal(r.body?.remoteDataDeleted,true);
  assert.deepEqual(counts(),{sessions:0,events:0});
  r=await call("withdraw",{sessionId:receipt.sessionId},receipt.uploadToken);
  assert.equal(r.status,200);
  assert.equal(r.body?.alreadyAbsent,true);
  console.log("PASS: expired upload token can still withdraw; deletion cascades and retry is safe");
  console.log("PASS: REAL LOCAL HTTP E2E; zero synthetic PostgreSQL records remain");
} catch(err) {
  failure=err;
  console.error("FAIL:",err?.message||String(err));
} finally {
  if(receipt?.sessionId) {
    try {
      // Cleanup only this synthetic UUID in the verified LOCAL Docker database.
      query("DELETE FROM public.jssf_remote_sessions WHERE id='"+receipt.sessionId+"';");
      assert.deepEqual(counts(),{sessions:0,events:0},
        "Residual local synthetic rows remain: inspect before continuing");
    } catch(cleanupError) {
      console.error("CRITICAL: local cleanup could not be verified",cleanupError?.message);
      failure??=cleanupError;
    }
  }
}
if(failure) process.exitCode=1;
