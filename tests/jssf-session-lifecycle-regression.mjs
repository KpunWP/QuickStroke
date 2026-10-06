import assert from "node:assert/strict";
import fs from "node:fs";

const store=fs.readFileSync("js/research-store.js","utf8");
const consent=fs.readFileSync("jssf-consent.html","utf8");
const result=fs.readFileSync("result.html","utf8");
const remote=fs.readFileSync("js/jssf-remote-sync.js","utf8");

// Case 1: a completed protocol may still contain an unfinished retry. Recovery
// must close only the open lifecycle record and preserve completed abnormal evidence.
assert.match(store,/function isRemoteJssfSessionRecord\(session\)/);
assert.match(store,/session\.appMode === 'research'[\s\S]*community_remote_qr/);
assert.match(store,/async function reconcileRemoteSessionLifecycle\(screeningSessionId\)/);
assert.match(store,/filter\(\(item\) => item\?\.moduleRunStatus === 'in_progress'\)/);
assert.match(store,/attempt\?\.attemptStatus === 'completed'[\s\S]*attempt\?\.validityStatus === 'valid'[\s\S]*attempt\?\.observationStatus === 'abnormal'/);
assert.match(store,/ABNORMAL_ATTEMPT_RETAINED/);
assert.match(store,/validAbnormalAttemptIds:abnormalAttemptIds/);
assert.match(store,/moduleRunStatus:'interrupted'/);
assert.match(store,/completionReasonCode:'REMOTE_RESUME_INCOMPLETE_RUN_RECOVERED'/);
assert.doesNotMatch(store,/validAbnormalAttemptIds[\s\S]{0,300}delete/);

// Resume must restore monotonic run sequencing from persisted canonical runs.
assert.match(store,/function hydrateRemoteResumeSequences\(screeningSessionId, moduleRuns = \[\]\)/);
assert.match(store,/Math\.max\(max, Number\(run\?\.moduleRunSequenceNo \|\| 0\)\)/);
assert.match(store,/fast_module_run_sequence_\$\{screeningSessionId\}_\$\{module\}/);

// Resume bundle now includes attempts so recovery can distinguish empty stale
// runs from partial retries that contain research/safety evidence.
assert.match(store,/STORE_NAMES\.testAttempts/);
assert.match(store,/return \{ session, moduleRuns:runs \|\| \[\], testAttempts:attempts \|\| \[\] \}/);

// Result must reconcile canonical JSSF lifecycle before rendering/finalization.
assert.match(result,/RESULT_RESEARCH_STORE\?\.reconcileRemoteSessionLifecycle/);
assert.match(result,/activeSession\?\.appMode === 'research'[\s\S]*community_remote_qr/);

// A valid abnormal attempt inside an interrupted JSSF retry remains a historical
// safety signal, but the interrupted module run is never promoted to completed.
assert.match(result,/const abnormalHistoryAttempts = remoteJssf/);
assert.match(result,/attempt\?\.attemptStatus === 'completed'[\s\S]*attempt\?\.validityStatus === 'valid'[\s\S]*attempt\?\.observationStatus === 'abnormal'/);
assert.match(result,/abnormalHistoryAttemptIds:abnormalHistoryAttempts\.map/);
assert.match(result,/historicalAbnormalRetained = latestObservationStatus !== 'abnormal'/);

// Case 2: resuming an enrolled session is also a remote-event repair point.
assert.match(consent,/reconcileRemoteSessionLifecycle\(bundle\.session\.screeningSessionId\)/);
assert.match(consent,/await remote\.recoverCompleted\?\.\(\)\.catch\(\(\)=>null\)/);
assert.match(consent,/await remote\.flush\?\.\(\)\.catch\(\(\)=>null\)/);
assert.match(remote,/if \(isActiveCredential\(old\)\) \{[\s\S]*recoverCompleted\(\)\.then\(\(\)=>flush\(\)\)/);

// Isolation regression: recovery is explicitly rejected for anything except
// community_remote_qr research sessions. Public/clinic/Dev continue using their
// existing lifecycle paths.
assert.match(store,/if \(!isRemoteJssfSessionRecord\(session\)\) \{[\s\S]*reason:'not_remote_jssf'/);
assert.match(result,/if \(isRemoteJssf && activeSession\?\.screeningSessionId/);

console.log("PASS: JSSF lifecycle reconciliation preserves abnormal retry evidence, repairs resume delivery, and remains remote-profile isolated");
