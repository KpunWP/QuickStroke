/* QuickStroke shared data contract — v0.2.0
 *
 * Purpose:
 * - canonical identifiers and session context
 * - shared enums and version snapshots
 * - deterministic configuration hashing
 * - coarse runtime metadata
 * - common record validation
 *
 * This file does NOT change Face, Arm, Speech, or Result thresholds/algorithms.
 * Load after config.js and before page-specific application code.
 */
(function initQuickStrokeDataContract(global) {
  'use strict';

  if (global.QuickStrokeDataContract) return;

  const CONTRACT_VERSION = 'quickstroke-common-data-0.2.0';
  const MANIFEST_VERSION = 'quickstroke-baseline-manifest-0.2.0';
  const TECHNICAL_CODE_REGISTRY_VERSION = 'quickstroke-technical-codes-0.1.0';
  const TECHNICAL_EVENT_SCHEMA_VERSION = 'technical-event-0.1.0';
  const LOCAL_STORAGE_SCHEMA_VERSION = 'quickstroke-local-store-0.2.0';
  const RESULT_POLICY_VERSION = 'result-policy-1.1.0';
  const RESULT_DIAGNOSTICS_VERSION = 'result-dev-diagnostics-1.3.0';
  const RESULT_PROJECTION_SCHEMA_VERSION = 'quickstroke-result-projection-0.2.0';
  const SELECTION_POLICY_VERSION = 'quickstroke-selection-policy-1.0.0';
  const APP_MODE_VERSION = 'quickstroke-app-mode-1.0.0';

  const MODULES = Object.freeze(['face', 'arm', 'speech']);
  const MEASUREMENT_TARGETS = Object.freeze([
    'face',
    'left_arm',
    'right_arm',
    'speech'
  ]);

  const SESSION_STATUS = Object.freeze([
    'active',
    'protocol_completed',
    'finalized'
  ]);

  const MODULE_RUN_STATUS = Object.freeze([
    'in_progress',
    'completed',
    'aborted',
    'interrupted'
  ]);

  const ATTEMPT_STATUS = Object.freeze([
    'in_progress',
    'completed',
    'aborted',
    'interrupted'
  ]);

  const VALIDITY_STATUS = Object.freeze([
    'valid',
    'invalid',
    'not_evaluable'
  ]);

  const TECHNICAL_VALIDITY = Object.freeze([
    'full',
    'degraded',
    'failed',
    'not_assessed'
  ]);

  const OBSERVATION_STATUS = Object.freeze([
    'no_alert',
    'attention',
    'abnormal',
    'indeterminate',
    'not_available'
  ]);

  const QUALITY_STATUS = Object.freeze([
    'acceptable',
    'limited',
    'unusable',
    'not_assessed'
  ]);

  const ATTEMPT_TRIGGER = Object.freeze([
    'initial_attempt',
    'automatic_retry',
    'technical_recovery',
    'resume_after_interruption'
  ]);

  const MODULE_RUN_TRIGGER = Object.freeze([
    'full_flow',
    'individual_start',
    'result_retry',
    'continue_incomplete',
    'direct_navigation',
    'resume_existing_session'
  ]);

  const ID_PREFIX = Object.freeze({
    participant: 'P',
    screeningSession: 'S',
    moduleRun: 'MR',
    testAttempt: 'TA',
    moduleMeasurement: 'MM',
    technicalEvent: 'TE'
  });

  const SESSION_KEYS = Object.freeze({
    participantId: 'fast_participant_id',
    screeningSessionId: 'fast_screening_session_id',
    legacyCompatibilitySessionId: 'fast_assessment_id',
    legacyAssessmentId: 'fast_legacy_assessment_id',
    screeningStartedAt: 'fast_started_at',
    protocolCompletedAt: 'fast_protocol_completed_at',
    screeningCompletedAt: 'fast_protocol_completed_at',
    finalizedAt: 'fast_finalized_at',
    sessionStatus: 'fast_session_status',
    sessionCompletionReason: 'fast_session_completion_reason',
    finalizationMetadata: 'fast_session_finalization_metadata',
    sessionSchemaVersion: 'fast_session_schema_version',
    manifestVersion: 'fast_baseline_manifest_version',
    sessionMode: 'fast_mode',
    appMode: 'fast_session_app_mode',
    analysisRole: 'fast_session_analysis_role',
    researchMetadata: 'fast_session_research_metadata',
    resultSource: 'fast_result_source',
    pendingModuleRetry: 'fast_pending_module_retry'
  });

  const MODULE_VERSION_FALLBACKS = Object.freeze({
    face: Object.freeze({
      moduleVersion: 'face-prepilot-1.4.0',
      algorithmVersion: 'face-asymmetry-1.2.0',
      resultSchemaVersion: 'face-result-1.3.0',
      researchPayloadVersion: 'face-research-0.3.0',
      measurementDictionaryVersion: 'face-measurement-0.1.0'
    }),
    arm: Object.freeze({
      moduleVersion: 'arm-prepilot-1.1.0',
      algorithmVersion: 'arm-drift-1.0.0',
      readinessVersion: 'arm-readiness-1.1.0',
      resultSchemaVersion: 'arm-result-1.0.1',
      researchPayloadVersion: 'arm-research-1.0.1',
      measurementDictionaryVersion: 'arm-measurement-0.1.0',
      sensorCapturePolicyVersion: 'arm-sensor-capture-1.0.0'
    }),
    speech: Object.freeze({
      moduleVersion: 'speech-prepilot-1.8.0',
      algorithmVersion: 'speech-browser-asr-1.4.0',
      resultSchemaVersion: 'speech-result-1.4.1',
      researchPayloadVersion: 'speech-research-0.5.1',
      measurementDictionaryVersion: 'speech-measurement-0.1.0'
    })
  });

  function nowIso() {
    return new Date().toISOString();
  }

  function isPlainObject(value) {
    if (!value || typeof value !== 'object') return false;
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function stableStringify(value) {
    if (value === undefined) return 'null';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  function fnv1aHash(text) {
    let hash = 0x811c9dc5;
    const input = String(text ?? '');
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function hashObject(value) {
    return `fnv1a-${fnv1aHash(stableStringify(value))}`;
  }

  function createRandomToken() {
    try {
      if (global.crypto?.randomUUID) return global.crypto.randomUUID();
      if (global.crypto?.getRandomValues) {
        const bytes = new Uint8Array(16);
        global.crypto.getRandomValues(bytes);
        return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
      }
    } catch (error) {
      console.warn('[QuickStrokeDataContract] Cryptographic ID unavailable.', error);
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function createId(kind) {
    const prefix = ID_PREFIX[kind];
    if (!prefix) throw new TypeError(`Unknown QuickStroke ID kind: ${String(kind)}`);
    return `${prefix}-${createRandomToken()}`;
  }

  function storageAvailable(storage) {
    if (!storage) return false;
    const key = `__qs_storage_probe_${Date.now()}__`;
    try {
      storage.setItem(key, '1');
      storage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function sessionStore() {
    try {
      return storageAvailable(global.sessionStorage) ? global.sessionStorage : null;
    } catch (error) {
      return null;
    }
  }

  function safeParseJson(value) {
    try { return JSON.parse(value); } catch (error) { return null; }
  }

  function getSessionContext() {
    const store = sessionStore();
    if (!store) {
      return Object.freeze({
        participantId: null, screeningSessionId: null, legacyAssessmentId: null,
        screeningSessionStartedAt: null, protocolCompletedAt: null,
        screeningSessionCompletedAt: null, finalizedAt: null,
        sessionStatus: null, sessionMode: null, appMode: 'public',
        analysisRole: 'public_ephemeral', researchMetadata: null,
        identificationMode: 'unidentified'
      });
    }
    const participantId = store.getItem(SESSION_KEYS.participantId);
    const canonicalSessionId = store.getItem(SESSION_KEYS.screeningSessionId);
    const compatibilitySessionId = store.getItem(SESSION_KEYS.legacyCompatibilitySessionId);
    const screeningSessionId = canonicalSessionId || compatibilitySessionId;
    const legacyAssessmentId = store.getItem(SESSION_KEYS.legacyAssessmentId)
      || (screeningSessionId?.startsWith('A-') ? screeningSessionId : null);
    const appModeApi = global.QuickStrokeAppMode || null;
    const appMode = store.getItem(SESSION_KEYS.appMode) || appModeApi?.resolveMode?.() || 'public';
    const analysisRole = store.getItem(SESSION_KEYS.analysisRole) || appModeApi?.getAnalysisRole?.(appMode)
      || (appMode === 'dev' ? 'engineering_only' : appMode === 'research' ? 'research_candidate' : 'public_ephemeral');
    const protocolCompletedAt = store.getItem(SESSION_KEYS.protocolCompletedAt);
    return Object.freeze({
      participantId,
      screeningSessionId,
      legacyAssessmentId,
      screeningSessionStartedAt: store.getItem(SESSION_KEYS.screeningStartedAt),
      protocolCompletedAt,
      screeningSessionCompletedAt: protocolCompletedAt,
      finalizedAt: store.getItem(SESSION_KEYS.finalizedAt),
      sessionStatus: store.getItem(SESSION_KEYS.sessionStatus),
      sessionMode: store.getItem(SESSION_KEYS.sessionMode),
      appMode,
      analysisRole,
      researchMetadata: safeParseJson(store.getItem(SESSION_KEYS.researchMetadata)),
      finalizationMetadata: safeParseJson(store.getItem(SESSION_KEYS.finalizationMetadata)),
      identificationMode: !participantId || !screeningSessionId
        ? 'unidentified'
        : screeningSessionId.startsWith('A-')
          ? 'legacy_browser_session'
          : 'canonical_browser_session'
    });
  }

  function resetScopedSequences(store) {
    if (!store) return;
    const keys = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key && (
        key.startsWith('fast_module_run_sequence_')
        || key.startsWith('fast_attempt_sequence_')
        || key.startsWith('fast_target_attempt_sequence_')
        || key.startsWith('fast_current_module_run_')
      )) {
        keys.push(key);
      }
    }
    keys.forEach((key) => store.removeItem(key));
  }

  function clearMutableProjections(store) {
    if (!store) return;
    [
      'fast_face', 'fast_arm', 'fast_speech',
      SESSION_KEYS.sessionMode, SESSION_KEYS.resultSource,
      SESSION_KEYS.protocolCompletedAt, SESSION_KEYS.finalizedAt,
      SESSION_KEYS.sessionCompletionReason, SESSION_KEYS.finalizationMetadata,
      SESSION_KEYS.pendingModuleRetry
    ].forEach((key) => store.removeItem(key));
  }

  function ensureScreeningContext(options = {}) {
    const { forceNewParticipant = false, forceNewSession = false, mode = null } = options;
    const store = sessionStore();
    if (!store) throw new Error('QuickStroke requires sessionStorage for the current screening context.');
    const appModeApi = global.QuickStrokeAppMode || null;
    let participantId = store.getItem(SESSION_KEYS.participantId);
    let screeningSessionId = store.getItem(SESSION_KEYS.screeningSessionId);
    let compatibilitySessionId = store.getItem(SESSION_KEYS.legacyCompatibilitySessionId);
    if (forceNewParticipant || !participantId) {
      participantId = createId('participant');
      store.setItem(SESSION_KEYS.participantId, participantId);
    }
    const mustCreateSession = forceNewParticipant || forceNewSession || (!screeningSessionId && !compatibilitySessionId);
    if (mustCreateSession) {
      screeningSessionId = createId('screeningSession');
      compatibilitySessionId = screeningSessionId;
      store.removeItem(SESSION_KEYS.legacyAssessmentId);
      clearMutableProjections(store);
      resetScopedSequences(store);
      appModeApi?.clearSessionSnapshot?.();
      if (mode && ['public','research','dev'].includes(mode)) appModeApi?.setMode?.(mode, { source:'data_contract_new_session' });
      appModeApi?.applySessionSnapshot?.({ force:true, source:'data_contract_new_session' });
      store.setItem(SESSION_KEYS.screeningStartedAt, nowIso());
      store.setItem(SESSION_KEYS.sessionStatus, 'active');
    } else if (!screeningSessionId && compatibilitySessionId) {
      screeningSessionId = compatibilitySessionId;
      if (compatibilitySessionId.startsWith('A-')) store.setItem(SESSION_KEYS.legacyAssessmentId, compatibilitySessionId);
      if (!store.getItem(SESSION_KEYS.appMode)) appModeApi?.applySessionSnapshot?.({ force:true, source:'legacy_session_upgrade' });
    }
    store.setItem(SESSION_KEYS.screeningSessionId, screeningSessionId);
    store.setItem(SESSION_KEYS.legacyCompatibilitySessionId, screeningSessionId);
    store.setItem(SESSION_KEYS.sessionSchemaVersion, CONTRACT_VERSION);
    store.setItem(SESSION_KEYS.manifestVersion, MANIFEST_VERSION);
    if (mode && ['full','individual'].includes(mode)) store.setItem(SESSION_KEYS.sessionMode, mode);
    return getSessionContext();
  }

  function createScreeningSessionRecord(options = {}) {
    const { context = ensureScreeningContext(), sessionMode = null, createdAt = null, completionReasonCode = null } = options;
    if (!context?.participantId || !context?.screeningSessionId) throw new TypeError('A valid screening context is required.');
    const startedAt = context.screeningSessionStartedAt || nowIso();
    const status = SESSION_STATUS.includes(context.sessionStatus) ? context.sessionStatus : 'active';
    const metadata = context.researchMetadata || null;
    const record = {
      schemaVersion: CONTRACT_VERSION,
      recordType: 'screening_session',
      participantId: context.participantId,
      screeningSessionId: context.screeningSessionId,
      legacyAssessmentId: context.legacyAssessmentId || null,
      identificationMode: context.identificationMode || null,
      sessionStatus: status,
      sessionMode: sessionMode || context.sessionMode || 'undetermined',
      appMode: context.appMode || 'public',
      analysisRole: context.analysisRole || 'public_ephemeral',
      researchProfile: metadata?.researchProfile || null,
      researchMetadata: metadata,
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      startedAt,
      protocolCompletedAt: context.protocolCompletedAt || null,
      completedAt: context.protocolCompletedAt || null,
      finalizedAt: context.finalizedAt || null,
      completionReasonCode: completionReasonCode || context.finalizationMetadata?.reasonCode || null,
      finalizationMetadata: context.finalizationMetadata || null,
      uploadState: context.appMode === 'research' ? 'not_configured' : 'not_applicable',
      exportState: context.appMode === 'research' ? 'not_exported' : 'not_applicable',
      createdAt: createdAt || startedAt,
      versionSnapshot: createVersionSnapshot(),
      runtimeSnapshot: getCoarseRuntimeSnapshot()
    };
    const validation = validateCommonRecord(record);
    if (!validation.valid) throw new Error(`Invalid screening session record: ${validation.errors.join('; ')}`);
    return Object.freeze(record);
  }

  function markProtocolCompleted(completedAt = nowIso(), reasonCode = 'FULL_PROTOCOL_FIRST_COMPLETION') {
    const store = sessionStore();
    if (!store) return getSessionContext();
    const current = getSessionContext();
    if (current.sessionStatus === 'finalized') return current;
    const firstCompletedAt = current.protocolCompletedAt || completedAt;
    store.setItem(SESSION_KEYS.protocolCompletedAt, firstCompletedAt);
    store.setItem(SESSION_KEYS.sessionStatus, 'protocol_completed');
    if (reasonCode) store.setItem(SESSION_KEYS.sessionCompletionReason, String(reasonCode));
    return getSessionContext();
  }

  function finalizeScreeningSession(options = {}) {
    const store = sessionStore();
    if (!store) return getSessionContext();
    const current = getSessionContext();
    if (current.sessionStatus === 'finalized') return current;
    const finalizedAt = options.finalizedAt || nowIso();
    const metadata = {
      finalizationType: options.finalizationType || 'research_operator_finalize',
      reasonCode: options.reasonCode || 'SESSION_FINALIZED',
      finalizedByRole: options.finalizedByRole || current.researchMetadata?.operatorRole || null,
      finalizedByOperatorId: options.finalizedByOperatorId || current.researchMetadata?.operatorId || null,
      integrityPolicyVersion: options.integrityPolicyVersion || null,
      integrityReportHash: options.integrityReportHash || null,
      amendmentRequiredForChanges: true
    };
    store.setItem(SESSION_KEYS.sessionStatus, 'finalized');
    store.setItem(SESSION_KEYS.finalizedAt, finalizedAt);
    store.setItem(SESSION_KEYS.sessionCompletionReason, metadata.reasonCode);
    store.setItem(SESSION_KEYS.finalizationMetadata, JSON.stringify(metadata));
    return getSessionContext();
  }

  function completeScreeningSession(completionReason = 'FULL_PROTOCOL_FIRST_COMPLETION') {
    return markProtocolCompleted(nowIso(), completionReason);
  }

  function closeScreeningSession(statusOrReason, reasonCode = null) {
    const legacyStatus = String(statusOrReason || '');
    const resolvedReason = reasonCode || (legacyStatus && !SESSION_STATUS.includes(legacyStatus) ? legacyStatus : `LEGACY_CLOSE_${legacyStatus || 'UNKNOWN'}`);
    return finalizeScreeningSession({ finalizationType:'administrative_close', reasonCode:resolvedReason });
  }

  function nextScopedSequence(scopeKey) {
    const store = sessionStore();
    if (!store) return null;
    const current = Number.parseInt(store.getItem(scopeKey) || '0', 10);
    const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    store.setItem(scopeKey, String(next));
    return next;
  }

  function currentModuleRunKey(module) {
    return `fast_current_module_run_${module}`;
  }

  function createModuleRun(options = {}) {
    const {
      module,
      trigger = 'full_flow',
      targetOrder = null,
      retryOfModuleRunId = null,
      runContextMode = null,
      localeUsed = null,
      startedAt = nowIso()
    } = options;

    if (!MODULES.includes(module)) throw new TypeError(`Invalid module: ${String(module)}`);
    if (!MODULE_RUN_TRIGGER.includes(trigger)) {
      throw new TypeError(`Invalid module-run trigger: ${String(trigger)}`);
    }

    const context = ensureScreeningContext();
    if (context.sessionStatus === 'finalized') throw new Error('Cannot create a module run in a finalized session.');
    const moduleRunId = createId('moduleRun');
    const moduleRunSequenceNo = nextScopedSequence(
      `fast_module_run_sequence_${context.screeningSessionId}_${module}`
    );
    const store = sessionStore();
    store?.setItem(currentModuleRunKey(module), moduleRunId);

    return Object.freeze({
      schemaVersion: CONTRACT_VERSION,
      commonDataModelVersion: CONTRACT_VERSION,
      moduleRunSchemaVersion: 'module-run-0.1.0',
      recordType: 'module_run',
      participantId: context.participantId,
      screeningSessionId: context.screeningSessionId,
      legacyAssessmentId: context.legacyAssessmentId,
      moduleRunId,
      moduleRunSequenceNo,
      module,
      moduleRunTrigger: trigger,
      retryOfModuleRunId: retryOfModuleRunId || null,
      runContextMode: runContextMode || (context.sessionMode === 'full' ? 'full_flow' : 'individual_flow'),
      localeUsed: localeUsed || null,
      moduleRunStatus: 'in_progress',
      appMode: context.appMode,
      analysisRole: context.analysisRole,
      researchProfile: context.researchMetadata?.researchProfile || null,
      protocolPhase: context.appMode === 'dev'
        ? 'engineering_override'
        : moduleRunSequenceNo === 1
          ? 'initial_protocol'
          : moduleRunSequenceNo <= Number(global.QS_CONFIG?.research?.retryLimits?.[module]?.maxProtocolModuleRuns || 2)
            ? 'protocol_retry'
            : 'post_protocol_repeatability',
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      targetOrder: Array.isArray(targetOrder) ? [...targetOrder] : null,
      attemptCount: 0,
      startedAt,
      completedAt: null,
      createdAt: startedAt,
      updatedAt: startedAt,
      versionSnapshot: createVersionSnapshot(module)
    });
  }

  function getCurrentModuleRunId(module) {
    if (!MODULES.includes(module)) return null;
    return sessionStore()?.getItem(currentModuleRunKey(module)) || null;
  }

  function getPendingModuleRetry(module) {
    if (!MODULES.includes(module)) return null;
    const store = sessionStore();
    if (!store) return null;
    try {
      const parsed = JSON.parse(store.getItem(SESSION_KEYS.pendingModuleRetry) || 'null');
      if (!parsed || parsed.module !== module) return null;
      if (typeof parsed.previousModuleRunId !== 'string' || !parsed.previousModuleRunId.trim()) return null;
      return Object.freeze({
        module,
        previousModuleRunId: parsed.previousModuleRunId,
        requestedAt: typeof parsed.requestedAt === 'string' ? parsed.requestedAt : null
      });
    } catch (error) {
      console.warn('[QuickStrokeDataContract] Invalid pending module retry marker.', error);
      return null;
    }
  }

  // Resolve the immediate parent for a repeated module run. The synchronously
  // stored current-module-run ID is preferred over the Result marker because
  // IndexedDB projection writes may still be settling when the user taps retry
  // again. This prevents later retries from repeatedly pointing to an older run.
  function resolveRetryParentModuleRunId(module, preferredModuleRunId = null) {
    if (!MODULES.includes(module)) return null;
    const candidates = [
      getCurrentModuleRunId(module),
      preferredModuleRunId,
      getPendingModuleRetry(module)?.previousModuleRunId
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    }
    return null;
  }

  function createTestAttempt(options = {}) {
    const {
      moduleRunId,
      module,
      measurementTarget,
      trigger = 'initial_attempt',
      retryOfAttemptId = null,
      triggerReasonCode = null,
      startedAt = nowIso()
    } = options;

    if (!moduleRunId || typeof moduleRunId !== 'string') {
      throw new TypeError('moduleRunId is required to create a test attempt.');
    }
    if (!MODULES.includes(module)) throw new TypeError(`Invalid module: ${String(module)}`);
    if (!MEASUREMENT_TARGETS.includes(measurementTarget)) {
      throw new TypeError(`Invalid measurement target: ${String(measurementTarget)}`);
    }
    if (!ATTEMPT_TRIGGER.includes(trigger)) {
      throw new TypeError(`Invalid attempt trigger: ${String(trigger)}`);
    }
    if (trigger !== 'initial_attempt' && !retryOfAttemptId) {
      throw new TypeError(`${trigger} requires retryOfAttemptId.`);
    }

    const context = ensureScreeningContext();
    const testAttemptId = createId('testAttempt');
    const attemptSequenceNo = nextScopedSequence(`fast_attempt_sequence_${moduleRunId}`);
    const targetAttemptSequenceNo = nextScopedSequence(
      `fast_target_attempt_sequence_${moduleRunId}_${measurementTarget}`
    );

    return Object.freeze({
      schemaVersion: CONTRACT_VERSION,
      recordType: 'test_attempt',
      appMode: context.appMode,
      analysisRole: context.analysisRole,
      researchProfile: context.researchMetadata?.researchProfile || null,
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      participantId: context.participantId,
      screeningSessionId: context.screeningSessionId,
      legacyAssessmentId: context.legacyAssessmentId,
      moduleRunId,
      testAttemptId,
      attemptSequenceNo,
      targetAttemptSequenceNo,
      module,
      measurementTarget,
      attemptTrigger: trigger,
      retryOfAttemptId,
      triggerReasonCode,
      attemptStatus: 'in_progress',
      validityStatus: null,
      technicalValidity: 'not_assessed',
      observationStatus: 'not_available',
      qualityStatus: 'not_assessed',
      qualityFlags: Object.freeze([]),
      invalidReasonCode: null,
      startedAt,
      completedAt: null,
      versionSnapshot: createVersionSnapshot(module)
    });
  }

  function createModuleMeasurement(options = {}) {
    const {
      moduleRunId,
      testAttemptId,
      module,
      measurementTarget,
      measuredAt = nowIso(),
      payload = {}
    } = options;

    if (!moduleRunId || !testAttemptId) {
      throw new TypeError('moduleRunId and testAttemptId are required.');
    }
    if (!MODULES.includes(module)) throw new TypeError(`Invalid module: ${String(module)}`);
    if (!MEASUREMENT_TARGETS.includes(measurementTarget)) {
      throw new TypeError(`Invalid measurement target: ${String(measurementTarget)}`);
    }
    if (!isPlainObject(payload)) throw new TypeError('Measurement payload must be a plain object.');

    const context = ensureScreeningContext();
    return Object.freeze({
      schemaVersion: CONTRACT_VERSION,
      recordType: 'module_measurement',
      appMode: context.appMode,
      analysisRole: context.analysisRole,
      researchProfile: context.researchMetadata?.researchProfile || null,
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      participantId: context.participantId,
      screeningSessionId: context.screeningSessionId,
      legacyAssessmentId: context.legacyAssessmentId,
      moduleRunId,
      testAttemptId,
      moduleMeasurementId: createId('moduleMeasurement'),
      module,
      measurementTarget,
      measuredAt,
      versionSnapshot: createVersionSnapshot(module),
      payload: Object.freeze({ ...payload })
    });
  }

  function normalizeValidityStatus(value) {
    if (VALIDITY_STATUS.includes(value)) return value;
    if (value === 'error' || value === 'technical_error') return 'not_evaluable';
    return null;
  }

  function normalizeTechnicalValidity(value, validityStatus = null) {
    if (TECHNICAL_VALIDITY.includes(value)) return value;
    if (value === 'error' || value === 'invalid') return 'failed';
    if (normalizeValidityStatus(validityStatus) === 'not_evaluable') return 'failed';
    return 'not_assessed';
  }

  function normalizeQualityStatus(value, validityStatus = null, qualityFlags = []) {
    if (QUALITY_STATUS.includes(value)) return value;
    const normalizedValidity = normalizeValidityStatus(validityStatus);
    if (normalizedValidity === 'invalid' || normalizedValidity === 'not_evaluable') return 'unusable';
    if (normalizedValidity === 'valid') return qualityFlags.length ? 'limited' : 'acceptable';
    return 'not_assessed';
  }

  function sanitizeQualityFlags(flags) {
    if (!Array.isArray(flags)) return [];
    return [...new Set(flags
      .map((value) => String(value || '').trim())
      .filter(Boolean))];
  }

  function finalizeAttempt(attempt, outcome = {}) {
    if (!isPlainObject(attempt) || attempt.recordType !== 'test_attempt') {
      throw new TypeError('A canonical test_attempt record is required.');
    }
    if (attempt.attemptStatus !== 'in_progress') {
      throw new Error(`Attempt ${attempt.testAttemptId || ''} is already finalized.`);
    }

    const validityStatus = normalizeValidityStatus(outcome.validityStatus);
    if (!validityStatus) throw new TypeError('A canonical validityStatus is required.');

    const qualityFlags = sanitizeQualityFlags(outcome.qualityFlags);
    const technicalValidity = normalizeTechnicalValidity(
      outcome.technicalValidity,
      validityStatus
    );
    const qualityStatus = normalizeQualityStatus(
      outcome.qualityStatus,
      validityStatus,
      qualityFlags
    );
    const observationStatus = OBSERVATION_STATUS.includes(outcome.observationStatus)
      ? outcome.observationStatus
      : validityStatus === 'valid'
        ? 'indeterminate'
        : validityStatus === 'invalid'
          ? 'indeterminate'
          : 'not_available';
    const invalidReasonCode = outcome.invalidReasonCode || null;

    if (validityStatus === 'valid' && invalidReasonCode) {
      throw new Error('A valid attempt cannot have invalidReasonCode.');
    }
    if (validityStatus !== 'valid' && !invalidReasonCode) {
      throw new Error(`${validityStatus} attempt requires invalidReasonCode.`);
    }
    if (validityStatus === 'not_evaluable' && technicalValidity !== 'failed') {
      throw new Error('A not_evaluable attempt must use technicalValidity=failed.');
    }

    const finalized = {
      ...attempt,
      attemptStatus: outcome.attemptStatus && ATTEMPT_STATUS.includes(outcome.attemptStatus)
        ? outcome.attemptStatus
        : 'completed',
      validityStatus,
      technicalValidity,
      observationStatus,
      qualityStatus,
      qualityFlags: Object.freeze(qualityFlags),
      invalidReasonCode,
      additionalReasonCodes: Object.freeze(sanitizeQualityFlags(outcome.additionalReasonCodes)),
      completedAt: outcome.completedAt || nowIso(),
      completionReasonCode: outcome.completionReasonCode || null,
      // Selection is mutable until the module run is finalized. The module run's
      // selectedTestAttemptId(s) is the canonical source of truth.
      selectedForModuleResult: null,
      selectionSource: 'derived_from_module_run',
      result: isPlainObject(outcome.result) ? Object.freeze({ ...outcome.result }) : null
    };

    const validation = validateCommonRecord(finalized);
    if (!validation.valid) {
      throw new Error(`Invalid finalized attempt: ${validation.errors.join('; ')}`);
    }
    return Object.freeze(finalized);
  }

  function createVersionSnapshot(module = null) {
    const config = global.QS_CONFIG || {};
    const faceConfig = config.thresholds?.face || {};
    const armConfig = config.thresholds?.arm || {};
    const armReadinessConfig = config.thresholds?.armReadiness || {};
    const speechConfig = config.thresholds?.speech || {};
    const moduleFallback = module ? MODULE_VERSION_FALLBACKS[module] : null;

    let moduleVersions = null;
    if (module === 'face') {
      moduleVersions = {
        moduleVersion: faceConfig.version || moduleFallback.moduleVersion,
        algorithmVersion: faceConfig.algorithmVersion || moduleFallback.algorithmVersion,
        resultSchemaVersion: faceConfig.resultSchemaVersion || moduleFallback.resultSchemaVersion,
        researchPayloadVersion: faceConfig.researchPayloadVersion || moduleFallback.researchPayloadVersion,
        measurementDictionaryVersion: moduleFallback.measurementDictionaryVersion
      };
    } else if (module === 'arm') {
      moduleVersions = {
        moduleVersion: armConfig.version || moduleFallback.moduleVersion,
        algorithmVersion: armConfig.algorithmVersion || moduleFallback.algorithmVersion,
        readinessVersion: armReadinessConfig.version || moduleFallback.readinessVersion,
        resultSchemaVersion: armConfig.resultSchemaVersion || moduleFallback.resultSchemaVersion,
        researchPayloadVersion: armConfig.researchPayloadVersion || moduleFallback.researchPayloadVersion,
        measurementDictionaryVersion: moduleFallback.measurementDictionaryVersion,
        sensorCapturePolicyVersion: armConfig.sensorCapturePolicyVersion
          || moduleFallback.sensorCapturePolicyVersion
      };
    } else if (module === 'speech') {
      moduleVersions = {
        moduleVersion: speechConfig.version || moduleFallback.moduleVersion,
        algorithmVersion: speechConfig.algorithmVersion || moduleFallback.algorithmVersion,
        resultSchemaVersion: speechConfig.resultSchemaVersion || moduleFallback.resultSchemaVersion,
        researchPayloadVersion: speechConfig.researchPayloadVersion || moduleFallback.researchPayloadVersion,
        measurementDictionaryVersion: moduleFallback.measurementDictionaryVersion,
        timingPolicyVersion: speechConfig.rateTimingPolicy || null,
        micCalibrationPolicyVersion: speechConfig.micCalibrationPolicyVersion || null
      };
    }

    return Object.freeze({
      appName: config.appName || 'QuickStroke',
      appVersion: config.version || null,
      buildId: config.buildId || null,
      configVersion: config.configVersion || null,
      configHash: hashObject(config),
      baselineManifestVersion: MANIFEST_VERSION,
      commonDataModelVersion: CONTRACT_VERSION,
      technicalCodeRegistryVersion: TECHNICAL_CODE_REGISTRY_VERSION,
      technicalEventSchemaVersion: TECHNICAL_EVENT_SCHEMA_VERSION,
      localStorageSchemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
      resultPolicyVersion: RESULT_POLICY_VERSION,
      resultDiagnosticsVersion: RESULT_DIAGNOSTICS_VERSION,
      appModeVersion: APP_MODE_VERSION,
      selectionPolicyVersion: SELECTION_POLICY_VERSION,
      researchPolicyVersion: global.QuickStrokeResearchPolicy?.version || null,
      localePackVersion: config.assetVersions?.localePack || null,
      languageRegistryVersion: config.assetVersions?.languageRegistry || null,
      module: module || null,
      moduleVersions: moduleVersions ? Object.freeze(moduleVersions) : null
    });
  }

  function parseBrowserFamily(userAgent) {
    const ua = String(userAgent || '');
    if (/Edg\//.test(ua)) return 'Edge';
    if (/CriOS\//.test(ua) || /Chrome\//.test(ua)) return 'Chrome';
    if (/FxiOS\//.test(ua) || /Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Other';
  }

  function parseBrowserMajorVersion(userAgent, family) {
    const ua = String(userAgent || '');
    const patterns = {
      Edge: /Edg\/(\d+)/,
      Chrome: /(?:CriOS|Chrome)\/(\d+)/,
      Firefox: /(?:FxiOS|Firefox)\/(\d+)/,
      Safari: /Version\/(\d+)/
    };
    const match = patterns[family]?.exec(ua);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  function parseOsFamily(userAgent, platform) {
    const ua = String(userAgent || '');
    const pf = String(platform || '');
    if (/iPad|iPhone|iPod/.test(ua) || (pf === 'MacIntel' && Number(global.navigator?.maxTouchPoints) > 1)) {
      return 'iOS';
    }
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua) || /Win/.test(pf)) return 'Windows';
    if (/Mac OS X/.test(ua) || /Mac/.test(pf)) return 'macOS';
    if (/Linux/.test(ua) || /Linux/.test(pf)) return 'Linux';
    return 'Other';
  }

  function getCoarseRuntimeSnapshot() {
    const navigatorObject = global.navigator || {};
    const screenObject = global.screen || {};
    const userAgent = navigatorObject.userAgent || '';
    const browserFamily = parseBrowserFamily(userAgent);
    const width = Number(global.innerWidth || screenObject.width) || null;
    const height = Number(global.innerHeight || screenObject.height) || null;

    return Object.freeze({
      browserFamily,
      browserMajorVersion: parseBrowserMajorVersion(userAgent, browserFamily),
      osFamily: parseOsFamily(userAgent, navigatorObject.platform),
      deviceClass: width !== null && width < 600 ? 'phone' : width !== null && width < 1024 ? 'tablet' : 'desktop',
      screenWidthCssPx: width,
      screenHeightCssPx: height,
      devicePixelRatio: Number(global.devicePixelRatio) || null,
      language: navigatorObject.language || null,
      secureContext: global.isSecureContext === true,
      serviceWorkerControlled: Boolean(navigatorObject.serviceWorker?.controller),
      capturedAt: nowIso()
    });
  }

  function isIsoDate(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    return Number.isFinite(Date.parse(value));
  }

  function validateCommonRecord(record) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(record)) {
      return Object.freeze({ valid: false, errors: ['Record must be a plain object.'], warnings });
    }

    if (!record.recordType) errors.push('recordType is required.');
    if (!record.schemaVersion) errors.push('schemaVersion is required.');
    if (!record.participantId) errors.push('participantId is required.');
    if (!record.screeningSessionId) errors.push('screeningSessionId is required.');


    if (record.recordType === 'screening_session') {
      if (!SESSION_STATUS.includes(record.sessionStatus)) errors.push('sessionStatus is invalid.');
      if (record.sessionStatus === 'active' && record.protocolCompletedAt) errors.push('active session cannot have protocolCompletedAt.');
      if (record.sessionStatus === 'protocol_completed' && !record.protocolCompletedAt) errors.push('protocol_completed requires protocolCompletedAt.');
      if (record.sessionStatus === 'finalized' && !record.finalizedAt) errors.push('finalized requires finalizedAt.');
      if (!['public','research','dev'].includes(record.appMode)) errors.push('appMode is invalid.');
      if (record.appMode === 'dev' && record.analysisRole !== 'engineering_only') errors.push('Dev records require analysisRole=engineering_only.');
    }

    if (record.recordType === 'module_run' || record.recordType === 'test_attempt' || record.recordType === 'module_measurement') {
      if (!record.moduleRunId) errors.push('moduleRunId is required.');
      if (!MODULES.includes(record.module)) errors.push('module is invalid.');
    }

    if (record.recordType === 'test_attempt' || record.recordType === 'module_measurement') {
      if (!record.testAttemptId) errors.push('testAttemptId is required.');
      if (!MEASUREMENT_TARGETS.includes(record.measurementTarget)) {
        errors.push('measurementTarget is invalid.');
      }
    }

    if (record.startedAt && !isIsoDate(record.startedAt)) errors.push('startedAt is invalid.');
    if (record.completedAt && !isIsoDate(record.completedAt)) errors.push('completedAt is invalid.');
    if (record.startedAt && record.completedAt && Date.parse(record.completedAt) < Date.parse(record.startedAt)) {
      errors.push('completedAt cannot be before startedAt.');
    }

    if (record.validityStatus !== null && record.validityStatus !== undefined) {
      if (!VALIDITY_STATUS.includes(record.validityStatus)) errors.push('validityStatus is invalid.');
      if (record.validityStatus === 'valid' && record.invalidReasonCode) {
        errors.push('valid record cannot have invalidReasonCode.');
      }
      if (record.validityStatus !== 'valid' && record.attemptStatus === 'completed' && !record.invalidReasonCode) {
        errors.push('completed invalid/not_evaluable record requires invalidReasonCode.');
      }
    }

    if (record.technicalValidity && !TECHNICAL_VALIDITY.includes(record.technicalValidity)) {
      errors.push('technicalValidity is invalid.');
    }
    if (record.qualityStatus && !QUALITY_STATUS.includes(record.qualityStatus)) {
      errors.push('qualityStatus is invalid.');
    }
    if (record.observationStatus && !OBSERVATION_STATUS.includes(record.observationStatus)) {
      errors.push('observationStatus is invalid.');
    }
    if (record.validityStatus === 'not_evaluable' && record.technicalValidity !== 'failed') {
      errors.push('not_evaluable requires technicalValidity=failed.');
    }
    if (record.technicalValidity === 'failed' && record.qualityStatus === 'acceptable') {
      errors.push('technicalValidity=failed conflicts with qualityStatus=acceptable.');
    }
    if (record.rawAudioStored === true) errors.push('RAW_AUDIO_POLICY_VIOLATION.');

    const snapshot = record.versionSnapshot;
    if (!snapshot) {
      warnings.push('versionSnapshot is missing.');
    } else {
      if (!snapshot.commonDataModelVersion) warnings.push('commonDataModelVersion is missing.');
      if (!snapshot.configHash) warnings.push('configHash is missing.');
      if (!snapshot.buildId) warnings.push('buildId is missing.');
      if (!snapshot.configVersion) warnings.push('configVersion is missing.');
    }

    return Object.freeze({
      valid: errors.length === 0,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings)
    });
  }


  function resolveSessionMode(currentMode, requestedMode) {
    const current = currentMode || 'undetermined';
    if (!requestedMode) return current;
    if (current === 'undetermined') return requestedMode;
    if (current === requestedMode || current === 'mixed') return current;
    return 'mixed';
  }

  function deriveAttemptSelectionFlags(moduleRuns = [], attempts = []) {
    const selectedByRun = new Map();
    (Array.isArray(moduleRuns) ? moduleRuns : []).forEach((run) => {
      const selected = new Set();
      if (run?.selectedTestAttemptId) selected.add(run.selectedTestAttemptId);
      Object.values(run?.selectedTestAttemptIds || {}).forEach((id) => {
        if (id) selected.add(id);
      });
      selectedByRun.set(run?.moduleRunId, selected);
    });
    return (Array.isArray(attempts) ? attempts : []).map((attempt) => ({
      ...attempt,
      selectedForModuleResult: selectedByRun.get(attempt?.moduleRunId)?.has(attempt?.testAttemptId) === true
    }));
  }

  function cloneSmallObject(value) {
    if (!value || typeof value !== 'object') return null;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return null;
    }
  }

  function createLightweightProjectionPayload(module, payload = {}) {
    if (!MODULES.includes(module)) throw new TypeError(`Unsupported projection module: ${String(module)}`);
    const rawValidity = payload.canonicalValidityStatus || payload.validityStatus;
    const validityStatus = normalizeValidityStatus(rawValidity)
      || (rawValidity === 'error' ? 'not_evaluable' : null)
      || 'not_evaluable';
    const qualityFlags = sanitizeQualityFlags(payload.qualityFlags || payload.technicalQuality?.flags || []);
    const technicalValidity = normalizeTechnicalValidity(payload.technicalValidity, validityStatus);
    const qualityStatus = normalizeQualityStatus(
      payload.qualityStatus || payload.technicalQuality?.status,
      validityStatus,
      qualityFlags
    );
    const observationCandidate = payload.observationStatus || payload.displayStatus || payload.observationResult;
    const observationStatus = OBSERVATION_STATUS.includes(observationCandidate)
      ? observationCandidate
      : validityStatus === 'valid'
        ? payload.riskLevel === 'bad' ? 'abnormal'
          : payload.riskLevel === 'warn' ? 'attention'
          : payload.riskLevel === 'ok' ? 'no_alert'
          : 'indeterminate'
        : validityStatus === 'not_evaluable' ? 'not_available' : 'indeterminate';

    const base = {
      schemaVersion: RESULT_PROJECTION_SCHEMA_VERSION,
      module,
      moduleRunId: payload.moduleRunId || null,
      selectedTestAttemptId: payload.selectedTestAttemptId || payload.testAttemptId || null,
      selectedTestAttemptIds: cloneSmallObject(payload.selectedTestAttemptIds),
      validityStatus,
      technicalValidity,
      observationStatus,
      qualityStatus,
      qualityFlags,
      invalidReasonCode: validityStatus === 'valid' ? null : (payload.invalidReasonCode || null),
      completedAt: payload.completedAt || nowIso(),
      riskLevel: payload.riskLevel || null,
      passed: typeof payload.passed === 'boolean' ? payload.passed : null,
      researchSummary: null
    };

    if (module === 'face') {
      const breakdown = payload.breakdown || {};
      base.domainSummary = {
        clinicalResult: payload.clinicalResult || null,
        restingCriticalTriggered: breakdown.restingCriticalTriggered === true,
        restAsym: Number.isFinite(breakdown.restAsym) ? breakdown.restAsym : null,
        representativeAsym: Number.isFinite(breakdown.representativeAsym) ? breakdown.representativeAsym : null,
        weakRatio: Number.isFinite(breakdown.weakRatio) ? breakdown.weakRatio : null
      };
      const faceResearchScore = payload.researchMetrics?.legacyFaceScore ?? payload.clinicalScore ?? payload.score;
      base.researchSummary = {
        legacyScore: Number.isFinite(Number(faceResearchScore)) ? Number(faceResearchScore) : null,
        use: 'research_only_not_user_facing'
      };
    } else if (module === 'arm') {
      const breakdown = payload.breakdown || {};
      base.selectedTestAttemptId = null;
      base.domainSummary = {
        left: {
          status: breakdown.leftClass || null,
          driftMaxDeg: Number.isFinite(breakdown.leftDrift) ? breakdown.leftDrift : null
        },
        right: {
          status: breakdown.rightClass || null,
          driftMaxDeg: Number.isFinite(breakdown.rightDrift) ? breakdown.rightDrift : null
        }
      };
      const armResearchScore = payload.researchMetrics?.legacyArmScore ?? payload.clinicalScore ?? payload.score;
      base.researchSummary = {
        legacyScore: Number.isFinite(Number(armResearchScore)) ? Number(armResearchScore) : null,
        use: 'research_only_not_user_facing'
      };
    } else if (module === 'speech') {
      base.domainSummary = {
        phrase: cloneSmallObject(payload.domains?.phrase),
        rate: cloneSmallObject(payload.domains?.rate),
        technicalQuality: {
          status: payload.technicalQuality?.status || qualityStatus,
          flags: qualityFlags
        }
      };
      const speechResearchScore = payload.researchMetrics?.legacyWeightedScore ?? payload.legacyWeightedScore ?? payload.clinicalScore ?? payload.score;
      base.researchSummary = {
        legacyScore: Number.isFinite(Number(speechResearchScore)) ? Number(speechResearchScore) : null,
        use: 'research_only_not_user_facing'
      };
    }

    return Object.freeze(base);
  }

  function inspectSourceIntegrity() {
    const snapshot = createVersionSnapshot();
    const errors = [];
    const warnings = [];

    if (!snapshot.appVersion) errors.push('APP_VERSION_MISSING');
    if (snapshot.appVersion === '1.0.4') warnings.push('APP_VERSION_REPORTED_DEPLOYED_MISMATCH');
    if (!snapshot.buildId) errors.push('BUILD_ID_MISSING');
    if (!snapshot.configVersion) errors.push('CONFIG_VERSION_MISSING');

    const resultConfig = global.QS_CONFIG?.resultPolicy || global.QS_CONFIG?.result || {};
    const declaredResultPolicyVersion = resultConfig.policyVersion || resultConfig.version || null;
    if (declaredResultPolicyVersion && declaredResultPolicyVersion !== RESULT_POLICY_VERSION) {
      errors.push('RESULT_POLICY_VERSION_MISMATCH');
    }
    if (!declaredResultPolicyVersion) warnings.push('RESULT_POLICY_VERSION_NOT_DECLARED_IN_CONFIG');

    return Object.freeze({
      readyForSourceFreeze: errors.length === 0,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      versionSnapshot: snapshot
    });
  }

  const api = Object.freeze({
    version: CONTRACT_VERSION,
    versions: Object.freeze({
      commonDataModel: CONTRACT_VERSION,
      baselineManifest: MANIFEST_VERSION,
      technicalCodeRegistry: TECHNICAL_CODE_REGISTRY_VERSION,
      technicalEventSchema: TECHNICAL_EVENT_SCHEMA_VERSION,
      localStorageSchema: LOCAL_STORAGE_SCHEMA_VERSION,
      resultPolicy: RESULT_POLICY_VERSION,
      resultDiagnostics: RESULT_DIAGNOSTICS_VERSION,
      resultProjectionSchema: RESULT_PROJECTION_SCHEMA_VERSION,
      selectionPolicy: SELECTION_POLICY_VERSION,
      appMode: APP_MODE_VERSION
    }),
    enums: Object.freeze({
      modules: MODULES,
      measurementTargets: MEASUREMENT_TARGETS,
      sessionStatus: SESSION_STATUS,
      moduleRunStatus: MODULE_RUN_STATUS,
      attemptStatus: ATTEMPT_STATUS,
      validityStatus: VALIDITY_STATUS,
      technicalValidity: TECHNICAL_VALIDITY,
      observationStatus: OBSERVATION_STATUS,
      qualityStatus: QUALITY_STATUS,
      attemptTrigger: ATTEMPT_TRIGGER,
      moduleRunTrigger: MODULE_RUN_TRIGGER
    }),
    sessionKeys: SESSION_KEYS,
    moduleVersionFallbacks: MODULE_VERSION_FALLBACKS,
    nowIso,
    stableStringify,
    fnv1aHash,
    hashObject,
    createId,
    getSessionContext,
    ensureScreeningContext,
    createScreeningSessionRecord,
    markProtocolCompleted,
    finalizeScreeningSession,
    completeScreeningSession,
    closeScreeningSession,
    createModuleRun,
    getCurrentModuleRunId,
    getPendingModuleRetry,
    resolveRetryParentModuleRunId,
    createTestAttempt,
    createModuleMeasurement,
    finalizeAttempt,
    normalizeValidityStatus,
    normalizeTechnicalValidity,
    normalizeQualityStatus,
    sanitizeQualityFlags,
    createVersionSnapshot,
    createLightweightProjectionPayload,
    resolveSessionMode,
    deriveAttemptSelectionFlags,
    getCoarseRuntimeSnapshot,
    validateCommonRecord,
    inspectSourceIntegrity
  });

  Object.defineProperty(global, 'QuickStrokeDataContract', {
    value: api,
    enumerable: true,
    configurable: false,
    writable: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
