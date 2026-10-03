/*
 * JSSF hosted-staging public-admission smoke test.
 * Staging may be collectionEnabled=true for developer E2E, but anonymous/public
 * enrollment MUST remain blocked by the developer admission gate.
 * This test never supplies the developer credential and MUST NOT create a session.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const STAGING_REF = "aijnsaqnjacuqoltadcp";
const FORBIDDEN_PRODUCTION_REF = "pzzjfnfwppdeketjdhfo";
const endpoint = (process.env.JSSF_HTTP_ENDPOINT ||
  `https://${STAGING_REF}.supabase.co/functions/v1/jssf-remote-ingest`).replace(/\/$/,"");
assert.ok(endpoint.includes(STAGING_REF),"Smoke test must target hosted staging");
assert.ok(!endpoint.includes(FORBIDDEN_PRODUCTION_REF),"Smoke test must never target production");
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
assert.equal(typeof state.collectionEnabled,"boolean","Health payload must expose collectionEnabled");
console.log("PASS: hosted staging is reachable; collectionEnabled="+state.collectionEnabled);

// A browser Origin is NOT an authentication mechanism. This test only checks
// that a deliberately nonconsenting synthetic enrollment never succeeds.
const hex = randomBytes(12).toString("hex").toUpperCase();
const token = randomBytes(12).toString("hex");
const clientSessionId = "S-SYNTHETIC"+token;
const studyId = "QS-"+hex.match(/.{4}/g).join("-");
if (state.collectionEnabled === false) {
  console.log("PASS: hosted staging is currently closed; public enrollment cannot proceed");
  console.log("PASS: this smoke test used no patient data, real consent or server-side credentials");
  process.exit(0);
}

const origin = process.env.JSSF_TEST_ORIGIN || "https://engineering.invalid";
const rejection = await fetch(endpoint+"/enroll", {
  method:"POST",
  headers:{"content-type":"application/json","origin":origin},
  body:JSON.stringify({
    consentAccepted:true,
    age18plus:true,
    consentVersion:"SYNTHETIC_HOSTED_TEST_ONLY",
    clientSessionId,studyId,uploadToken:randomBytes(32).toString("hex"),
    participationScope:"usability_nonclinical",
    appVersion:"1.0.21",appBuildId:"jssf-http-smoke",
    locale:"th",platformFamily:"desktop",browserFamily:"chrome"
  }),
  cache:"no-store",signal:AbortSignal.timeout(requestTimeoutMs)
});
assert.equal(rejection.status,401,
  "STOP: public enrollment was not blocked by the developer admission gate");
const refused = await rejection.json();
assert.equal(refused.error,"TEST_ADMISSION_REQUIRED");
assert.ok(!("studyId" in refused)&&!("uploadToken" in refused)&&!("sessionId" in refused),
  "Blocked public enrollment returned credentials unexpectedly");
console.log("PASS: hosted staging blocks enrollment without the developer credential");
console.log("PASS: this smoke test used no patient data, real consent or server-side credentials");
