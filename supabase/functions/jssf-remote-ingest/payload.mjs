// JSSF remote usability event sanitizer. No clinical claims; no raw audio, video, transcripts or sensor streams.
export const CONTRACT_VERSION = "jssf-remote-ingest-0.6.0";
const EVENT_TYPES = new Set(["module_run_completed", "test_attempt_completed", "technical_event", "face_research_attempt", "face_research_samples", "session_completed"]);
const MODULES = new Set(["face", "arm", "speech"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECORD_ID = /^[A-Za-z0-9_-]{3,110}$/;
const VALIDITIES = new Set(["valid", "invalid", "not_evaluable"]);
const OBSERVATIONS = new Set(["no_alert", "attention", "abnormal", "indeterminate", "not_available"]);
const QUALITY = new Set(["acceptable", "limited", "unusable", "not_assessed"]);
const RUN_STATUSES = new Set(["completed", "aborted", "interrupted"]);
const TECH_CODES = new Set(["PERMISSION_DENIED", "SENSOR_UNAVAILABLE", "SENSOR_STALE", "PAGE_HIDDEN", "STORAGE_WRITE_FAILED", "MODULE_RETRY_REQUESTED", "MIC_PERMISSION_DENIED", "CAMERA_UNAVAILABLE", "TTS_UNAVAILABLE", "ASR_UNAVAILABLE", "OTHER_TECHNICAL_ERROR", "ASR_NO_SPEECH", "ASR_AUDIO_CAPTURE", "ASR_PERMISSION_OR_SERVICE_DENIED", "ASR_NETWORK", "ASR_LANGUAGE_OR_GRAMMAR", "ASR_ABORTED", "ASR_NO_TRANSCRIPT", "ASR_OTHER_ERROR"]);
const FACE_SAMPLE_FIELDS = Object.freeze([
  "tMs","phaseCode","poseValid","yawDeg","pitchDeg","rollDeg","eyeDistance","eyeDistanceRatioFromBaseline",
  "rawMouthLeftX","rawMouthLeftY","rawMouthRightX","rawMouthRightY",
  "normalizedMouthLeftX","normalizedMouthLeftY","normalizedMouthRightX","normalizedMouthRightY",
  "rawSignedDisplacementLeft","rawSignedDisplacementRight","normalizedSignedDisplacementLeft","normalizedSignedDisplacementRight",
  "smileLeft","smileRight","deltaSmileLeft","deltaSmileRight","mouthWidth","mouthWidthDelta",
  "lateralOutwardLeft","lateralOutwardRight","relativeBlendEvidence","relativeGeometryEvidence",
  "relativeSmileCandidate","relativeSmilePersisted","smileConfirmed",
  "mouthVisibilityScore","mouthDarkRatio","mouthCentralDarkRatio","mouthLineScore",
  "mouthAssessable","handMouthOverlap","blendSmileEvidence","geometrySmileEvidence"
]);
const FACE_OUTCOMES = new Set(["valid","invalid","not_evaluable","aborted","interrupted"]);


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
function finiteOrNull(value, key, min = -1000000, max = 1000000) {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new TypeError("Invalid " + key);
  return value;
}
function boolOrNull(value, key) {
  if (value == null) return null;
  if (typeof value !== "boolean") throw new TypeError("Invalid " + key);
  return value;
}
function faceResearchAttemptPayload(source) {
  const baseline = object(source.baseline) ? source.baseline : {};
  const quality = object(source.quality) ? source.quality : {};
  const capacity = object(source.capacity) ? source.capacity : {};
  const detection = object(source.detection) ? source.detection : {};
  const runtime = object(source.runtime) ? source.runtime : {};
  const versions = object(source.versions) ? source.versions : {};
  const thresholds = object(source.thresholds) ? source.thresholds : {};
  return {
    testAttemptId: identifier(source.testAttemptId, "testAttemptId"),
    moduleRunId: identifier(source.moduleRunId, "moduleRunId"),
    attemptNo: intInRange(source.attemptNo, 1, 100, "attemptNo"),
    sampleIntervalMs: intInRange(source.sampleIntervalMs, 50, 1000, "sampleIntervalMs"),
    sourceFrameCount: intInRange(source.sourceFrameCount, 0, 1000, "sourceFrameCount"),
    outcome: optionalEnum(source.outcome, FACE_OUTCOMES, "outcome"),
    invalidReasonCode: optionalString(source.invalidReasonCode, 80, "invalidReasonCode"),
    baseline: {
      sampleCount: baseline.sampleCount == null ? null : intInRange(baseline.sampleCount, 0, 1000, "baseline.sampleCount"),
      baseLeft: finiteOrNull(baseline.baseLeft, "baseline.baseLeft"),
      baseRight: finiteOrNull(baseline.baseRight, "baseline.baseRight"),
      baseEyeDistance: finiteOrNull(baseline.baseEyeDistance, "baseline.baseEyeDistance", 0, 10),
      baseLeftMean: finiteOrNull(baseline.baseLeftMean, "baseline.baseLeftMean"),
      baseRightMean: finiteOrNull(baseline.baseRightMean, "baseline.baseRightMean"),
      baseEyeDistanceMean: finiteOrNull(baseline.baseEyeDistanceMean, "baseline.baseEyeDistanceMean", 0, 10),
      baseRawMouthLeftY: finiteOrNull(baseline.baseRawMouthLeftY, "baseline.baseRawMouthLeftY"),
      baseRawMouthRightY: finiteOrNull(baseline.baseRawMouthRightY, "baseline.baseRawMouthRightY"),
      baselineSmileLeft: finiteOrNull(baseline.baselineSmileLeft, "baseline.baselineSmileLeft", 0, 10),
      baselineSmileRight: finiteOrNull(baseline.baselineSmileRight, "baseline.baselineSmileRight", 0, 10),
      baselineSmileLeftMean: finiteOrNull(baseline.baselineSmileLeftMean, "baseline.baselineSmileLeftMean", 0, 10),
      baselineSmileRightMean: finiteOrNull(baseline.baselineSmileRightMean, "baseline.baselineSmileRightMean", 0, 10),
      baseNormalizedMouthLeftX: finiteOrNull(baseline.baseNormalizedMouthLeftX, "baseline.baseNormalizedMouthLeftX"),
      baseNormalizedMouthRightX: finiteOrNull(baseline.baseNormalizedMouthRightX, "baseline.baseNormalizedMouthRightX"),
      baseMouthWidth: finiteOrNull(baseline.baseMouthWidth, "baseline.baseMouthWidth", 0, 10),
      baseMouthWidthMean: finiteOrNull(baseline.baseMouthWidthMean, "baseline.baseMouthWidthMean", 0, 10),
      stability: object(baseline.stability) ? {
        stable: boolOrNull(baseline.stability.stable, "baseline.stability.stable"),
        leftMad: finiteOrNull(baseline.stability.leftMad, "baseline.stability.leftMad", 0, 10),
        rightMad: finiteOrNull(baseline.stability.rightMad, "baseline.stability.rightMad", 0, 10),
        eyeMad: finiteOrNull(baseline.stability.eyeMad, "baseline.stability.eyeMad", 0, 10),
        eyeRelativeMad: finiteOrNull(baseline.stability.eyeRelativeMad, "baseline.stability.eyeRelativeMad", 0, 10),
        validFrameCount: baseline.stability.validFrameCount == null ? null : intInRange(baseline.stability.validFrameCount, 0, 1000, "baseline.stability.validFrameCount"),
        rejectedNeutralFrameCount: baseline.stability.rejectedNeutralFrameCount == null ? null : intInRange(baseline.stability.rejectedNeutralFrameCount, 0, 1000, "baseline.stability.rejectedNeutralFrameCount")
      } : null,
      restAsymMean: finiteOrNull(baseline.restAsymMean, "baseline.restAsymMean", 0, 10),
      restAsymMax: finiteOrNull(baseline.restAsymMax, "baseline.restAsymMax", 0, 10),
      criticalTriggered: boolOrNull(baseline.criticalTriggered, "baseline.criticalTriggered"),
      criticalRestAsym: finiteOrNull(baseline.criticalRestAsym, "baseline.criticalRestAsym", 0, 10)
    },
    quality: {
      faceDetectedRatio: finiteOrNull(quality.faceDetectedRatio, "quality.faceDetectedRatio", 0, 1),
      poseValidRatio: finiteOrNull(quality.poseValidRatio, "quality.poseValidRatio", 0, 1),
      mouthAssessableRatio: finiteOrNull(quality.mouthAssessableRatio, "quality.mouthAssessableRatio", 0, 1),
      handOverlapRatio: finiteOrNull(quality.handOverlapRatio, "quality.handOverlapRatio", 0, 1),
      avgMouthVisibilityScore: finiteOrNull(quality.avgMouthVisibilityScore, "quality.avgMouthVisibilityScore", 0, 10),
      avgEyeDistance: finiteOrNull(quality.avgEyeDistance, "quality.avgEyeDistance", 0, 10),
      minEyeDistanceRatioFromBaseline: finiteOrNull(quality.minEyeDistanceRatioFromBaseline, "quality.minEyeDistanceRatioFromBaseline", 0, 10),
      maxEyeDistanceRatioFromBaseline: finiteOrNull(quality.maxEyeDistanceRatioFromBaseline, "quality.maxEyeDistanceRatioFromBaseline", 0, 10)
    },
    capacity: {
      peakSmileLeft: finiteOrNull(capacity.peakSmileLeft, "capacity.peakSmileLeft", 0, 10),
      peakSmileRight: finiteOrNull(capacity.peakSmileRight, "capacity.peakSmileRight", 0, 10),
      peakNormalizedRiseLeft: finiteOrNull(capacity.peakNormalizedRiseLeft, "capacity.peakNormalizedRiseLeft"),
      peakNormalizedRiseRight: finiteOrNull(capacity.peakNormalizedRiseRight, "capacity.peakNormalizedRiseRight"),
      aggregatedSignedRiseLeft: finiteOrNull(capacity.aggregatedSignedRiseLeft, "capacity.aggregatedSignedRiseLeft"),
      aggregatedSignedRiseRight: finiteOrNull(capacity.aggregatedSignedRiseRight, "capacity.aggregatedSignedRiseRight"),
      effectiveRiseLeft: finiteOrNull(capacity.effectiveRiseLeft, "capacity.effectiveRiseLeft"),
      effectiveRiseRight: finiteOrNull(capacity.effectiveRiseRight, "capacity.effectiveRiseRight")
    },
    detection: {
      startPath: optionalEnum(detection.startPath, new Set(["absolute","relative"]), "detection.startPath"),
      relativeCandidateFrames: detection.relativeCandidateFrames == null ? null : intInRange(detection.relativeCandidateFrames, 0, 1000, "detection.relativeCandidateFrames"),
      relativeValidSmileFrames: detection.relativeValidSmileFrames == null ? null : intInRange(detection.relativeValidSmileFrames, 0, 1000, "detection.relativeValidSmileFrames")
    },
    dynamic: object(source.dynamic) ? {
      method: optionalString(source.dynamic.method, 80, "dynamic.method"),
      pairedFrameCount: source.dynamic.pairedFrameCount == null ? null : intInRange(source.dynamic.pairedFrameCount, 0, 1000, "dynamic.pairedFrameCount"),
      candidateThreshold: finiteOrNull(source.dynamic.candidateThreshold, "dynamic.candidateThreshold", 0, 10),
      geometryMinMagnitude: finiteOrNull(source.dynamic.geometryMinMagnitude, "dynamic.geometryMinMagnitude", 0, 10),
      pairedAsymMedian: finiteOrNull(source.dynamic.pairedAsymMedian, "dynamic.pairedAsymMedian", 0, 10),
      pairedAsymP75: finiteOrNull(source.dynamic.pairedAsymP75, "dynamic.pairedAsymP75", 0, 10),
      pairedAsymP90: finiteOrNull(source.dynamic.pairedAsymP90, "dynamic.pairedAsymP90", 0, 10),
      pairedBlendAsymMedian: finiteOrNull(source.dynamic.pairedBlendAsymMedian, "dynamic.pairedBlendAsymMedian", 0, 10),
      pairedBlendAsymP75: finiteOrNull(source.dynamic.pairedBlendAsymP75, "dynamic.pairedBlendAsymP75", 0, 10),
      pairedBlendAsymP90: finiteOrNull(source.dynamic.pairedBlendAsymP90, "dynamic.pairedBlendAsymP90", 0, 10),
      pairedGeometryAsymMedian: finiteOrNull(source.dynamic.pairedGeometryAsymMedian, "dynamic.pairedGeometryAsymMedian", 0, 10),
      pairedGeometryAsymP75: finiteOrNull(source.dynamic.pairedGeometryAsymP75, "dynamic.pairedGeometryAsymP75", 0, 10),
      pairedGeometryAsymP90: finiteOrNull(source.dynamic.pairedGeometryAsymP90, "dynamic.pairedGeometryAsymP90", 0, 10),
      framesOverCandidateThresholdRatio: finiteOrNull(source.dynamic.framesOverCandidateThresholdRatio, "dynamic.framesOverCandidateThresholdRatio", 0, 1),
      longestContinuousAsymmetryMs: finiteOrNull(source.dynamic.longestContinuousAsymmetryMs, "dynamic.longestContinuousAsymmetryMs", 0, 60000),
      leftOnsetMs: finiteOrNull(source.dynamic.leftOnsetMs, "dynamic.leftOnsetMs", 0, 3600000),
      rightOnsetMs: finiteOrNull(source.dynamic.rightOnsetMs, "dynamic.rightOnsetMs", 0, 3600000),
      onsetDelayMs: finiteOrNull(source.dynamic.onsetDelayMs, "dynamic.onsetDelayMs", -60000, 60000),
      weakSideByPeakBlend: optionalEnum(source.dynamic.weakSideByPeakBlend, new Set(["left","right"]), "dynamic.weakSideByPeakBlend"),
      weakSideLagMs: finiteOrNull(source.dynamic.weakSideLagMs, "dynamic.weakSideLagMs", -60000, 60000),
      leftTimeToPeakMs: finiteOrNull(source.dynamic.leftTimeToPeakMs, "dynamic.leftTimeToPeakMs", 0, 3600000),
      rightTimeToPeakMs: finiteOrNull(source.dynamic.rightTimeToPeakMs, "dynamic.rightTimeToPeakMs", 0, 3600000),
      timeToPeakDifferenceMs: finiteOrNull(source.dynamic.timeToPeakDifferenceMs, "dynamic.timeToPeakDifferenceMs", -60000, 60000)
    } : null,
    runtime: {
      faceDelegate: optionalEnum(runtime.faceDelegate, new Set(["GPU","CPU"]), "runtime.faceDelegate"),
      handDelegate: optionalEnum(runtime.handDelegate, new Set(["GPU","CPU"]), "runtime.handDelegate"),
      handModelAvailable: boolOrNull(runtime.handModelAvailable, "runtime.handModelAvailable"),
      degradedMode: optionalString(runtime.degradedMode, 80, "runtime.degradedMode"),
      faceDetectErrorCount: runtime.faceDetectErrorCount == null ? null : intInRange(runtime.faceDetectErrorCount, 0, 100000, "runtime.faceDetectErrorCount"),
      handDetectErrorCount: runtime.handDetectErrorCount == null ? null : intInRange(runtime.handDetectErrorCount, 0, 100000, "runtime.handDetectErrorCount"),
      qualityFlags: flags(runtime.qualityFlags)
    },
    versions: {
      appVersion: optionalString(versions.appVersion, 100, "versions.appVersion"),
      buildId: optionalString(versions.buildId, 120, "versions.buildId"),
      configVersion: optionalString(versions.configVersion, 100, "versions.configVersion"),
      faceModuleVersion: optionalString(versions.faceModuleVersion, 100, "versions.faceModuleVersion"),
      algorithmVersion: optionalString(versions.algorithmVersion, 100, "versions.algorithmVersion"),
      researchPayloadVersion: optionalString(versions.researchPayloadVersion, 100, "versions.researchPayloadVersion"),
      configHash: optionalString(versions.configHash, 120, "versions.configHash")
    },
    thresholds: {
      weakSideRatioBad: finiteOrNull(thresholds.weakSideRatioBad, "thresholds.weakSideRatioBad", 0, 10),
      weakSideRatioShadow: finiteOrNull(thresholds.weakSideRatioShadow, "thresholds.weakSideRatioShadow", 0, 10),
      smileAsymWarn: finiteOrNull(thresholds.smileAsymWarn, "thresholds.smileAsymWarn", 0, 10),
      smileAsymBad: finiteOrNull(thresholds.smileAsymBad, "thresholds.smileAsymBad", 0, 10),
      restAsymCritical: finiteOrNull(thresholds.restAsymCritical, "thresholds.restAsymCritical", 0, 10),
      smileDetectMin: finiteOrNull(thresholds.smileDetectMin, "thresholds.smileDetectMin", 0, 10),
      smileDetectSide: finiteOrNull(thresholds.smileDetectSide, "thresholds.smileDetectSide", 0, 10),
      smileValidStrength: finiteOrNull(thresholds.smileValidStrength, "thresholds.smileValidStrength", 0, 10),
      smileRealMin: finiteOrNull(thresholds.smileRealMin, "thresholds.smileRealMin", 0, 10),
      closedSmileRiseMin: finiteOrNull(thresholds.closedSmileRiseMin, "thresholds.closedSmileRiseMin", 0, 10),
      closedSmileDeltaSideStart: finiteOrNull(thresholds.closedSmileDeltaSideStart, "thresholds.closedSmileDeltaSideStart", 0, 10),
      closedSmileDeltaSideValid: finiteOrNull(thresholds.closedSmileDeltaSideValid, "thresholds.closedSmileDeltaSideValid", 0, 10),
      closedSmileLateralMin: finiteOrNull(thresholds.closedSmileLateralMin, "thresholds.closedSmileLateralMin", 0, 10),
      closedSmileWidthIncreaseMin: finiteOrNull(thresholds.closedSmileWidthIncreaseMin, "thresholds.closedSmileWidthIncreaseMin", 0, 10),
      closedSmilePersistenceMs: thresholds.closedSmilePersistenceMs == null ? null : intInRange(thresholds.closedSmilePersistenceMs, 0, 10000, "thresholds.closedSmilePersistenceMs"),
      dynamicAsymCandidateThreshold: finiteOrNull(thresholds.dynamicAsymCandidateThreshold, "thresholds.dynamicAsymCandidateThreshold", 0, 10),
      dynamicGeometryMinMagnitude: finiteOrNull(thresholds.dynamicGeometryMinMagnitude, "thresholds.dynamicGeometryMinMagnitude", 0, 10),
      maxAllowedYaw: finiteOrNull(thresholds.maxAllowedYaw, "thresholds.maxAllowedYaw", 0, 90),
      maxAllowedPitch: finiteOrNull(thresholds.maxAllowedPitch, "thresholds.maxAllowedPitch", 0, 90),
      maxAllowedRoll: finiteOrNull(thresholds.maxAllowedRoll, "thresholds.maxAllowedRoll", 0, 90),
      restSafetyMaxYaw: finiteOrNull(thresholds.restSafetyMaxYaw, "thresholds.restSafetyMaxYaw", 0, 90),
      restSafetyMaxPitch: finiteOrNull(thresholds.restSafetyMaxPitch, "thresholds.restSafetyMaxPitch", 0, 90),
      restSafetyMaxRoll: finiteOrNull(thresholds.restSafetyMaxRoll, "thresholds.restSafetyMaxRoll", 0, 90),
      poseBadTripFrames: thresholds.poseBadTripFrames == null ? null : intInRange(thresholds.poseBadTripFrames, 1, 100, "thresholds.poseBadTripFrames"),
      poseGoodResumeFrames: thresholds.poseGoodResumeFrames == null ? null : intInRange(thresholds.poseGoodResumeFrames, 1, 100, "thresholds.poseGoodResumeFrames"),
      minValidSmileFrames: thresholds.minValidSmileFrames == null ? null : intInRange(thresholds.minValidSmileFrames, 0, 1000, "thresholds.minValidSmileFrames"),
      minVisibleMouthFrames: thresholds.minVisibleMouthFrames == null ? null : intInRange(thresholds.minVisibleMouthFrames, 0, 1000, "thresholds.minVisibleMouthFrames"),
      minMouthVisibilityScore: finiteOrNull(thresholds.minMouthVisibilityScore, "thresholds.minMouthVisibilityScore", 0, 10),
      minMouthDarkRatio: finiteOrNull(thresholds.minMouthDarkRatio, "thresholds.minMouthDarkRatio", 0, 10),
      minMouthCentralDarkRatio: finiteOrNull(thresholds.minMouthCentralDarkRatio, "thresholds.minMouthCentralDarkRatio", 0, 10),
      minMouthLineScore: finiteOrNull(thresholds.minMouthLineScore, "thresholds.minMouthLineScore", 0, 10),
      handMouthOverlapMin: finiteOrNull(thresholds.handMouthOverlapMin, "thresholds.handMouthOverlapMin", 0, 1),
      maxWaitForSmileMs: thresholds.maxWaitForSmileMs == null ? null : intInRange(thresholds.maxWaitForSmileMs, 0, 120000, "thresholds.maxWaitForSmileMs"),
      baselineAlignmentTimeoutMs: thresholds.baselineAlignmentTimeoutMs == null ? null : intInRange(thresholds.baselineAlignmentTimeoutMs, 0, 120000, "thresholds.baselineAlignmentTimeoutMs"),
      baselineMinValidFrames: thresholds.baselineMinValidFrames == null ? null : intInRange(thresholds.baselineMinValidFrames, 0, 1000, "thresholds.baselineMinValidFrames"),
      baselineNeutralSmileMax: finiteOrNull(thresholds.baselineNeutralSmileMax, "thresholds.baselineNeutralSmileMax", 0, 10),
      baselineNeutralMouthActivityMax: finiteOrNull(thresholds.baselineNeutralMouthActivityMax, "thresholds.baselineNeutralMouthActivityMax", 0, 10),
      baselineCornerMadMax: finiteOrNull(thresholds.baselineCornerMadMax, "thresholds.baselineCornerMadMax", 0, 10),
      baselineEyeDistanceRelativeMadMax: finiteOrNull(thresholds.baselineEyeDistanceRelativeMadMax, "thresholds.baselineEyeDistanceRelativeMadMax", 0, 10),
      smileLostGraceMs: thresholds.smileLostGraceMs == null ? null : intInRange(thresholds.smileLostGraceMs, 0, 30000, "thresholds.smileLostGraceMs"),
      smileOcclusionResetMs: thresholds.smileOcclusionResetMs == null ? null : intInRange(thresholds.smileOcclusionResetMs, 0, 30000, "thresholds.smileOcclusionResetMs"),
      minValidSmileRatio: finiteOrNull(thresholds.minValidSmileRatio, "thresholds.minValidSmileRatio", 0, 1),
      attemptMouthAssessableRatioMin: finiteOrNull(thresholds.attemptMouthAssessableRatioMin, "thresholds.attemptMouthAssessableRatioMin", 0, 1),
      attemptHandOverlapRatioMin: finiteOrNull(thresholds.attemptHandOverlapRatioMin, "thresholds.attemptHandOverlapRatioMin", 0, 1),
      enforceHandModel: boolOrNull(thresholds.enforceHandModel, "thresholds.enforceHandModel")
    },
    derivedNumericTelemetryOnly: source.derivedNumericTelemetryOnly === true
  };
}
function faceResearchSamplesPayload(source) {
  if (!Array.isArray(source.rows) || source.rows.length < 1 || source.rows.length > 6) throw new TypeError("Invalid face sample rows");
  const rows = source.rows.map((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== FACE_SAMPLE_FIELDS.length) throw new TypeError("Invalid face sample row");
    return row.map((value, columnIndex) => {
      if (value == null) return null;
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 10000000) {
        throw new TypeError("Invalid face sample value " + rowIndex + ":" + columnIndex);
      }
      return value;
    });
  });
  return {
    testAttemptId: identifier(source.testAttemptId, "testAttemptId"),
    moduleRunId: identifier(source.moduleRunId, "moduleRunId"),
    batchNo: intInRange(source.batchNo, 1, 100, "batchNo"),
    totalBatches: intInRange(source.totalBatches, 1, 100, "totalBatches"),
    sampleIntervalMs: intInRange(source.sampleIntervalMs, 50, 1000, "sampleIntervalMs"),
    fields: FACE_SAMPLE_FIELDS,
    rows
  };
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
  if (type === "face_research_attempt") return faceResearchAttemptPayload(source);
  if (type === "face_research_samples") return faceResearchSamplesPayload(source);
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
  if ((type === "module_run_completed" || type === "test_attempt_completed" || type === "face_research_attempt" || type === "face_research_samples") && !module) throw new TypeError("Missing module");
  if ((type === "face_research_attempt" || type === "face_research_samples") && module !== "face") throw new TypeError("Face research events require face module");
  // Explicit allowlist: unknown user-controlled properties are never forwarded to storage.
  const sanitized = {
    client_event_id: source.eventId,
    event_type: type,
    module,
    occurred_at: isoDate(source.occurredAt, "occurredAt"),
    payload: payloadFor(type, source.payload),
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
