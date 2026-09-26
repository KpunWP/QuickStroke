/* QuickStroke JSSF remote usability sync v0.1 — opt-in and disabled until consent approval.
 * No server transfer in Public, Dev or clinical Research sessions.
 * Persistent, per-session outbox is retained across navigation; never stores raw media.
 */
(function initQuickStrokeJssfRemote(global) {
  "use strict";
  if (global.QuickStrokeJssfRemote) return;
  const VERSION = "jssf-remote-client-0.1.0";
  const DB_NAME = "quickstroke_jssf_remote_outbox";
  const DB_VERSION = 1;
  const RETENTION_DAYS = 90; // Matches the deployed primary-database retention migration.
  const OUTBOX_MARKER = "quickstroke_jssf_outbox_present";
  const EVENT_TYPES = new Set(["module_run_completed", "test_attempt_completed", "technical_event", "session_completed"]);
  const OBSERVATION = new Set(["no_alert", "attention", "abnormal", "indeterminate", "not_available"]);
  const VALIDITY = new Set(["valid", "invalid", "not_evaluable"]);
  const QUALITY = new Set(["acceptable", "limited", "unusable", "not_assessed"]);
  const MODULE = new Set(["face", "arm", "speech"]);
  const STATUS = new Set(["completed", "aborted", "interrupted"]);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ID = /^[A-Za-z0-9_-]{3,110}$/;
  let opening = null;
  let flushing = null;
  const withdrawingSessions = new Set();

  function config() {
    return global.QS_CONFIG?.jssfRemote || {};
  }
  function featureReady() {
    const cfg = config();
    return cfg.enabled === true && cfg.consentApproved === true
      && cfg.agePolicyApproved === true && cfg.retentionPolicyApproved === true
      // Current server contract supports verified adult consent only. Supporting minors
      // requires an explicitly reviewed guardian flow and a new backend contract.
      && cfg.minimumAge18Enforced === true
      && Number.isInteger(cfg.retentionDays) && cfg.retentionDays >= 1 && cfg.retentionDays <= 365
      && typeof cfg.privacyContact === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.privacyContact)
      && typeof cfg.endpoint === "string"
      && /^https:\/\//.test(cfg.endpoint)
      && typeof cfg.consentVersion === "string" && cfg.consentVersion.length >= 5;
  }
  function context() { return global.QuickStrokeDataContract?.getSessionContext?.() || {}; }
  function isRemoteContext(value = context()) {
    return value.appMode === "research"
      && value.researchMetadata?.researchProfile === "community_remote_qr"
      && value.researchMetadata?.consentStatus === "consented";
  }
  function canSync() { return featureReady() && isRemoteContext() && !withdrawingSessions.has(context().screeningSessionId); }
  function markOutboxPresent(present) {
    try {
      if (present) global.localStorage?.setItem(OUTBOX_MARKER,"1");
      else global.localStorage?.removeItem(OUTBOX_MARKER);
    } catch (_) { /* Some browsers disable localStorage. Explicit in-app withdrawal still works. */ }
  }
  function hasOutboxMarker() {
    try { return global.localStorage?.getItem(OUTBOX_MARKER)==="1"; }
    catch (_) { return false; }
  }
  function retentionExpired(credential, now=Date.now()) {
    const created=Date.parse(credential?.createdAt||"");
    return Number.isFinite(created) && created+RETENTION_DAYS*86400000<=now;
  }
  function openOutbox() {
    if (!global.indexedDB) return Promise.reject(new Error("IndexedDB is required for durable outbox"));
    if (opening) return opening;
    opening = new Promise((resolve,reject)=>{
      const req = global.indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded = ()=>{
        const db = req.result;
        if (!db.objectStoreNames.contains("queue")) {
          const store = db.createObjectStore("queue",{keyPath:"clientEventId"});
          store.createIndex("dedupeKey","dedupeKey",{unique:true});
          store.createIndex("sessionId","sessionId",{unique:false});
        }
        if (!db.objectStoreNames.contains("credentials")) db.createObjectStore("credentials",{keyPath:"clientSessionId"});
      };
      req.onsuccess = ()=>resolve(req.result);
      req.onerror = ()=>reject(req.error || new Error("Unable to open outbox"));
    }).catch(error=>{opening=null;throw error;});
    return opening;
  }
  function txResult(tx) {
    return new Promise((resolve,reject)=>{
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error || new Error("Outbox transaction failed"));
      tx.onabort=()=>reject(tx.error || new Error("Outbox transaction aborted"));
    });
  }
  function reqResult(req) {return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  function pick(value, choices) { return choices.has(value) ? value : undefined; }
  function int(value,min,max) {
    const v=Number(value);
    return Number.isInteger(v)&&v>=min&&v<=max?v:undefined;
  }
  function safeFlags(flags) {
    if (!Array.isArray(flags)) return [];
    return [...new Set(flags.filter(x=>typeof x==="string"&&/^[\w.:-]{1,64}$/.test(x)))].slice(0,16);
  }
  function safeId(value) {return typeof value==="string"&&ID.test(value)?value:null;}
  function runPayload(record) {
    return {
      moduleRunId:safeId(record.moduleRunId),
      sequenceNo:int(record.moduleRunSequenceNo,1,100),
      runStatus:pick(record.moduleRunStatus,STATUS),
      validityStatus:pick(record.validityStatus,VALIDITY),
      observationStatus:pick(record.observationStatus,OBSERVATION),
      qualityStatus:pick(record.qualityStatus,QUALITY),
      qualityFlags:safeFlags(record.qualityFlags),
      durationMs:record.startedAt&&record.completedAt?int(Date.parse(record.completedAt)-Date.parse(record.startedAt),0,3600000):undefined,
      attemptCount:int(record.attemptCount,0,100),
      retryCount:Number.isInteger(record.attemptCount)
        ? int(Math.max(0,record.attemptCount-(record.module==="arm"?2:1)),0,100)
        : undefined
    };
  }
  function attemptPayload(record) {
    return {
      testAttemptId:safeId(record.testAttemptId),
      moduleRunId:safeId(record.moduleRunId),
      attemptNo:int(record.attemptSequenceNo||record.attemptNo,1,100),
      measurementTarget:pick(record.measurementTarget,new Set(["face","left_arm","right_arm","speech"])),
      validityStatus:pick(record.validityStatus,VALIDITY),
      observationStatus:pick(record.observationStatus,OBSERVATION),
      invalidReasonCode:typeof record.invalidReasonCode==="string"&&/^[\w.:-]{1,80}$/.test(record.invalidReasonCode)?record.invalidReasonCode:undefined,
      qualityStatus:pick(record.qualityStatus,QUALITY),
      qualityFlags:safeFlags(record.qualityFlags),
      durationMs:record.startedAt&&record.completedAt?int(Date.parse(record.completedAt)-Date.parse(record.startedAt),0,3600000):undefined
    };
  }
  function eventFromRecord(kind,record) {
    if (!record||!MODULE.has(record.module)||!safeId(record.screeningSessionId)) return null;
    const isRun=kind==="module_run";
    const payload=isRun?runPayload(record):attemptPayload(record);
    if (!payload.moduleRunId || (!isRun&&!payload.testAttemptId)) return null;
    if (isRun&&!payload.sequenceNo) return null;
    if (!isRun&&!payload.attemptNo) return null;
    if (isRun&&payload.runStatus!=="completed"&&payload.observationStatus==="abnormal") payload.observationStatus="indeterminate";
    return {
      eventType:isRun?"module_run_completed":"test_attempt_completed",
      module:record.module,
      occurredAt:record.completedAt || new Date().toISOString(),
      payload,
      dedupeKey:(isRun?"run:":"attempt:")+(isRun?payload.moduleRunId:payload.testAttemptId)
    };
  }
  function issuedId() {
    if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    throw new Error("Secure event ID generator unavailable");
  }
  async function readCredential(clientSessionId) {
    const db=await openOutbox();
    const tx=db.transaction("credentials","readonly");
    const req=tx.objectStore("credentials").get(clientSessionId);
    const cred=await reqResult(req);
    return cred || null;
  }
  async function activate(enrollment, clientSessionId) {
    if (!featureReady() || !isRemoteContext()) throw new Error("Remote JSSF collection is not approved for this session");
    if (context().screeningSessionId!==clientSessionId) throw new Error("Session identity mismatch");
    if (!enrollment || !UUID.test(enrollment.sessionId) || !/^[0-9a-f]{64}$/.test(enrollment.uploadToken||"")
        || !/^[A-Z0-9-]{20,64}$/.test(enrollment.studyId||"")
        || !Number.isFinite(Date.parse(enrollment.createdAt||""))
        || retentionExpired(enrollment)) throw new Error("Invalid or expired server enrollment");
    const credential={
      clientSessionId,sessionId:enrollment.sessionId,studyId:enrollment.studyId,
      uploadToken:enrollment.uploadToken,createdAt:enrollment.createdAt,
      expiresAt:enrollment.expiresAt,consentVersion:config().consentVersion,
      withdrawalPending:false,remoteDeleted:false
    };
    const db=await openOutbox();
    const tx=db.transaction("credentials","readwrite");
    tx.objectStore("credentials").put(credential);await txResult(tx);
    markOutboxPresent(true);
    // A module may have completed before the enrollment receipt arrived.
    void recoverCompleted().then(()=>flush()).catch(error=>console.warn("JSSF recovery deferred",error));
    return {studyId:credential.studyId,sessionId:credential.sessionId};
  }
  async function enroll() {
    if (!featureReady() || !isRemoteContext()) throw new Error("JSSF consent or enrollment policy is not approved");
    const ctx=context();
    const cfg=config();
    if (ctx.researchMetadata?.consentVersion!==cfg.consentVersion) throw new Error("Consent version mismatch");
    const old=await readCredential(ctx.screeningSessionId);
    if (old?.withdrawalPending) throw new Error("Withdrawal pending: new enrollment is blocked for this session");
    if (old) return {sessionId:old.sessionId,studyId:old.studyId,reused:true};
    const agent=global.navigator?.userAgent||"";
    const platform=/iphone|ipad|ipod/i.test(agent)?"ios":/android/i.test(agent)?"android":/windows|macintosh|linux/i.test(agent)?"desktop":"other";
    const browser=/edg/i.test(agent)?"edge":/firefox|fxios/i.test(agent)?"firefox":/chrome|crios/i.test(agent)?"chrome":/safari/i.test(agent)?"safari":"other";
    const res=await global.fetch(cfg.endpoint.replace(/\/$/,"")+"/enroll",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({
        consentAccepted:true,
        age18plus:cfg.minimumAge18Enforced===true,
        consentVersion:cfg.consentVersion,
        clientSessionId:ctx.screeningSessionId,
        studyId:ctx.researchMetadata.studyId,
        participationScope:"usability_nonclinical",
        appVersion:global.QS_CONFIG.version,
        appBuildId:global.QS_CONFIG.buildId,
        platformFamily:platform,browserFamily:browser,
        locale:(global.QuickStrokeI18n?.getLocale?.()||"th").split("-")[0]
      })
    });
    if (!res.ok) throw new Error("Enrollment unavailable (HTTP "+res.status+")");
    const enrollment=await res.json();
    return activate(enrollment,ctx.screeningSessionId);
  }
  async function enqueue(event,ctx=context()) {
    if (!canSync() || !ctx.screeningSessionId || !event || !EVENT_TYPES.has(event.eventType)) return false;
    const cred=await readCredential(ctx.screeningSessionId);
    if (!cred || cred.withdrawalPending || retentionExpired(cred)) return false;
    const record={
      clientEventId:issuedId(),clientSessionId:ctx.screeningSessionId,sessionId:cred.sessionId,
      dedupeKey:event.dedupeKey||event.eventType+":"+issuedId(),
      state:"pending",queuedAt:new Date().toISOString(),
      event:{eventId:null,eventType:event.eventType,module:event.module||null,occurredAt:event.occurredAt||new Date().toISOString(),payload:event.payload}
    };
    record.event.eventId=record.clientEventId;
    const db=await openOutbox();
    const tx=db.transaction("queue","readwrite");
    const store=tx.objectStore("queue"),idx=store.index("dedupeKey");
    const current=await reqResult(idx.get(record.dedupeKey));
    if (!current) store.add(record);
    await txResult(tx);
    void flush().catch(()=>{});
    return true;
  }
  async function queueFinalized(kind,record) {
    if (!canSync()) return false;
    const evt=eventFromRecord(kind,record);
    if (!evt||record.screeningSessionId!==context().screeningSessionId) return false;
    return enqueue(evt);
  }
  async function pending(remoteSessionId) {
    const db=await openOutbox(),tx=db.transaction("queue","readonly");
    const rows=await reqResult(tx.objectStore("queue").index("sessionId").getAll(remoteSessionId));
    return rows.filter(row=>row.state==="pending").sort((a,b)=>a.queuedAt.localeCompare(b.queuedAt));
  }
  async function flush() {
    if (!canSync()) return {sent:0,reason:"disabled"};
    if (flushing) return flushing;
    flushing=(async()=>{
      const ctx=context(),cred=await readCredential(ctx.screeningSessionId);
      if (!cred) return {sent:0,reason:"not_enrolled"};
      if (cred.withdrawalPending) return {sent:0,reason:"withdrawal_pending"};
      if (retentionExpired(cred) || Date.parse(cred.expiresAt)<=Date.now()) return {sent:0,reason:"expired"};
      const rows=(await pending(cred.sessionId)).slice(0,25);
      if (!rows.length) return {sent:0,reason:"empty"};
      const res=await global.fetch(config().endpoint.replace(/\/$/,"")+"/events",{
        method:"POST",
        headers:{"content-type":"application/json","x-qs-session-token":cred.uploadToken},
        body:JSON.stringify({sessionId:cred.sessionId,events:rows.map(row=>row.event)})
      });
      if (!res.ok) throw new Error("Upload failed; retry on next open (HTTP "+res.status+")");
      const reply=await res.json(),ack=new Set(reply.acknowledged||[]);
      const db=await openOutbox(),tx=db.transaction("queue","readwrite"),store=tx.objectStore("queue");
      for (const row of rows) if (ack.has(row.clientEventId))store.put({...row,state:"acked",event:null,ackedAt:new Date().toISOString()});
      await txResult(tx);
      return {sent:rows.filter(row=>ack.has(row.clientEventId)).length,reason:"ok"};
    })().finally(()=>{flushing=null;});
    return flushing;
  }
  async function recoverCompleted(store=global.QuickStrokeResearchStore) {
    if (!canSync() || !store?.getAllByIndex) return {recovered:0,reason:"disabled"};
    const id=context().screeningSessionId,stores=store.stores;
    const [runs,attempts]=await Promise.all([
      store.getAllByIndex(stores.moduleRuns,"screeningSessionId",id),
      store.getAllByIndex(stores.testAttempts,"screeningSessionId",id)
    ]);
    let count=0;
    for (const attempt of attempts) if (attempt.attemptStatus==="completed"||attempt.attemptStatus==="aborted"||attempt.attemptStatus==="interrupted") count+=await queueFinalized("test_attempt",attempt)?1:0;
    for (const run of runs) if (["completed","aborted","interrupted"].includes(run.moduleRunStatus)) count+=await queueFinalized("module_run",run)?1:0;
    return {recovered:count};
  }
  async function completeSession() {
    if (!canSync()) return false;
    const evt={eventType:"session_completed",occurredAt:new Date().toISOString(),
      payload:{completedModules:["face","arm","speech"]},dedupeKey:"session_completed:"+context().screeningSessionId};
    return enqueue(evt);
  }
  function clearCurrentRemoteSessionStorage(screeningSessionId) {
    const ctx=context();
    if (!isRemoteContext(ctx) || ctx.screeningSessionId!==screeningSessionId) return false;
    const storage=global.sessionStorage;
    if (!storage) return false;
    // Only the active remote session is cleared. Public abnormal history,
    // locale choice and unrelated clinic/engineering sessions remain untouched.
    const exact=new Set([
      "fast_participant_id","fast_screening_session_id","fast_assessment_id",
      "fast_legacy_assessment_id","fast_started_at","fast_mode",
      "fast_session_status","fast_protocol_completed_at","fast_finalized_at",
      "fast_session_completion_reason","fast_session_finalization_metadata",
      "fast_session_schema_version","fast_baseline_manifest_version",
      "fast_pending_module_retry","fast_result_source","fast_result_decision_trace",
      "fast_result_decision_trace_hash","fast_face","fast_arm","fast_speech",
      "fast_face_research_latest","fast_arm_research_latest","fast_speech_research_latest",
      "fast_completed_at","fast_research_store_status","fast_research_store_error_code"
    ]);
    for (let i=storage.length-1;i>=0;i--) {
      const key=storage.key(i);
      if (exact.has(key) ||
          ((key?.startsWith("fast_module_run_sequence_") ||
            key?.startsWith("fast_attempt_sequence_") ||
            key?.startsWith("fast_target_attempt_sequence_")) && key.includes(screeningSessionId)) ||
          ["fast_current_module_run_face","fast_current_module_run_arm","fast_current_module_run_speech"].includes(key)) {
        storage.removeItem(key);
      }
    }
    for (const name of ["face","arm","speech"]) {
      const historyKey="fast_"+name+"_research_history", raw=storage.getItem(historyKey);
      if (!raw) continue;
      try {
        const history=JSON.parse(raw);
        if (!Array.isArray(history)) continue;
        const retained=history.filter(row=>row?.screeningSessionId!==screeningSessionId);
        if (retained.length) storage.setItem(historyKey,JSON.stringify(retained));
        else storage.removeItem(historyKey);
      } catch (_) { storage.removeItem(historyKey); }
    }
    global.QuickStrokeAppMode?.clearSessionSnapshot?.();
    global.QuickStrokeAppMode?.clearResearchContext?.();
    global.QuickStrokeAppMode?.setMode?.("public",{source:"jssf_remote_withdrawal"});
    return true;
  }
  async function listCredentials() {
    const db=await openOutbox();
    const tx=db.transaction("credentials","readonly");
    return reqResult(tx.objectStore("credentials").getAll());
  }
  async function updateCredential(clientSessionId,patch) {
    const db=await openOutbox();
    const tx=db.transaction("credentials","readwrite");
    const store=tx.objectStore("credentials");
    const existing=await reqResult(store.get(clientSessionId));
    if (!existing) throw new Error("JSSF withdrawal capability is no longer available");
    const next={...existing,...patch};
    store.put(next);await txResult(tx);
    return next;
  }
  async function clearOutboxSession(credential,{removeCredential=false}={}) {
    const db=await openOutbox();
    const tx=db.transaction(["credentials","queue"],"readwrite");
    const queue=tx.objectStore("queue");
    const rows=await reqResult(queue.index("sessionId").getAll(credential.sessionId));
    for (const row of rows) queue.delete(row.clientEventId);
    if (removeCredential) tx.objectStore("credentials").delete(credential.clientSessionId);
    await txResult(tx);
    if (removeCredential && !(await listCredentials()).length) markOutboxPresent(false);
  }
  async function eraseLocalResearch(credential) {
    const store=global.QuickStrokeResearchStore;
    if (typeof store?.purgeRemoteSessionLocal!=="function")
      throw new Error("Research deletion module not available; retry on a full app page");
    await store.purgeRemoteSessionLocal(credential.clientSessionId);
    clearCurrentRemoteSessionStorage(credential.clientSessionId);
    return true;
  }
  async function continueWithdrawal(credential) {
    if (!credential?.withdrawalPending) return {pending:false,reason:"no_withdrawal_requested"};
    let latest=credential,localDeleted=false,remoteDeleted=credential.remoteDeleted===true;
    let localError=null,remoteError=null;
    try { localDeleted=await eraseLocalResearch(latest); }
    catch (error) { localError=error?.message||"Local deletion unavailable"; }
    if (!remoteDeleted) {
      try {
        const endpoint=config().endpoint;
        if (typeof endpoint!=="string" || !/^https:\/\//.test(endpoint))
          throw new Error("Withdrawal endpoint unavailable");
        const res=await global.fetch(endpoint.replace(/\/$/,"")+"/withdraw",{
          method:"POST",headers:{"content-type":"application/json","x-qs-session-token":latest.uploadToken},
          body:JSON.stringify({sessionId:latest.sessionId})
        });
        if (!res.ok) throw new Error("Server withdrawal pending (HTTP "+res.status+")");
        const result=await res.json();
        if (result.withdrawn!==true || result.remoteDataDeleted!==true)
          throw new Error("Unconfirmed server withdrawal response");
        // Persist acknowledgement before clearing the capability, so local
        // deletion can be retried without making another server request.
        latest=await updateCredential(latest.clientSessionId,{remoteDeleted:true});
        remoteDeleted=true;
      } catch (error) { remoteError=error?.message||"Remote withdrawal unavailable"; }
    }
    if (remoteDeleted && localDeleted) {
      await clearOutboxSession(latest,{removeCredential:true});
      return {complete:true,remoteDeleted:true,localDeleted:true,pending:false};
    }
    return {
      complete:false,remoteDeleted,localDeleted,pending:true,
      localError,remoteError
    };
  }
  async function hasEnrollment() {
    const ctx=context();
    if (!isRemoteContext(ctx) || !ctx.screeningSessionId) return false;
    return Boolean(await readCredential(ctx.screeningSessionId));
  }
  async function requestWithdrawal() {
    const ctx=context();
    if (!isRemoteContext(ctx) || !ctx.screeningSessionId)
      throw new Error("Only an enrolled JSSF nonclinical session can request withdrawal");
    const id=ctx.screeningSessionId;
    withdrawingSessions.add(id); // Stop this tab's new uploads immediately.
    try {
      if (flushing) await flushing.catch(()=>null);
      const existing=await readCredential(id);
      if (!existing) throw new Error("No JSSF upload capability; contact the study administrator");
      if (!existing.withdrawalPending) {
        // Keep only the capability required to retry an offline deletion; erase
        // all pending and acknowledged research events from the outbox now.
        await clearOutboxSession(existing);
      }
      const credential=await updateCredential(id,{
        withdrawalPending:true,withdrawalRequestedAt:existing.withdrawalRequestedAt||new Date().toISOString()
      });
      return continueWithdrawal(credential);
    } finally { withdrawingSessions.delete(id); }
  }
  async function resumePendingWithdrawals() {
    const credentials=await listCredentials();
    const results=[];
    for (const cred of credentials) {
      if (cred.withdrawalPending) {
        results.push(await continueWithdrawal(cred));
      }
    }
    return results;
  }
  async function purgeExpiredLocal(now=Date.now()) {
    const credentials=await listCredentials();
    let purged=0;
    for (const cred of credentials) {
      if (!retentionExpired(cred,now)) continue;
      // The server deletes data at 90 days on its hourly schedule. Local
      // cleanup is independent and never touches another research profile.
      await eraseLocalResearch(cred);
      await clearOutboxSession(cred,{removeCredential:true});
      purged++;
    }
    return {purged};
  }
  async function privacyMaintenance() {
    if (!hasOutboxMarker()) return {skipped:true};
    // An unavailable local database or network must not delete the capability
    // needed for a later withdrawal retry.
    const expired=await purgeExpiredLocal();
    const withdrawals=await resumePendingWithdrawals();
    return {expired,withdrawals};
  }
  // Completion events are raised only *after* the local canonical IndexedDB transaction has committed.
  global.addEventListener?.("quickstroke:research-record-finalized",evt=>{
    if (!canSync()) return;
    const detail=evt.detail||{};
    void queueFinalized(detail.kind,detail.record).catch(error=>console.warn("JSSF local outbox error",error));
  });
  global.addEventListener?.("online",()=>{
    if (hasOutboxMarker()) void privacyMaintenance().catch(error=>console.warn("JSSF privacy retry deferred",error));
    if (canSync()) void flush().catch(()=>{});
  });
  if (global.document) global.document.addEventListener("visibilitychange",()=>{if(!global.document.hidden&&canSync())void flush().catch(()=>{});});
  const api=Object.freeze({version:VERSION,featureReady,isRemoteContext,canSync,eventFromRecord,openOutbox,enroll,activate,
    enqueue,queueFinalized,recoverCompleted,pending,flush,completeSession,
    hasEnrollment,requestWithdrawal,resumePendingWithdrawals,purgeExpiredLocal,privacyMaintenance});
  Object.defineProperty(global,"QuickStrokeJssfRemote",{value:api,enumerable:true,configurable:false,writable:false});
  if (global.document) global.document.addEventListener("DOMContentLoaded",()=>{
    if (hasOutboxMarker()) void privacyMaintenance().catch(error=>console.warn("JSSF privacy cleanup deferred",error));
    if (!canSync()) return;
    void recoverCompleted().then(()=>flush()).catch(error=>console.warn("JSSF recovery deferred",error));
  });
})(typeof window!=="undefined"?window:globalThis);
