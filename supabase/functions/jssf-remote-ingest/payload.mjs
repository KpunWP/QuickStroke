// JSSF remote usability event sanitizer. No clinical claims; no raw audio, video, transcripts or sensor streams.
export const CONTRACT_VERSION = "jssf-remote-ingest-0.2.0";
const EVENT_TYPES = new Set(["module_run_completed", "test_attempt_completed", "technical_event", "session_completed"]);
const MODULES = new Set(["face", "arm", "speech"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECORD_ID = /^[A-Za-z0-9_-]{3,110}$/;
const VALIDITIES = new Set(["valid", "invalid", "not_evaluable"]);
const OBSERVATIONS = new Set(["no_alert", "attention", "abnormal", "indeterminate", "not_available"]);
const QUALITY = new Set(["acceptable", "limited", "unusable", "not_assessed"]);
const RUN_STATUSES = new Set(["completed", "aborted", "interrupted"]);
const TECH_CODES = new Set(["PERMISSION_DENIED", "SENSOR_UNAVAILABLE", "SENSOR_STALE", "PAGE_HIDDEN", "STORAGE_WRITE_FAILED", "MODULE_RETRY_REQUESTED", "MIC_PERMISSION_DENIED", "CAMERA_UNAVAILABLE", "TTS_UNAVAILABLE", "ASR_UNAVAILABLE", "OTHER_TECHNICAL_ERROR", "ASR_NO_SPEECH", "ASR_AUDIO_CAPTURE", "ASR_PERMISSION_OR_SERVICE_DENIED", "ASR_NETWORK", "ASR_LANGUAGE_OR_GRAMMAR", "ASR_ABORTED", "ASR_NO_TRANSCRIPT", "ASR_OTHER_ERROR"]);

function object(value) { return value && typeof value === "object" && !Array.isArray(value); }
function optionalEnum(value, allowed, key) {
  if (value == null) return undefined;
  if (!allowed.has(value)) throw new TypeError("Invalid " + key);
  return value;
}
function identifier(value, key) {
  if (typeof value !== "string" || !RECORD_ID.test(value)) throw new TypeError("Invalid " + key);
  return value;
}
function intInRange(value, min, max, key) {
  if (!Number.isInteger(value) || value < min || value > max) throw new TypeError("Invalid " + key);
  return value;
}
function optionalString(value, length, key) {
  if (value == null) return undefined;
  if (typeof value !== "string" || value.length > length || !/^[\w.:-]+$/.test(value)) throw new TypeError("Invalid " + key);
  return value;
}
function isoDate(value, key) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))) throw new TypeError("Invalid " + key);
  const time = Date.parse(value), now = Date.now();
  if (time > now + 300000 || time < now - 30 * 86400000) throw new TypeError("Out-of-range " + key);
  return new Date(time).toISOString();
}
function flags(values) {
  if (values == null) return [];
  if (!Array.isArray(values) || values.length > 16) throw new TypeError("Invalid quality flags");
  return values.map(value => optionalString(value, 64, "qualityFlag"));
}
function optionalDuration(value) {
  if (value == null) return undefined;
  return intInRange(value, 0, 3600000, "durationMs");
}
function optionalNumber(value, min, max, key, digits = 4) {
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new TypeError("Invalid " + key);
  return Number(value.toFixed(digits));
}
function sanitizeArmResearch(source) {
  if (source == null) return undefined;
  if (!object(source)) throw new TypeError("Invalid armResearch");
  let protocolUnderstanding;
  if (source.protocolUnderstanding != null) {
    if (!object(source.protocolUnderstanding)) throw new TypeError("Invalid arm protocol understanding");
    if (!["understood","not_understood"].includes(source.protocolUnderstanding.answer)) throw new TypeError("Invalid arm protocol understanding answer");
    protocolUnderstanding = {
      answer:source.protocolUnderstanding.answer,
      questionVersion:optionalString(source.protocolUnderstanding.questionVersion,80,"armQuestionVersion")
    };
  }
  let raiseGesture;
  if (source.raiseGesture != null) {
    if (!object(source.raiseGesture)) throw new TypeError("Invalid raiseGesture");
    if (source.raiseGesture.detected != null && typeof source.raiseGesture.detected !== "boolean") throw new TypeError("Invalid raiseGesture detected");
    raiseGesture = {
      detected:source.raiseGesture.detected,
      maxAngleFromRestDeg:optionalNumber(source.raiseGesture.maxAngleFromRestDeg,0,180,"maxAngleFromRestDeg"),
      thresholdDeg:optionalNumber(source.raiseGesture.thresholdDeg,0,180,"raiseGestureThresholdDeg"),
      hardGate:false
    };
  }
  if (!object(source.measurement)) throw new TypeError("Missing arm measurement research summary");
  const rawCutoffs=source.measurement.cutoffs;
  if (!Array.isArray(rawCutoffs)||rawCutoffs.length>7) throw new TypeError("Invalid arm cutoffs");
  const cutoffs=rawCutoffs.map(row=>{
    if (!object(row)) throw new TypeError("Invalid arm cutoff");
    if (typeof row.available !== "boolean") throw new TypeError("Invalid arm cutoff availability");
    return {
      second:intInRange(row.second,3,10,"armCutoffSecond"),
      available:row.available,
      capturedThroughMs:row.capturedThroughMs==null?undefined:intInRange(row.capturedThroughMs,0,12000,"armCapturedThroughMs"),
      driftMaxDeg:optionalNumber(row.driftMaxDeg,0,180,"armCutoffDrift"),
      peakDeltaX:optionalNumber(row.peakDeltaX,-2,2,"armPeakDeltaX"),
      peakDeltaZ:optionalNumber(row.peakDeltaZ,-2,2,"armPeakDeltaZ"),
      ratioZX:optionalNumber(row.ratioZX,0,100,"armRatioZX"),
      motionClass:optionalString(row.motionClass,40,"armMotionClass")
    };
  });
  const rawTrace=source.trace==null?[]:source.trace;
  if (!Array.isArray(rawTrace)||rawTrace.length>21) throw new TypeError("Invalid arm trace");
  const trace=rawTrace.map(row=>{
    if (!object(row)) throw new TypeError("Invalid arm trace point");
    if (row.sensorFresh != null && typeof row.sensorFresh !== "boolean") throw new TypeError("Invalid sensorFresh");
    return {
      tMs:intInRange(row.tMs,0,12000,"armTraceTime"),
      driftDeg:optionalNumber(row.driftDeg,0,180,"armTraceDrift"),
      driftMaxDeg:optionalNumber(row.driftMaxDeg,0,180,"armTraceMaxDrift"),
      deltaX:optionalNumber(row.deltaX,-2,2,"armTraceDeltaX"),
      deltaZ:optionalNumber(row.deltaZ,-2,2,"armTraceDeltaZ"),
      ratioZX:optionalNumber(row.ratioZX,0,100,"armTraceRatio"),
      screenY:optionalNumber(row.screenY,-1.2,1.2,"armTraceScreenY"),
      screenZ:optionalNumber(row.screenZ,-1.2,1.2,"armTraceScreenZ"),
      sensorFresh:row.sensorFresh
    };
  });
  return {
    schemaVersion:optionalString(source.schemaVersion,80,"armResearchSchemaVersion"),
    protocolUnderstanding,
    raiseGesture,
    measurement:{
      targetDurationMs:source.measurement.targetDurationMs==null?undefined:intInRange(source.measurement.targetDurationMs,1000,20000,"targetDurationMs"),
      observedDurationMs:source.measurement.observedDurationMs==null?undefined:intInRange(source.measurement.observedDurationMs,0,20000,"observedDurationMs"),
      finalDriftMaxDeg:optionalNumber(source.measurement.finalDriftMaxDeg,0,180,"finalDriftMaxDeg"),
      finalRatioZX:optionalNumber(source.measurement.finalRatioZX,0,100,"finalRatioZX"),
      finalMotionClass:optionalString(source.measurement.finalMotionClass,40,"finalMotionClass"),
      cutoffs
    },
    trace
  };
}
function payloadFor(type, source, module = null) {
  if (!object(source)) throw new TypeError("Invalid event payload");
  if (type === "module_run_completed") {
    const p = {
      moduleRunId: identifier(source.moduleRunId, "moduleRunId"),
      sequenceNo: intInRange(source.sequenceNo, 1, 100, "sequenceNo"),
      runStatus: optionalEnum(source.runStatus, RUN_STATUSES, "runStatus") || "completed",
      validityStatus: optionalEnum(source.validityStatus, VALIDITIES, "validityStatus"),
      observationStatus: optionalEnum(source.observationStatus, OBSERVATIONS, "observationStatus"),
      qualityStatus: optionalEnum(source.qualityStatus, QUALITY, "qualityStatus"),
      qualityFlags: flags(source.qualityFlags),
      durationMs: optionalDuration(source.durationMs),
      attemptCount: source.attemptCount == null ? undefined : intInRange(source.attemptCount, 0, 100, "attemptCount"),
      retryCount: source.retryCount == null ? undefined : intInRange(source.retryCount, 0, 100, "retryCount"),
      algorithmVersion: optionalString(source.algorithmVersion, 100, "algorithmVersion")
    };
    if (p.runStatus !== "completed" && p.observationStatus === "abnormal") throw new TypeError("Incomplete run cannot be labelled abnormal");
    return p;
  }
  if (type === "test_attempt_completed") {
    return {
      testAttemptId: identifier(source.testAttemptId, "testAttemptId"),
      moduleRunId: identifier(source.moduleRunId, "moduleRunId"),
      attemptNo: intInRange(source.attemptNo, 1, 100, "attemptNo"),
      measurementTarget: optionalEnum(source.measurementTarget, new Set(["face","left_arm","right_arm","speech"]), "measurementTarget"),
      validityStatus: optionalEnum(source.validityStatus, VALIDITIES, "validityStatus"),
      observationStatus: optionalEnum(source.observationStatus, OBSERVATIONS, "observationStatus"),
      invalidReasonCode: optionalString(source.invalidReasonCode, 80, "invalidReasonCode"),
      qualityStatus: optionalEnum(source.qualityStatus, QUALITY, "qualityStatus"),
      qualityFlags: flags(source.qualityFlags),
      durationMs: optionalDuration(source.durationMs),
      armResearch: module === "arm" ? sanitizeArmResearch(source.armResearch) : undefined
    };
  }
  if (type === "technical_event") {
    if (!TECH_CODES.has(source.code)) throw new TypeError("Unrecognized technical event");
    return { code: source.code, relatedModuleRunId: source.relatedModuleRunId ? identifier(source.relatedModuleRunId, "relatedModuleRunId") : undefined };
  }
  const completed = source.completedModules;
  if (!Array.isArray(completed) || completed.length > 3 || completed.some(x => !MODULES.has(x)) || new Set(completed).size !== completed.length) {
    throw new TypeError("Invalid completedModules");
  }
  return { completedModules: completed };
}
export function sanitizeEvent(source) {
  if (!object(source) || typeof source.eventId !== "string" || !UUID.test(source.eventId)) throw new TypeError("Invalid eventId");
  if (!EVENT_TYPES.has(source.eventType)) throw new TypeError("Invalid event type");
  const type = source.eventType;
  const module = source.module == null ? null : source.module;
  if (module !== null && !MODULES.has(module)) throw new TypeError("Invalid module");
  if ((type === "module_run_completed" || type === "test_attempt_completed") && !module) throw new TypeError("Missing module");
  // Explicit allowlist: unknown user-controlled properties are never forwarded to storage.
  const sanitized = {
    client_event_id: source.eventId,
    event_type: type,
    module,
    occurred_at: isoDate(source.occurredAt, "occurredAt"),
    payload: payloadFor(type, source.payload, module),
    schema_version: CONTRACT_VERSION
  };
  if (JSON.stringify(sanitized).length > 4000) throw new TypeError("Event too large");
  return sanitized;
}
export function sanitizeBatch(events) {
  if (!Array.isArray(events) || !events.length || events.length > 25) throw new TypeError("Expected 1-25 events");
  const sanitized = events.map(sanitizeEvent);
  if (new Set(sanitized.map(x => x.client_event_id)).size !== sanitized.length) throw new TypeError("Duplicate event IDs in batch");
  return sanitized;
}
