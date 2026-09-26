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
    const tx={objectStore:()=>store(tables.get(name))};
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
let sequence=0,networkDown=true,enrolls=0;
const uploads=[];
const cfg={
  version:"1.0.21",buildId:"synthetic-test",
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
    indexedDB,navigator:{userAgent:"iPhone Safari"},
    crypto:{randomUUID:()=>"550e8400-e29b-41d4-a716-"+(++sequence).toString(16).padStart(12,"0")},
    addEventListener(){},
    fetch:async(url,options)=>{
      const body=JSON.parse(options.body);
      if(url.endsWith("/enroll")){
        enrolls++;
        return {
          ok:true,json:async()=>({
            sessionId:"550e8400-e29b-41d4-a716-446655440000",
            studyId:body.studyId,uploadToken:"a".repeat(64),
            createdAt:new Date().toISOString(),expiresAt:"2030-01-01T00:00:00Z"
          })
        };
      }
      if(url.endsWith("/events")){
        if(networkDown)throw Error("Simulated offline");
        uploads.push(...body.events);
        return {ok:true,json:async()=>({acknowledged:body.events.map(x=>x.eventId)})};
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
const enrollment=await sync.enroll();
assert.equal(enrollment.studyId,context.researchMetadata.studyId);
assert.equal(enrolls,1);
console.log("PASS: explicit consent enrollment preserves Study ID and creates capability token");

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

await sync.queueFinalized("module_run",sample);
await sync.flush();
assert.equal(uploads.length,1);
const reopened=clientWindow();
const recoveredStore={
  stores:{moduleRuns:"moduleRuns",testAttempts:"testAttempts"},
  getAllByIndex:async(name)=>name==="moduleRuns"?[sample]:[]
};
await reopened.recoverCompleted(recoveredStore);
await reopened.flush();
assert.equal(uploads.length,1);
console.log("PASS: duplicate requeue and page reload recovery do not re-upload acknowledged events");
