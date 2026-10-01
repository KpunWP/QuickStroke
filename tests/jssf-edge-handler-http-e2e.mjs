// Closed local HTTP integration test using the ACTUAL JSSF Edge handler.
// Only 127.0.0.1 is contacted. The Supabase client is an in-memory simulation;
// no real participant, external database, deployed endpoint, or public flag changes.
// Node 22.13+ (built-in TypeScript stripping). Run: node tests/jssf-edge-handler-http-e2e.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { createHash, randomUUID, webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { sanitizeBatch, CONTRACT_VERSION } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"supabase/functions/jssf-remote-ingest/index.ts"),"utf8");
const config=fs.readFileSync(path.join(root,"config.js"),"utf8");
assert.match(config,/enabled: false,[\s\S]*consentApproved: false,[\s\S]*agePolicyApproved: false,[\s\S]*retentionPolicyApproved: false/,
  "ABORT: deployed client configuration is not fail-closed");
const stripped=stripTypeScriptTypes(source.replace(/^import .*;$/gm,""));
assert.doesNotMatch(stripped,/^import /m,"Unsupported Edge import format; update local harness first");

const sessions=new Map(),events=new Map();
  let syntheticRateLimit={
  allowed:true,
  retry_after_seconds:0
};
const digest=value=>createHash("sha256").update(value).digest("hex");
const fields=(row,columns)=>Object.fromEntries(columns.split(",").map(name=>[name.trim(),row[name.trim()]]));
class Query {
  constructor(table,operation="select",input=null) {
    this.table=table;this.operation=operation;this.input=input;
    this.filters=[];this.columns=null;
  }
  select(value){this.columns=value;return this;}
  eq(name,value){this.filters.push(row=>row[name]===value);return this;}
  in(name,values){this.filters.push(row=>values.includes(row[name]));return this;}
  selected(){
    const collection=this.table==="jssf_remote_sessions"?sessions:events;
    return [...collection.values()].filter(row=>this.filters.every(predicate=>predicate(row)));
  }
  async maybeSingle(){
    const row=this.selected()[0]||null;
    return {data:row?(this.columns?fields(row,this.columns):{...row}):null,error:null};
  }
  async single(){
    if(this.operation!=="insert")return this.maybeSingle();
    assert.equal(this.table,"jssf_remote_sessions");
    const id=randomUUID();
    const created_at=new Date().toISOString();
    const row={
      ...this.input,id,created_at,status:"active",
      expires_at:new Date(Date.now()+30*86400000).toISOString()
    };
    if([...sessions.values()].some(s=>s.client_session_id===row.client_session_id||s.study_id===row.study_id))
      return {data:null,error:{code:"23505"}};
    sessions.set(id,row);
    return {data:this.columns?fields(row,this.columns):{...row},error:null};
  }
  then(resolve,reject){
    const execute=async()=>{
      if(this.operation==="update"){
        const collection=this.table==="jssf_remote_sessions"?sessions:events;
        for(const row of this.selected())collection.set(row.id,{...row,...this.input});
      } else if(this.operation==="select"){
        // PostgREST select is awaitable as a collection; completed-session
        // idempotency checks rely on this return shape. Our fake previously
        // supported only maybeSingle(), causing a synthetic HTTP 500 here.
        return {
          data:this.selected().map(row=>this.columns?fields(row,this.columns):{...row}),
          error:null
        };
      } else if(this.operation==="upsert"){
        assert.equal(this.table,"jssf_remote_events");
        for(const row of this.input){
          const key=row.session_id+":"+row.client_event_id;
          if(!events.has(key)){
            if(!sessions.has(row.session_id))return {error:{code:"23503"}};
            events.set(key,{...row});
          }
        }
      } else {
        throw Error("Unsupported fake operation: "+this.operation);
      }
      return {error:null};
    };
    return execute().then(resolve,reject);
  }
}
const fakeDb={
  from(table){
    assert.ok(["jssf_remote_sessions","jssf_remote_events"].includes(table),
      "Unexpected table: "+table);
    return {
      select:cols=>new Query(table).select(cols),
      insert:input=>new Query(table,"insert",input),
      update:input=>new Query(table,"update",input),
      upsert:input=>new Query(table,"upsert",input)
    };
  },
  async rpc(name,args){
    if(name==="consume_jssf_rate_limit"){
      assert.match(args.p_bucket_key,/^[0-9a-f]{64}$/);
      assert.ok(["enroll","events","withdraw"].includes(args.p_route));
      return {data:[{...syntheticRateLimit}],error:null};
    }

     assert.equal(name,"withdraw_jssf_session");
  const row=sessions.get(args.p_session_id);
  if(!row || row.upload_token_sha256!==args.p_token_sha256)return {data:false,error:null};

  sessions.delete(args.p_session_id);
  for(const [key,event] of events){
    if(event.session_id===args.p_session_id)events.delete(key);
  }

  return {data:true,error:null};
}
};
const allowedOrigin="https://engineering.invalid";
  function makeHandler(enabled){
    let handler=null;
    const environment={
    JSSF_ALLOWED_ORIGINS:allowedOrigin,JSSF_CONSENT_VERSION:"SYNTHETIC_TEST_ONLY",
    JSSF_REMOTE_ENABLED:enabled?"true":"false",
    JSSF_RATE_LIMIT_SECRET:"LOCAL_SYNTHETIC_RATE_LIMIT_SECRET_1234567890",
    SUPABASE_URL:"https://synthetic.invalid",SUPABASE_SERVICE_ROLE_KEY:"LOCAL_FAKE_NOT_A_SECRET"
};
  const fakeDeno={
    env:{get:key=>environment[key]||""},
    serve(fn){assert.equal(handler,null,"Unexpected duplicate Deno.serve");handler=fn;}
  };
  new Function("Deno","createClient","sanitizeBatch","CONTRACT_VERSION",
    "crypto","URL","Response","TextEncoder","console",stripped)(
      fakeDeno,(url,key)=>{
        assert.equal(url,environment.SUPABASE_URL);
        assert.equal(key,environment.SUPABASE_SERVICE_ROLE_KEY);
        return fakeDb;
      },sanitizeBatch,CONTRACT_VERSION,webcrypto,URL,Response,TextEncoder,console);
  assert.equal(typeof handler,"function");
  return handler;
}
let handler=makeHandler(false);
const server=createServer(async(inReq,out)=>{
  try{
    const chunks=[];
    for await(const chunk of inReq)chunks.push(chunk);
    const body=Buffer.concat(chunks);
    const headers={...inReq.headers,"x-forwarded-for":"127.0.0.1"};
    const options={method:inReq.method,headers};
    if(body.length)options.body=body;
    const edgeRequest=new Request("https://synthetic.invalid/functions/v1/jssf-remote-ingest"+inReq.url,options);
    const response=await handler(edgeRequest);
    out.writeHead(response.status,Object.fromEntries(response.headers));
    out.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){
    console.error("Local HTTP harness error:",error);
    out.writeHead(500,{"content-type":"application/json"});
    out.end(JSON.stringify({error:"Local harness failed"}));
  }
});
await new Promise((resolve,reject)=>{
  server.once("error",reject);
  server.listen(0,"127.0.0.1",resolve);
});
const base="http://127.0.0.1:"+server.address().port;
async function request(route,payload=null,token=null,origin=allowedOrigin){
  const headers={Origin:origin};
  if(payload!==null)headers["content-type"]="application/json";
  if(token)headers["x-qs-session-token"]=token;
  const response=await fetch(base+"/"+route,{
    method:payload===null?"GET":"POST",headers,
    ...(payload===null?{}:{body:JSON.stringify(payload)}),
    signal:AbortSignal.timeout(10000)
  });
  return {
    status:response.status,
    headers:response.headers,
    body:await response.json()
  };
}
try{
  let res=await request("health");
  assert.equal(res.status,200);
  assert.equal(res.body.collectionEnabled,false);
  const enrollment={
    consentAccepted:true,age18plus:true,participationScope:"usability_nonclinical",
    consentVersion:"SYNTHETIC_TEST_ONLY",
    clientSessionId:"S-"+randomUUID().replaceAll("-",""),
    studyId:"QS-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF",
    platformFamily:"desktop",browserFamily:"chrome",locale:"th",
    appVersion:"1.0.21",appBuildId:"SYNTHETIC_TEST"
  };
  res=await request("enroll",enrollment);
  assert.equal(res.status,503);
  assert.equal(sessions.size,0);
  console.log("PASS: production-style disabled gate rejects all enrollment");

  handler=makeHandler(true); // In-memory ONLY; deployed environment stays disabled.
  res=await request("enroll",{...enrollment,consentAccepted:false});
  assert.equal(res.status,422);
  res=await request("enroll",enrollment,null,"https://attacker.invalid");
  assert.equal(res.status,403);
  assert.equal(sessions.size,0);
  console.log("PASS: active local handler rejects invalid consent and origin");
  syntheticRateLimit={
    allowed:false,
    retry_after_seconds:37
  };

  res=await request("enroll",enrollment);
  assert.equal(res.status,429);
  assert.equal(res.body.error,"Too many requests");
  assert.equal(res.headers.get("retry-after"),"37");
  assert.equal(sessions.size,0);

  syntheticRateLimit={
    allowed:true,
    retry_after_seconds:0
  };

  console.log("PASS: rate-limited enrollment returns 429 with Retry-After");

  res=await request("enroll",enrollment);
  assert.equal(res.status,201);
  const receipt=res.body;
  assert.equal(receipt.studyId,enrollment.studyId);
  assert.equal(typeof receipt.createdAt,"string");
  assert.match(receipt.uploadToken,/^[0-9a-f]{64}$/);
  assert.equal(sessions.get(receipt.sessionId)?.upload_token_sha256,digest(receipt.uploadToken));
  assert.ok(!JSON.stringify([...sessions.values()]).includes(receipt.uploadToken),
    "Server persisted raw capability token");
  console.log("PASS: real local HTTP enrollment creates a synthetic session and hashed capability");

  const now=()=>new Date().toISOString();
  const sample=[
    {eventId:randomUUID(),eventType:"module_run_completed",module:"face",
      occurredAt:now(),payload:{moduleRunId:"MR-face12345",sequenceNo:1,
        runStatus:"completed",observationStatus:"no_alert",validityStatus:"valid",
        qualityStatus:"acceptable",attemptCount:1,rawAudio:"NEVER_STORE"}},
    {eventId:randomUUID(),eventType:"test_attempt_completed",module:"arm",
      occurredAt:now(),payload:{testAttemptId:"TA-arm12345",moduleRunId:"MR-arm12345",
        attemptNo:1,measurementTarget:"left_arm",observationStatus:"indeterminate",
        validityStatus:"invalid",invalidReasonCode:"SENSOR_STALE"}},
    {eventId:randomUUID(),eventType:"module_run_completed",module:"arm",
      occurredAt:now(),payload:{moduleRunId:"MR-arm12345",sequenceNo:1,
        runStatus:"completed",observationStatus:"no_alert",validityStatus:"valid",
        qualityStatus:"acceptable",attemptCount:2}},
    {eventId:randomUUID(),eventType:"module_run_completed",module:"speech",
      occurredAt:now(),payload:{moduleRunId:"MR-speech12345",sequenceNo:1,
        runStatus:"completed",observationStatus:"no_alert",validityStatus:"valid",
        qualityStatus:"acceptable",attemptCount:1}}
  ];
  const upload={sessionId:receipt.sessionId,events:sample};
    syntheticRateLimit = {
    allowed: false,
    retry_after_seconds: 29
  };

  res = await request("events", upload, receipt.uploadToken);
  assert.equal(res.status, 429);
  assert.equal(res.body.error, "Too many requests");
  assert.equal(res.headers.get("retry-after"), "29");
  assert.equal(events.size, 0);

  syntheticRateLimit = {
    allowed: true,
    retry_after_seconds: 0
  };

  res = await request("events", upload, receipt.uploadToken);
  assert.equal(res.status, 200);
  assert.equal(res.body.acknowledged.length,4);
  assert.equal(events.size,4);
  assert.ok(!JSON.stringify([...events.values()]).includes("NEVER_STORE"));
  res=await request("events",upload,receipt.uploadToken);
  assert.equal(res.status,200);
  assert.equal(events.size,4,"Duplicate retry added events");
  console.log("PASS: 4 sanitized module/attempt events accepted; retry is idempotent");

  res=await request("events",{sessionId:receipt.sessionId,events:[{
    eventId:randomUUID(),eventType:"module_run_completed",module:"arm",
    occurredAt:now(),payload:{moduleRunId:"MR-invalid12345",sequenceNo:2,
      runStatus:"aborted",observationStatus:"abnormal"}
  }]},receipt.uploadToken);
  assert.equal(res.status,422);
  assert.equal(events.size,4);
  console.log("PASS: malformed clinical-like event rejected without storing raw media");

  const completion={eventId:randomUUID(),eventType:"session_completed",
    occurredAt:now(),payload:{completedModules:["face","arm","speech"]}};
  res=await request("events",{sessionId:receipt.sessionId,events:[completion]},receipt.uploadToken);
  assert.equal(res.status,200);
  assert.equal(sessions.get(receipt.sessionId)?.status,"completed");
  res=await request("events",{sessionId:receipt.sessionId,events:[completion]},receipt.uploadToken);
  assert.equal(res.status,200);
  assert.equal(res.body.duplicates,true);
  assert.equal(events.size,5);
  res=await request("events",{sessionId:receipt.sessionId,events:[{
    eventId:randomUUID(),eventType:"technical_event",occurredAt:now(),payload:{code:"PAGE_HIDDEN"}
  }]},receipt.uploadToken);
  assert.equal(res.status,409);
  console.log("PASS: completion locks session; duplicate completion acknowledged");

  // Withdrawal remains available after the 30-day upload token TTL and while
  // data collection is paused, until the separate 90-day retention deletion.
  sessions.get(receipt.sessionId).expires_at=new Date(Date.now()-86400000).toISOString();
  handler=makeHandler(false); // Again, only the in-memory local Edge instance.
  syntheticRateLimit={
    allowed:false,
    retry_after_seconds:41
  };
  res=await request("withdraw",{sessionId:receipt.sessionId},"b".repeat(64));
  assert.equal(res.status,401);
  assert.equal(sessions.size,1);
  res=await request("withdraw",{sessionId:receipt.sessionId},receipt.uploadToken);
  assert.equal(res.status,200);
  assert.equal(res.body.remoteDataDeleted,true);
  assert.equal(sessions.size,0);
  assert.equal(events.size,0);
  res=await request("withdraw",{sessionId:receipt.sessionId},receipt.uploadToken);
  assert.equal(res.status,200);
  assert.equal(res.body.alreadyAbsent,true);
  res=await request("enroll",enrollment);
  assert.equal(res.status,503);
  console.log("PASS: paused-server withdrawal after upload expiry cascades and safely retries");
  console.log("PASS: CLOSED LOCAL HTTP EDGE E2E: zero synthetic records remain");
}finally{
  server.closeAllConnections?.();
  await new Promise(resolve=>server.close(resolve));
}
