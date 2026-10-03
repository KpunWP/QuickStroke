// JSSF remote usability event sanitizer. No clinical claims; no raw audio, video, transcripts or sensor streams.
export const CONTRACT_VERSION = "jssf-remote-ingest-0.1.0";
const EVENT_TYPES = new Set(["module_run_completed", "test_attempt_completed", "technical_event", "face_research_summary", "face_research_chunk", "session_completed"]);
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
const FACE_PHASES = new Set(["RESTING_PHASE","ACTION_PHASE","ACTION_WAIT_SMILE","RETRYING"]);
const FACE_SUMMARY_KEYS = new Set([
  "representativeAsym","blendAsym","riseAsym","weakRatio","geometryRiseUsable",
  "aggregatedSignedRiseLeft","aggregatedSignedRiseRight","effectiveRiseLeft","effectiveRiseRight",
  "restingCriticalTriggered","restAsym","peakSmileL","peakSmileR","peakRiseL","peakRiseR",
  "validSmileFrames","smileFrameCount","validSmileRatio","visibleMouthFrames","avgMouthVisibility",
  "pairedBlendAsymMedian","pairedBlendAsymP75","pairedBlendAsymP90","pairedBlendAsymMax",
  "pairedBlendAsymOverWarnRatio","pairedBlendAsymOverBadRatio","pairedBlendAsymLongestMs",
  "riskLevel","validityStatus","invalidReasonCode"
]);
const FACE_BASELINE_KEYS = new Set([
  "sampleCount","baseLeft","baseRight","baseMouthLeftX","baseMouthRightX","baseEyeDistance","baseRawMouthLeftY","baseRawMouthRightY",
  "baseEyeCenterX","baseEyeCenterY","baseEyeLineRollDeg","baseSmileLeft","baseSmileRight","baseMouthWidth",
  "restAsymMean","restAsymMedian","restAsymMax","restStabilityMad","baselineEyeMadRatio","criticalTriggered","criticalRestAsym"
]);
const FACE_THRESHOLD_KEYS = new Set([
  "version","algorithmVersion","resultSchemaVersion","researchPayloadVersion",
  "calibrationSeconds","actionDurationMs","maxAssessAttempts","retryDelayMs","smileNudgeMinMs",
  "weakSideRatioBad","weakSideRatioShadow","smileDetectMin","smileDetectSide","smileValidStrength",
  "realMoveMin","closedSmileRiseMin","smileRealMin","smileDeltaMin","closedSmileWidthMin","closedSmileEvidenceHoldMs",
  "baselineCornerMadMax","baselineEyeMadRatioMax","minValidSmileFrames","minVisibleMouthFrames",
  "minMouthVisibilityScore","minMouthDarkRatio","minMouthCentralDarkRatio","minMouthLineScore",
  "handMouthOverlapMin","maxWaitForSmileMs","baselineAlignmentTimeoutMs","smileLostGraceMs",
  "smileOcclusionResetMs","minValidSmileRatio","smileAsymWarn","smileAsymBad","restAsymCritical",
  "criticalNoticeMs","maxAllowedYaw","maxAllowedPitch","maxAllowedRoll","restMaxAllowedYaw","restMaxAllowedPitch","restMaxAllowedRoll","poseBadTripFrames",
  "poseGoodResumeFrames","enforceHandModel","researchSampleIntervalMs",
  "attemptMouthAssessableRatioMin","attemptHandOverlapRatioMin"
]);
const FACE_FRAME_KEYS = new Set([
  "tMs","phase","faceDetected","poseValid","yawDeg","pitchDeg","rollDeg","eyeDistance","eyeDistanceRatioFromBaseline",
  "rawEyeCenterX","rawEyeCenterY","normalizedMouthLeftX","normalizedMouthLeftY","normalizedMouthRightX","normalizedMouthRightY",
  "normalizedSignedDisplacementLeft","normalizedSignedDisplacementRight","smileLeft","smileRight","smileDeltaLeft","smileDeltaRight",
  "pairedBlendAsymmetry","mouthWidth","mouthWidthDelta","cornerLateralLeft","cornerLateralRight",
  "blendSmileEvidence","geometrySmileEvidence","mouthVisibilityScore","mouthDarkRatio","mouthCentralDarkRatio","mouthLineScore",
  "mouthContrast","mouthEdge","mouthOpen","mouthAssessable","handMouthOverlap","handModelAvailable","distanceValid","neutralExpressionValid"
]);
function finite(value,key) {
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1000000) throw new TypeError("Invalid "+key);
  return value;
}
function scalarObject(source, allowed, key) {
  if (!object(source)) return {};
  const out={};
  for (const [name,value] of Object.entries(source)) {
    if (!allowed.has(name)) continue;
    if (typeof value === "number") out[name]=finite(value,key+"."+name);
    else if (typeof value === "boolean") out[name]=value;
    else if (typeof value === "string") out[name]=optionalString(value,100,key+"."+name);
    else if (value === null) out[name]=null;
  }
  return out;
}
function faceFrame(source) {
  if (!object(source)) throw new TypeError("Invalid Face frame");
  const out=scalarObject(source,FACE_FRAME_KEYS,"faceFrame");
  if (out.phase != null && !FACE_PHASES.has(out.phase)) throw new TypeError("Invalid Face phase");
  if (out.tMs != null && (out.tMs < 0 || out.tMs > 120000)) throw new TypeError("Invalid Face tMs");
  return out;
}

function payloadFor(type, source) {
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
      durationMs: optionalDuration(source.durationMs)
    };
  }
  if (type === "technical_event") {
    if (!TECH_CODES.has(source.code)) throw new TypeError("Unrecognized technical event");
    return { code: source.code, relatedModuleRunId: source.relatedModuleRunId ? identifier(source.relatedModuleRunId, "relatedModuleRunId") : undefined };
  }
  if (type === "face_research_summary") {
    const frameCount=intInRange(source.frameCount ?? 0,0,1000,"frameCount");
    return {
      moduleRunId:identifier(source.moduleRunId,"moduleRunId"),
      testAttemptId:identifier(source.testAttemptId,"testAttemptId"),
      algorithmVersion:optionalString(source.algorithmVersion,100,"algorithmVersion"),
      researchPayloadVersion:optionalString(source.researchPayloadVersion,100,"researchPayloadVersion"),
      sampleIntervalMs:source.sampleIntervalMs == null ? undefined : intInRange(source.sampleIntervalMs,20,5000,"sampleIntervalMs"),
      storesImagesOrVideo:source.storesImagesOrVideo === false ? false : (()=>{throw new TypeError("Face research must not store images or video");})(),
      frameCount,
      baseline:scalarObject(source.baseline,FACE_BASELINE_KEYS,"baseline"),
      summary:scalarObject(source.summary,FACE_SUMMARY_KEYS,"summary"),
      thresholds:scalarObject(source.thresholds,FACE_THRESHOLD_KEYS,"thresholds")
    };
  }
  if (type === "face_research_chunk") {
    if (!Array.isArray(source.frames) || source.frames.length < 1 || source.frames.length > 8) throw new TypeError("Invalid Face research frame chunk");
    return {
      moduleRunId:identifier(source.moduleRunId,"moduleRunId"),
      testAttemptId:identifier(source.testAttemptId,"testAttemptId"),
      chunkNo:intInRange(source.chunkNo,1,500,"chunkNo"),
      chunkCount:intInRange(source.chunkCount,1,500,"chunkCount"),
      sampleIntervalMs:source.sampleIntervalMs == null ? undefined : intInRange(source.sampleIntervalMs,20,5000,"sampleIntervalMs"),
      frames:source.frames.map(faceFrame)
    };
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
  if ((type === "module_run_completed" || type === "test_attempt_completed" || type === "face_research_summary" || type === "face_research_chunk") && !module) throw new TypeError("Missing module");
  if ((type === "face_research_summary" || type === "face_research_chunk") && module !== "face") throw new TypeError("Face research event requires face module");
  // Explicit allowlist: unknown user-controlled properties are never forwarded to storage.
  const sanitized = {
    client_event_id: source.eventId,
    event_type: type,
    module,
    occurred_at: isoDate(source.occurredAt, "occurredAt"),
    payload: payloadFor(type, source.payload),
    schema_version: CONTRACT_VERSION
  };
  if (JSON.stringify(sanitized).length > 15000) throw new TypeError("Event too large");
  return sanitized;
}
export function sanitizeBatch(events) {
  if (!Array.isArray(events) || !events.length || events.length > 25) throw new TypeError("Expected 1-25 events");
  const sanitized = events.map(sanitizeEvent);
  if (new Set(sanitized.map(x => x.client_event_id)).size !== sanitized.length) throw new TypeError("Duplicate event IDs in batch");
  return sanitized;
}
