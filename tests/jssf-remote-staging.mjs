import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeBatch, sanitizeEvent, CONTRACT_VERSION } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const now = new Date().toISOString();
const MODULE = "module_run_completed";
const valid = {
  eventId:"550e8400-e29b-41d4-a716-446655440000",
  eventType:MODULE,
  module:"arm",
  occurredAt:now,
  payload:{
    moduleRunId:"MR-abc0123456789", sequenceNo:1, runStatus:"completed",
    validityStatus:"valid", observationStatus:"abnormal", qualityStatus:"acceptable",
    qualityFlags:["LEFT_DRIFT"], durationMs:13000, retryCount:1,
    audioRecording:"SENSITIVE_NEVER_PERSIST", faceImage:"SENSITIVE_NEVER_PERSIST",
    transcript:"SENSITIVE_NEVER_PERSIST", rawGyroSamples:[1,2,3]
  }
};
const sanitized = sanitizeEvent(valid);
assert.equal(sanitized.event_type,MODULE);
assert.equal(sanitized.payload.observationStatus,"abnormal");
assert.equal(sanitized.payload.moduleRunId,valid.payload.moduleRunId);
assert.equal(sanitized.schema_version,CONTRACT_VERSION);
assert.doesNotMatch(JSON.stringify(sanitized),/SENSITIVE_NEVER_PERSIST|rawGyroSamples/);
assert.equal(sanitizeBatch([valid]).length,1);
assert.throws(()=>sanitizeBatch([valid,valid]),/Duplicate/);
assert.throws(()=>sanitizeBatch(Array(26).fill(valid)),/1-25/);
console.log("PASS: remote payload sanitizes and preserves valid module/retry summary");

assert.throws(()=>sanitizeEvent({...valid,payload:{...valid.payload,runStatus:"aborted"}}),/Incomplete run/);
assert.throws(()=>sanitizeEvent({...valid,eventType:"upload_raw_audio"}),/Invalid event type/);
assert.throws(()=>sanitizeEvent({...valid,eventId:"bad"}),/Invalid eventId/);
assert.throws(()=>sanitizeEvent({...valid,occurredAt:"1980-01-01T00:00:00Z"}),/Out-of-range/);
assert.throws(()=>sanitizeEvent({...valid,module:"other"}),/Invalid module/);
const tech=sanitizeEvent({eventId:"550e8400-e29b-41d4-a716-446655440001",eventType:"technical_event",module:"face",occurredAt:now,payload:{code:"PERMISSION_DENIED",debugRaw:"NEVER_PERSIST"}});
assert.deepEqual(tech.payload,{code:"PERMISSION_DENIED",relatedModuleRunId:undefined});
console.log("PASS: raw media, malformed events, and invalid incomplete abnormalities rejected or excluded");

const edge=read("supabase/functions/jssf-remote-ingest/index.ts");
const parsed=edge.replace(/^import .*;$/gm,"");
assert.doesNotThrow(()=>new Function(parsed));
assert.match(edge,/JSSF_REMOTE_ENABLED"\) === "true"/);
assert.match(edge,/JSSF_CONSENT_VERSION/);
assert.match(edge,/JSSF_ALLOWED_ORIGINS/);
assert.match(edge,/x-qs-session-token/);
assert.match(edge,/crypto\.subtle\.digest\("SHA-256"/);
assert.match(edge,/status === 204 \? null/);
assert.match(edge,/ignoreDuplicates:true/);
assert.match(edge,/consentAccepted !== true/);
assert.match(edge,/if \(!enabled \|\| !db\)/);
console.log("PASS: server syntax, consent gate, session-token authorization and idempotency guards");

const schema=read("supabase/migrations/20260925_jssf_remote_nonclinical_staging.sql");
assert.match(schema,/jssf_remote_sessions[\s\S]*jssf_remote_events/);
assert.match(schema,/UNIQUE \(session_id, client_event_id\)/);
assert.match(schema,/ENABLE ROW LEVEL SECURITY/g);
assert.match(schema,/REVOKE ALL ON public\.jssf_remote_sessions, public\.jssf_remote_events FROM PUBLIC, anon, authenticated/);
console.log("PASS: committed schema limits access to privileged server ingestion");
