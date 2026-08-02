/* QuickStroke clinic-feasibility selection and integrity policy — v1.0.0
 * Pure policy functions only; no Face/Arm/Speech algorithms or thresholds.
 */
(function initQuickStrokeResearchPolicy(global) {
  'use strict';
  if (global.QuickStrokeResearchPolicy) return;

  const VERSION = 'quickstroke-research-policy-1.0.0';
  const SELECTION_POLICY_VERSION = 'quickstroke-selection-policy-1.0.0';
  const INTEGRITY_POLICY_VERSION = 'quickstroke-integrity-policy-1.0.0';
  const MICROPHONE_PRIVACY_VERSION = 'quickstroke-microphone-privacy-1.0.0';
  const MODULES = Object.freeze(['face', 'arm', 'speech']);
  const RETRY_LIMITS = Object.freeze({
    face: Object.freeze({ maxProtocolModuleRuns: 2 }),
    arm: Object.freeze({ maxProtocolModuleRuns: 2 }),
    speech: Object.freeze({ maxProtocolModuleRuns: 2 })
  });
  const ESSENTIAL_TECHNICAL_EVENTS = Object.freeze([
    'PERMISSION_DENIED', 'SENSOR_UNAVAILABLE', 'SENSOR_STALE', 'PAGE_HIDDEN',
    'STORAGE_WRITE_FAILED', 'MODULE_RETRY_REQUESTED', 'SESSION_FINALIZED',
    'UPLOAD_QUEUED', 'UPLOAD_SUCCEEDED', 'UPLOAD_FAILED'
  ]);

  function clone(value) {
    if (value === undefined) return null;
    try { return JSON.parse(JSON.stringify(value)); } catch (error) { return null; }
  }
  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }
  function isCompletedRun(run) {
    return run?.moduleRunStatus === 'completed' && Boolean(run?.completedAt);
  }
  function compareRuns(a, b) {
    const seqA = Number.isFinite(Number(a?.moduleRunSequenceNo)) ? Number(a.moduleRunSequenceNo) : Number.MAX_SAFE_INTEGER;
    const seqB = Number.isFinite(Number(b?.moduleRunSequenceNo)) ? Number(b.moduleRunSequenceNo) : Number.MAX_SAFE_INTEGER;
    if (seqA !== seqB) return seqA - seqB;
    return Date.parse(a?.startedAt || 0) - Date.parse(b?.startedAt || 0);
  }
  function isResearchEligible(run) {
    return run?.analysisRole !== 'engineering_only';
  }
  function inferProtocolPhase(run, session) {
    if (run?.protocolPhase) return run.protocolPhase;
    if (run?.analysisRole === 'engineering_only') return 'engineering_override';
    const sequence = Number(run?.moduleRunSequenceNo || 1);
    const limit = RETRY_LIMITS[run?.module]?.maxProtocolModuleRuns || 1;
    if (sequence <= 1) return 'initial_protocol';
    if (sequence <= limit) return 'protocol_retry';
    return 'post_protocol_repeatability';
  }
  function withinProtocolLimit(run, session) {
    const limit = RETRY_LIMITS[run?.module]?.maxProtocolModuleRuns || 1;
    const phase = inferProtocolPhase(run, session);
    return phase !== 'engineering_override'
      && Number(run?.moduleRunSequenceNo || 1) <= limit;
  }
  function deriveModuleSelection(module, session, allRuns) {
    const runs = (allRuns || [])
      .filter((run) => run?.module === module && isResearchEligible(run))
      .slice()
      .sort(compareRuns);
    const completed = runs.filter(isCompletedRun);
    const initial = runs[0] || null;
    const protocolEligible = completed.filter((run) => withinProtocolLimit(run, session));
    const firstValid = protocolEligible.find((run) => run.validityStatus === 'valid') || null;
    const validRuns = completed.filter((run) => run.validityStatus === 'valid');
    const firstAbnormal = validRuns.find((run) => run.observationStatus === 'abnormal') || null;
    const latest = completed.length ? completed[completed.length - 1] : (runs.length ? runs[runs.length - 1] : null);
    const latestEligible = completed.length ? completed[completed.length - 1] : null;
    return Object.freeze({
      module,
      initialModuleRunId: initial?.moduleRunId || null,
      firstValidModuleRunId: firstValid?.moduleRunId || null,
      latestModuleRunId: latest?.moduleRunId || null,
      firstAbnormalModuleRunId: firstAbnormal?.moduleRunId || null,
      currentResultModuleRunId: latestEligible?.moduleRunId || null,
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      feasibilityAnalysisRunId: initial?.moduleRunId || null,
      clinicalMeasurementRunId: firstValid?.moduleRunId || null,
      repeatabilityValidModuleRunIds: Object.freeze(validRuns.map((run) => run.moduleRunId)),
      safetyAbnormalModuleRunIds: Object.freeze(validRuns
        .filter((run) => run.observationStatus === 'abnormal')
        .map((run) => run.moduleRunId)),
      historicalAbnormalWarning: Boolean(firstAbnormal),
      protocolRetryLimit: RETRY_LIMITS[module].maxProtocolModuleRuns,
      protocolEligibleModuleRunIds: Object.freeze(protocolEligible.map((run) => run.moduleRunId))
    });
  }
  function deriveSelectionSummary(session, moduleRuns = []) {
    const byModule = {};
    MODULES.forEach((module) => { byModule[module] = deriveModuleSelection(module, session, moduleRuns); });
    return Object.freeze({
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      policies: Object.freeze({
        feasibility: 'initial_planned_module_run_including_invalid',
        clinicalMeasurement: 'first_valid_within_protocol_retry_limit',
        repeatability: 'all_valid_module_runs',
        safety: 'any_valid_abnormal_within_session_sticky_until_finalize',
        currentResult: 'latest_completed_eligible_run_with_historical_abnormal_warning',
        prohibited: 'best_result_or_unplanned_latest_as_primary_without_policy'
      }),
      byModule: Object.freeze(byModule)
    });
  }

  function microphoneClassFromLabel(label) {
    const value = String(label || '').toLowerCase();
    if (!value) return 'unknown';
    if (/airpods|bluetooth|buds|wireless/.test(value)) return 'bluetooth_headset';
    if (/usb/.test(value)) return 'usb_microphone';
    if (/headset|headphone|earphone|wired/.test(value)) return 'wired_headset';
    if (/iphone|ipad|built.?in|internal|macbook|microphone array/.test(value)) return 'built_in_microphone';
    return 'external_or_unknown_microphone';
  }
  function inputRouteFromClass(microphoneClass) {
    if (microphoneClass === 'bluetooth_headset') return 'bluetooth';
    if (microphoneClass === 'usb_microphone') return 'usb';
    if (microphoneClass === 'wired_headset') return 'wired';
    if (microphoneClass === 'built_in_microphone') return 'built_in';
    return 'unknown';
  }
  function standardizeMicrophoneRuntime(runtime = {}, options = {}) {
    const settings = runtime?.settings || {};
    const rawLabel = runtime?.label || runtime?.rawLabel || null;
    const microphoneClass = runtime?.microphoneClass || microphoneClassFromLabel(rawLabel);
    const standardized = {
      privacyPolicyVersion: MICROPHONE_PRIVACY_VERSION,
      acquisitionMode: runtime?.acquisitionMode || null,
      microphoneClass,
      inputRoute: runtime?.inputRoute || inputRouteFromClass(microphoneClass),
      sampleRate: Number(settings.sampleRate ?? runtime?.sampleRate) || null,
      channelCount: Number(settings.channelCount ?? runtime?.channelCount) || null,
      echoCancellation: settings.echoCancellation ?? runtime?.echoCancellation ?? null,
      noiseSuppression: settings.noiseSuppression ?? runtime?.noiseSuppression ?? null,
      autoGainControl: settings.autoGainControl ?? runtime?.autoGainControl ?? null,
      readyState: runtime?.readyState || null,
      muted: runtime?.muted ?? null,
      enabled: runtime?.enabled ?? null,
      signalQuality: clone(runtime?.signalQuality || runtime?.qualityMetrics || null),
      calibrationMetrics: clone(runtime?.calibrationMetrics || null)
    };
    if (options.includeRawLabel === true) standardized.rawLabel = rawLabel;
    return standardized;
  }

  function duplicateIds(records, key) {
    const seen = new Set();
    const duplicates = new Set();
    (records || []).forEach((record) => {
      const id = record?.[key];
      if (!id) return;
      if (seen.has(id)) duplicates.add(id);
      else seen.add(id);
    });
    return [...duplicates];
  }
  function collectPrivacyViolations(value, path = '', output = []) {
    if (!value || typeof value !== 'object') return output;
    if (Array.isArray(value)) {
      value.forEach((item, index) => collectPrivacyViolations(item, `${path}[${index}]`, output));
      return output;
    }
    Object.entries(value).forEach(([key, item]) => {
      const nextPath = path ? `${path}.${key}` : key;
      if (/rawAudio/i.test(key) && item === true) output.push(`${nextPath}:RAW_AUDIO_STORED`);
      if (/deviceId|groupId/i.test(key) && item) output.push(`${nextPath}:RAW_DEVICE_IDENTIFIER`);
      if (/label|rawLabel/i.test(key) && item && /microphone|runtime\.microphone/i.test(nextPath)) {
        output.push(`${nextPath}:RAW_MICROPHONE_LABEL`);
      }
      collectPrivacyViolations(item, nextPath, output);
    });
    return output;
  }
  function validateRetryLineage(moduleRuns, attempts) {
    const errors = [];
    const warnings = [];
    const runMap = new Map((moduleRuns || []).map((run) => [run.moduleRunId, run]));
    const attemptMap = new Map((attempts || []).map((attempt) => [attempt.testAttemptId, attempt]));
    (moduleRuns || []).forEach((run) => {
      if (!run.retryOfModuleRunId) return;
      const parent = runMap.get(run.retryOfModuleRunId);
      if (!parent) errors.push(`ORPHAN_MODULE_RETRY_PARENT:${run.moduleRunId}`);
      else if (parent.module !== run.module || parent.screeningSessionId !== run.screeningSessionId) {
        errors.push(`INVALID_MODULE_RETRY_PARENT:${run.moduleRunId}`);
      }
    });
    (attempts || []).forEach((attempt) => {
      if (!attempt.retryOfAttemptId) return;
      const parent = attemptMap.get(attempt.retryOfAttemptId);
      if (!parent) errors.push(`ORPHAN_ATTEMPT_RETRY_PARENT:${attempt.testAttemptId}`);
      else if (parent.moduleRunId !== attempt.moduleRunId || parent.measurementTarget !== attempt.measurementTarget) {
        errors.push(`INVALID_ATTEMPT_RETRY_PARENT:${attempt.testAttemptId}`);
      }
    });
    return { errors, warnings };
  }
  function validateSessionBundle(bundle = {}, options = {}) {
    const session = bundle.screeningSession || bundle.session || null;
    const moduleRuns = bundle.moduleRuns || [];
    const attempts = bundle.testAttempts || bundle.attempts || [];
    const measurements = bundle.moduleMeasurements || bundle.measurements || [];
    const observations = bundle.sensorObservations || bundle.observations || [];
    const events = bundle.technicalEvents || bundle.events || [];
    const projections = bundle.resultProjections || bundle.projections || [];
    const pendingSync = bundle.pendingSync || [];
    const amendments = bundle.sessionAmendments || [];
    const auditEvents = bundle.auditEvents || [];
    const errors = [];
    const warnings = [];

    if (!session) errors.push('SCREENING_SESSION_MISSING');
    const sessionId = session?.screeningSessionId || options.screeningSessionId || null;
    const participantId = session?.participantId || null;
    if (!sessionId) errors.push('SCREENING_SESSION_ID_MISSING');

    const duplicateSummary = {
      moduleRunIds: duplicateIds(moduleRuns, 'moduleRunId'),
      testAttemptIds: duplicateIds(attempts, 'testAttemptId'),
      moduleMeasurementIds: duplicateIds(measurements, 'moduleMeasurementId'),
      sensorObservationIds: duplicateIds(observations, 'observationId'),
      technicalEventIds: duplicateIds(events, 'technicalEventId'),
      projectionIds: duplicateIds(projections, 'projectionId'),
      pendingSyncIds: duplicateIds(pendingSync, 'queueItemId'),
      amendmentIds: duplicateIds(amendments, 'amendmentId'),
      auditEventIds: duplicateIds(auditEvents, 'auditEventId')
    };
    Object.entries(duplicateSummary).forEach(([type, ids]) => {
      if (ids.length) errors.push(`DUPLICATE_${type.toUpperCase()}:${ids.join(',')}`);
    });

    const runMap = new Map(moduleRuns.map((run) => [run.moduleRunId, run]));
    const attemptMap = new Map(attempts.map((attempt) => [attempt.testAttemptId, attempt]));
    const orphanSummary = {
      moduleRuns: [], attempts: [], measurements: [], sensorObservations: [], technicalEvents: [],
      resultProjections: [], pendingSync: [], sessionAmendments: [], auditEvents: []
    };
    moduleRuns.forEach((run) => {
      if (run.screeningSessionId !== sessionId || (participantId && run.participantId !== participantId)) orphanSummary.moduleRuns.push(run.moduleRunId);
    });
    attempts.forEach((attempt) => {
      const parent = runMap.get(attempt.moduleRunId);
      if (!parent || attempt.screeningSessionId !== sessionId) orphanSummary.attempts.push(attempt.testAttemptId);
    });
    measurements.forEach((measurement) => {
      if (!runMap.has(measurement.moduleRunId) || !attemptMap.has(measurement.testAttemptId)
        || measurement.screeningSessionId !== sessionId || (participantId && measurement.participantId !== participantId)) {
        orphanSummary.measurements.push(measurement.moduleMeasurementId);
      }
    });
    observations.forEach((observation, index) => {
      if (!runMap.has(observation.moduleRunId) || (observation.testAttemptId && !attemptMap.has(observation.testAttemptId))
        || observation.screeningSessionId !== sessionId || (participantId && observation.participantId !== participantId)) {
        orphanSummary.sensorObservations.push(observation.observationId || `index-${index}`);
      }
    });
    events.forEach((event) => {
      if ((event.moduleRunId && !runMap.has(event.moduleRunId)) || (event.testAttemptId && !attemptMap.has(event.testAttemptId))
        || event.screeningSessionId !== sessionId || (participantId && event.participantId !== participantId)) {
        orphanSummary.technicalEvents.push(event.technicalEventId);
      }
    });
    projections.forEach((projection) => {
      if (projection.screeningSessionId !== sessionId
        || (projection.selectedModuleRunId && !runMap.has(projection.selectedModuleRunId))
        || (projection.selectedTestAttemptId && !attemptMap.has(projection.selectedTestAttemptId))) {
        orphanSummary.resultProjections.push(projection.projectionId);
      }
    });
    pendingSync.forEach((item) => {
      if (item.screeningSessionId !== sessionId) orphanSummary.pendingSync.push(item.queueItemId);
    });
    amendments.forEach((item) => {
      if (item.screeningSessionId !== sessionId) orphanSummary.sessionAmendments.push(item.amendmentId);
    });
    auditEvents.forEach((item) => {
      if (item.screeningSessionId !== sessionId) orphanSummary.auditEvents.push(item.auditEventId);
    });
    Object.entries(orphanSummary).forEach(([type, ids]) => {
      if (ids.length) errors.push(`ORPHAN_${type.toUpperCase()}:${ids.join(',')}`);
    });

    const attemptCountMismatches = [];
    moduleRuns.forEach((run) => {
      const actual = attempts.filter((attempt) => attempt.moduleRunId === run.moduleRunId).length;
      if (Number(run.attemptCount) !== actual) attemptCountMismatches.push({ moduleRunId: run.moduleRunId, stored: run.attemptCount ?? null, actual });
    });
    if (attemptCountMismatches.length) errors.push('ATTEMPT_COUNT_MISMATCH');

    const completedRunDataIssues = [];
    moduleRuns.filter(isCompletedRun).forEach((run) => {
      const runAttempts = attempts.filter((attempt) => attempt.moduleRunId === run.moduleRunId);
      const runMeasurements = measurements.filter((measurement) => measurement.moduleRunId === run.moduleRunId);
      if (!runAttempts.length) completedRunDataIssues.push({ moduleRunId:run.moduleRunId, code:'COMPLETED_RUN_WITHOUT_ATTEMPT' });
      if (!runMeasurements.length) completedRunDataIssues.push({ moduleRunId:run.moduleRunId, code:'COMPLETED_RUN_WITHOUT_MEASUREMENT' });
      const selectedIds = unique([
        run.selectedTestAttemptId,
        ...Object.values(run.selectedTestAttemptIds || {})
      ]);
      if (run.validityStatus === 'valid' && !selectedIds.length) {
        completedRunDataIssues.push({ moduleRunId:run.moduleRunId, code:'VALID_RUN_SELECTION_MISSING' });
      }
      selectedIds.forEach((selectedId) => {
        const selectedAttempt = runAttempts.find((attempt) => attempt.testAttemptId === selectedId);
        if (!selectedAttempt) {
          completedRunDataIssues.push({ moduleRunId:run.moduleRunId, testAttemptId:selectedId, code:'SELECTED_ATTEMPT_NOT_IN_RUN' });
          return;
        }
        if (selectedAttempt.attemptStatus !== 'completed') {
          completedRunDataIssues.push({ moduleRunId:run.moduleRunId, testAttemptId:selectedId, code:'SELECTED_ATTEMPT_NOT_COMPLETED' });
        }
        if (run.validityStatus === 'valid' && selectedAttempt.validityStatus !== 'valid') {
          completedRunDataIssues.push({ moduleRunId:run.moduleRunId, testAttemptId:selectedId, code:'VALID_RUN_SELECTED_ATTEMPT_NOT_VALID' });
        }
        if (!runMeasurements.some((measurement) => measurement.testAttemptId === selectedId)) {
          completedRunDataIssues.push({ moduleRunId:run.moduleRunId, testAttemptId:selectedId, code:'SELECTED_ATTEMPT_MEASUREMENT_MISSING' });
        }
      });
    });
    if (completedRunDataIssues.length) errors.push('COMPLETED_RUN_DATA_INCOMPLETE');

    const lineage = validateRetryLineage(moduleRuns, attempts);
    errors.push(...lineage.errors);
    warnings.push(...lineage.warnings);

    const completedModules = unique(moduleRuns.filter(isCompletedRun).map((run) => run.module));
    const protocolComplete = MODULES.every((module) => completedModules.includes(module));
    const firstCompletedRunByModule = {};
    MODULES.forEach((module) => {
      firstCompletedRunByModule[module] = moduleRuns
        .filter((run) => run?.module === module && isCompletedRun(run))
        .slice()
        .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))[0] || null;
    });
    const expectedProtocolCompletedAt = protocolComplete
      ? new Date(Math.max(...MODULES.map((module) => Date.parse(firstCompletedRunByModule[module].completedAt)))).toISOString()
      : null;
    if (session?.sessionStatus === 'protocol_completed' && !protocolComplete) errors.push('PROTOCOL_STATUS_WITHOUT_ALL_MODULES');
    if (protocolComplete && !session?.protocolCompletedAt) errors.push('PROTOCOL_COMPLETED_AT_MISSING');
    if (protocolComplete && session?.sessionStatus === 'active') errors.push('SESSION_ACTIVE_AFTER_PROTOCOL_COMPLETION');
    if (expectedProtocolCompletedAt && session?.protocolCompletedAt
      && Date.parse(session.protocolCompletedAt) !== Date.parse(expectedProtocolCompletedAt)) {
      errors.push('PROTOCOL_COMPLETED_AT_MISMATCH');
    }
    if (session?.sessionStatus === 'finalized' && !session?.finalizedAt) errors.push('FINALIZED_AT_MISSING');
    if (session?.sessionStatus === 'active' && session?.protocolCompletedAt) errors.push('ACTIVE_STATUS_AFTER_PROTOCOL_COMPLETION');

    const openModuleRuns = moduleRuns.filter((run) => run.moduleRunStatus === 'in_progress').map((run) => run.moduleRunId);
    const openAttempts = attempts.filter((attempt) => attempt.attemptStatus === 'in_progress').map((attempt) => attempt.testAttemptId);
    if (openModuleRuns.length) errors.push(`OPEN_MODULE_RUNS:${openModuleRuns.join(',')}`);
    if (openAttempts.length) errors.push(`OPEN_ATTEMPTS:${openAttempts.join(',')}`);

    const appMode = session?.appMode || 'public';
    const expectedRole = appMode === 'dev' ? 'engineering_only' : appMode === 'research' ? 'research_candidate' : 'public_ephemeral';
    const roleMismatches = [...moduleRuns, ...attempts, ...measurements, ...observations, ...events, ...projections, ...pendingSync, ...amendments, ...auditEvents]
      .filter((record) => record.analysisRole && record.analysisRole !== expectedRole)
      .map((record) => record.moduleRunId || record.testAttemptId || record.moduleMeasurementId || record.technicalEventId);
    if (roleMismatches.length) errors.push(`ANALYSIS_ROLE_MISMATCH:${roleMismatches.join(',')}`);
    if (appMode === 'dev' && expectedRole !== 'engineering_only') errors.push('DEV_ANALYSIS_ROLE_INVALID');

    if (appMode === 'research') {
      const metadata = session?.researchMetadata || null;
      const appModeApi = global.QuickStrokeAppMode;
      const validation = appModeApi?.validateResearchMetadata
        ? appModeApi.validateResearchMetadata(metadata, { requireConsented: true })
        : { valid: Boolean(metadata?.studyId), errors: metadata?.studyId ? [] : ['STUDY_ID_REQUIRED'], warnings: [] };
      if (!validation.valid) errors.push(...validation.errors.map((code) => `RESEARCH_METADATA:${code}`));
      warnings.push(...(validation.warnings || []).map((code) => `RESEARCH_METADATA:${code}`));
      const privacyViolations = unique(collectPrivacyViolations({ measurements, observations, events, projections, pendingSync }));
      if (privacyViolations.length) errors.push(...privacyViolations.map((item) => `MICROPHONE_PRIVACY_VIOLATION:${item}`));
    }

    if (session?.researchProfile === 'community_remote_qr' || session?.researchMetadata?.researchProfile === 'community_remote_qr') {
      errors.push('COMMUNITY_REMOTE_QR_DATA_COLLECTION_DISABLED');
    }

    const selectionSummary = deriveSelectionSummary(session, moduleRuns);
    const selectionPointerMismatches = [];
    const storedSelection = session?.moduleSelection || null;
    if (protocolComplete && !storedSelection) {
      errors.push('SESSION_SELECTION_POINTERS_MISSING');
    } else if (storedSelection) {
      const pointerFields = [
        'initialModuleRunId','firstValidModuleRunId','latestModuleRunId',
        'firstAbnormalModuleRunId','currentResultModuleRunId','selectionPolicyVersion'
      ];
      MODULES.forEach((module) => {
        const stored = storedSelection[module] || {};
        const expected = selectionSummary.byModule[module] || {};
        pointerFields.forEach((field) => {
          if ((stored[field] ?? null) !== (expected[field] ?? null)) {
            selectionPointerMismatches.push({ module, field, stored:stored[field] ?? null, expected:expected[field] ?? null });
          }
        });
      });
      if (selectionPointerMismatches.length) errors.push('SESSION_SELECTION_POINTER_MISMATCH');
    }
    if (session?.selectionPolicyVersion && session.selectionPolicyVersion !== SELECTION_POLICY_VERSION) {
      errors.push('SESSION_SELECTION_POLICY_VERSION_MISMATCH');
    }
    const requireProtocol = options.requireProtocolComplete !== false;
    if (requireProtocol && !protocolComplete) errors.push('PROTOCOL_NOT_COMPLETED');
    const requireResearch = options.requireResearch === true;
    if (requireResearch && appMode !== 'research') errors.push('NOT_A_RESEARCH_SESSION');
    if (session?.sessionStatus === 'finalized' && options.allowAlreadyFinalized !== true) errors.push('SESSION_ALREADY_FINALIZED');

    return Object.freeze({
      integrityPolicyVersion: INTEGRITY_POLICY_VERSION,
      checkedAt: new Date().toISOString(),
      canFinalize: errors.length === 0,
      errors: Object.freeze(unique(errors)),
      warnings: Object.freeze(unique(warnings)),
      counts: Object.freeze({
        moduleRuns: moduleRuns.length,
        testAttempts: attempts.length,
        moduleMeasurements: measurements.length,
        sensorObservations: observations.length,
        technicalEvents: events.length,
        resultProjections: projections.length,
        pendingSync: pendingSync.length,
        sessionAmendments: amendments.length,
        auditEvents: auditEvents.length
      }),
      protocol: Object.freeze({
        completedModules: Object.freeze(completedModules),
        protocolComplete,
        expectedProtocolCompletedAt,
        storedProtocolCompletedAt: session?.protocolCompletedAt || null,
        firstCompletedModuleRunIds: Object.freeze(Object.fromEntries(
          MODULES.map((module) => [module, firstCompletedRunByModule[module]?.moduleRunId || null])
        ))
      }),
      duplicateSummary: Object.freeze(duplicateSummary),
      orphanSummary: Object.freeze(orphanSummary),
      attemptCountMismatches: Object.freeze(attemptCountMismatches),
      completedRunDataIssues: Object.freeze(completedRunDataIssues),
      selectionPointerMismatches: Object.freeze(selectionPointerMismatches),
      openRecords: Object.freeze({ moduleRunIds: Object.freeze(openModuleRuns), testAttemptIds: Object.freeze(openAttempts) }),
      selectionSummary
    });
  }

  function sanitizeResearchExport(bundle = {}) {
    const copy = clone(bundle) || {};
    let redactionCount = 0;
    function visit(value, path = '') {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((item, index) => visit(item, `${path}[${index}]`)); return; }
      Object.keys(value).forEach((key) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (/deviceId|groupId/i.test(key)) { delete value[key]; redactionCount += 1; return; }
        if (/label|rawLabel/i.test(key) && /microphone|runtime\.microphone/i.test(nextPath)) { delete value[key]; redactionCount += 1; return; }
        visit(value[key], nextPath);
      });
    }
    visit(copy);
    copy.privacySummary = {
      microphonePrivacyPolicyVersion: MICROPHONE_PRIVACY_VERSION,
      rawMicrophoneLabelIncluded: false,
      rawDeviceIdentifiersIncluded: false,
      redactionCount
    };
    return copy;
  }

  const api = Object.freeze({
    version: VERSION,
    selectionPolicyVersion: SELECTION_POLICY_VERSION,
    integrityPolicyVersion: INTEGRITY_POLICY_VERSION,
    microphonePrivacyVersion: MICROPHONE_PRIVACY_VERSION,
    modules: MODULES,
    retryLimits: RETRY_LIMITS,
    essentialTechnicalEvents: ESSENTIAL_TECHNICAL_EVENTS,
    inferProtocolPhase,
    withinProtocolLimit,
    deriveModuleSelection,
    deriveSelectionSummary,
    standardizeMicrophoneRuntime,
    validateSessionBundle,
    sanitizeResearchExport
  });
  Object.defineProperty(global, 'QuickStrokeResearchPolicy', { value: api, enumerable: true, configurable: false, writable: false });
})(typeof window !== 'undefined' ? window : globalThis);
