/*
 * CLOSED JSSF HTTP smoke test. Uses only anonymous HTTP and fabricated refusal-of-consent data.
 * This test MUST NOT create a research session; it fails if collection becomes enabled.
 * Run: node tests/jssf-remote-http-smoke.mjs
 * Optional: JSSF_HTTP_ENDPOINT=https://.../functions/v1/jssf-remote-ingest
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const endpoint = (process.env.JSSF_HTTP_ENDPOINT ||
  "https://pzzjfnfwppdeketjdhfo.supabase.co/functions/v1/jssf-remote-ingest").replace(/\/$/,"");
assert.match(endpoint,/^https:\/\//,"The smoke test only accepts HTTPS");
const requestTimeoutMs = 15000;
const health = await fetch(endpoint+"/health", {
  method:"GET", headers:{accept:"application/json"},
  cache:"no-store",signal:AbortSignal.timeout(requestTimeoutMs)
});
assert.equal(health.status,200,"JSSF API health must respond HTTP 200");
const state = await health.json();
assert.equal(state.ok,true,"Unexpected health payload");
assert.equal(state.schemaVersion,"jssf-remote-ingest-0.1.0");
assert.equal(state.collectionEnabled,false,"STOP: remote data collection was enabled unexpectedly");
console.log("PASS: live Supabase Edge Function is reachable; remote collection is explicitly disabled");

// A browser Origin is NOT an authentication mechanism. This test only checks
// that a deliberately nonconsenting synthetic enrollment never succeeds.
const hex = randomBytes(12).toString("hex").toUpperCase();
const token = randomBytes(12).toString("hex");
const clientSessionId = "S-SYNTHETIC"+token;
const studyId = "QS-"+hex.match(/.{4}/g).join("-");
const origin = process.env.JSSF_TEST_ORIGIN || "https://quickstroke-jssf-smoke.invalid";
const rejection = await fetch(endpoint+"/enroll", {
  method:"POST",
  headers:{"content-type":"application/json","origin":origin},
  body:JSON.stringify({
    consentAccepted:false,
    age18plus:false,
    consentVersion:"NOT_APPROVED_SMOKE",
    clientSessionId,studyId,participationScope:"usability_nonclinical",
    appVersion:"1.0.21",appBuildId:"jssf-http-smoke",
    locale:"th",platformFamily:"desktop",browserFamily:"chrome"
  }),
  cache:"no-store",signal:AbortSignal.timeout(requestTimeoutMs)
});
assert.ok([403,422,503].includes(rejection.status),
  "STOP: unexpected enrollment response "+rejection.status+" (expected rejection)");
const refused = await rejection.json();
assert.equal(typeof refused.error,"string","Rejected enrollment should have a structured error");
assert.ok(!("studyId" in refused)&&!("uploadToken" in refused)&&!("sessionId" in refused),
  "Refused enrollment returned credentials unexpectedly");
console.log("PASS: live HTTP endpoint rejected synthetic nonconsenting enrollment (HTTP "+rejection.status+")");
console.log("PASS: this smoke test used no patient data, real consent or server-side credentials");
