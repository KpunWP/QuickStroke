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

  function config() {
    return global.QS_CONFIG?.jssfRemote || {};
  }
  function featureReady() {
    const cfg = config();
    return cfg.enabled === true && cfg.consentApproved === true
      && cfg.agePolicyApproved === true && cfg.retentionPolicyApproved === true
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
  function canSync() { return featureReady() && isRemoteContext(); }
  function openOutbox() {
    if (!global.indexedDB) return Promise.reject(new Error("IndexedDB is required for durable outbox"));
    if (opening) return opening;
    opening = new Promise((resolve,reject)=>{
      const req = indexedDB.open(DB_NAME,DB_VERSION);
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
        || !/^[A-Z0-9-]{20,64}$/.test(enrollment.studyId||"")) throw new Error("Invalid server enrollment");
    const credential={
      clientSessionId,sessionId:enrollment.sessionId,studyId:enrollment.studyId,
      uploadToken:enrollment.uploadToken,expiresAt:enrollment.expiresAt,consentVersion:config().consentVersion
    };
    const db=await openOutbox();
    const tx=db.transaction("credentials","readwrite");
    tx.objectStore("credentials").put(credential);await txResult(tx);
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
    if (old) return {sessionId:old.sessionId,studyId:old.studyId,reused:true};
    const agent=navigator.userAgent||"";
    const platform=/iphone|ipad|ipod/i.test(agent)?"ios":/android/i.test(agent)?"android":/windows|macintosh|linux/i.test(agent)?"desktop":"other";
    const browser=/edg/i.test(agent)?"edge":/firefox|fxios/i.test(agent)?"firefox":/chrome|crios/i.test(agent)?"chrome":/safari/i.test(agent)?"safari":"other";
    const res=await fetch(cfg.endpoint.replace(/\/$/,"")+"/enroll",{
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
    if (!cred) return false;
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
      if (Date.parse(cred.expiresAt)<=Date.now()) return {sent:0,reason:"expired"};
      const rows=(await pending(cred.sessionId)).slice(0,25);
      if (!rows.length) return {sent:0,reason:"empty"};
      const res=await fetch(config().endpoint.replace(/\/$/,"")+"/events",{
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
  // Completion events are raised only *after* the local canonical IndexedDB transaction has committed.
  global.addEventListener?.("quickstroke:research-record-finalized",evt=>{
    if (!canSync()) return;
    const detail=evt.detail||{};
    void queueFinalized(detail.kind,detail.record).catch(error=>console.warn("JSSF local outbox error",error));
  });
  global.addEventListener?.("online",()=>{if(canSync())void flush().catch(()=>{});});
  if (global.document) global.document.addEventListener("visibilitychange",()=>{if(!global.document.hidden&&canSync())void flush().catch(()=>{});});
  const api=Object.freeze({version:VERSION,featureReady,isRemoteContext,canSync,eventFromRecord,openOutbox,enroll,activate,
    enqueue,queueFinalized,recoverCompleted,pending,flush,completeSession});
  Object.defineProperty(global,"QuickStrokeJssfRemote",{value:api,enumerable:true,configurable:false,writable:false});
  if (global.document) global.document.addEventListener("DOMContentLoaded",()=>{
    if (!canSync()) return;
    void recoverCompleted().then(()=>flush()).catch(error=>console.warn("JSSF recovery deferred",error));
  });
})(typeof window!=="undefined"?window:globalThis);
