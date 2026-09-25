/* QuickStroke IndexedDB store — v0.2.0
 *
 * Research and engineering records are physically separated. Public Mode does
 * not open IndexedDB. Finalized sessions are immutable; later corrections must
 * be represented as amendment/audit records.
 */
(function initQuickStrokeResearchStore(global) {
  'use strict';
  if (global.QuickStrokeResearchStore) return;

  const CONTRACT = global.QuickStrokeDataContract;
  const APP_MODE = global.QuickStrokeAppMode || null;
  const POLICY = global.QuickStrokeResearchPolicy || null;
  if (!CONTRACT) throw new Error('QuickStrokeResearchStore requires QuickStrokeDataContract.');

  const DB_VERSION = 2;
  const STORE_VERSION = 'quickstroke-local-store-0.2.0';
  const EXPORT_SCHEMA_VERSION = 'quickstroke-session-export-0.2.0';
  const STORE_NAMES = Object.freeze({
    metadata: 'metadata',
    screeningSessions: 'screening_sessions',
    moduleRuns: 'module_runs',
    testAttempts: 'test_attempts',
    moduleMeasurements: 'module_measurements',
    sensorObservations: 'sensor_observations',
    technicalEvents: 'technical_events',
    resultProjections: 'result_projections',
    pendingSync: 'pending_sync',
    sessionAmendments: 'session_amendments',
    auditEvents: 'audit_events'
  });
  const LIFECYCLE = Object.freeze({
    [STORE_NAMES.screeningSessions]: Object.freeze({ keyPath:'screeningSessionId', statusField:'sessionStatus', open:['active','protocol_completed'], final:['finalized'] }),
    [STORE_NAMES.moduleRuns]: Object.freeze({ keyPath:'moduleRunId', statusField:'moduleRunStatus', open:['in_progress'], final:['completed','aborted','interrupted'] }),
    [STORE_NAMES.testAttempts]: Object.freeze({ keyPath:'testAttemptId', statusField:'attemptStatus', open:['in_progress'], final:['completed','aborted','interrupted'] })
  });
  const IMMUTABLE_IDENTITY_FIELDS = Object.freeze([
    'participantId','screeningSessionId','legacyAssessmentId','moduleRunId','testAttemptId',
    'moduleMeasurementId','technicalEventId','observationId','module','measurementTarget','startedAt','createdAt'
  ]);

  let activeDatabaseKey = null;
  let databasePromise = null;

  function nowIso() { return CONTRACT.nowIso(); }
  function mode() { return CONTRACT.getSessionContext?.().appMode || APP_MODE?.resolveMode?.() || 'public'; }
  function namespaceForMode(value = mode()) {
    if (value === 'research') return Object.freeze({ key:'research', databaseName:'quickstroke_research' });
    if (value === 'dev') return Object.freeze({ key:'engineering', databaseName:'quickstroke_engineering' });
    return null;
  }
  function isPersistenceEnabled() { return Boolean(namespaceForMode()); }
  function getStorageNamespace() { return namespaceForMode()?.key || 'none'; }
  function createStoreError(code, message, details = {}, cause = null) {
    const error = new Error(message);
    error.name = 'QuickStrokeResearchStoreError';
    error.code = code;
    error.details = details;
    if (cause) error.cause = cause;
    return error;
  }
  function notifyError(error) {
    console.error('[QuickStrokeResearchStore]', error);
    try {
      global.dispatchEvent?.(new global.CustomEvent('quickstroke:research-store-error', {
        detail:{ code:error?.code || 'STORAGE_WRITE_FAILED', message:error?.message || String(error), details:error?.details || null, occurredAt:nowIso() }
      }));
    } catch (dispatchError) { /* ignore */ }
  }
  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
    });
  }
  function transactionToPromise(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
    });
  }
  function cloneForStorage(value) {
    if (!value || typeof value !== 'object') throw createStoreError('PAYLOAD_VALIDATION_FAILED', 'Record must be an object.');
    if (typeof global.structuredClone === 'function') return global.structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }
  function createIndex(store, name, keyPath, options = {}) {
    if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
  }
  function configureSchema(database, transaction) {
    const ensure = (name, options) => database.objectStoreNames.contains(name)
      ? transaction.objectStore(name)
      : database.createObjectStore(name, options);
    const metadata = ensure(STORE_NAMES.metadata, { keyPath:'key' });
    createIndex(metadata, 'updatedAt', 'updatedAt');
    const sessions = ensure(STORE_NAMES.screeningSessions, { keyPath:'screeningSessionId' });
    createIndex(sessions, 'participantId', 'participantId');
    createIndex(sessions, 'sessionStatus', 'sessionStatus');
    createIndex(sessions, 'appMode', 'appMode');
    createIndex(sessions, 'studyId', 'researchMetadata.studyId');
    createIndex(sessions, 'startedAt', 'startedAt');
    const runs = ensure(STORE_NAMES.moduleRuns, { keyPath:'moduleRunId' });
    createIndex(runs, 'screeningSessionId', 'screeningSessionId');
    createIndex(runs, 'participantId', 'participantId');
    createIndex(runs, 'module', 'module');
    createIndex(runs, 'moduleRunStatus', 'moduleRunStatus');
    createIndex(runs, 'sessionModule', ['screeningSessionId','module']);
    const attempts = ensure(STORE_NAMES.testAttempts, { keyPath:'testAttemptId' });
    createIndex(attempts, 'screeningSessionId', 'screeningSessionId');
    createIndex(attempts, 'moduleRunId', 'moduleRunId');
    createIndex(attempts, 'participantId', 'participantId');
    createIndex(attempts, 'module', 'module');
    createIndex(attempts, 'measurementTarget', 'measurementTarget');
    createIndex(attempts, 'attemptStatus', 'attemptStatus');
    createIndex(attempts, 'moduleRunSequence', ['moduleRunId','attemptSequenceNo']);
    const measurements = ensure(STORE_NAMES.moduleMeasurements, { keyPath:'moduleMeasurementId' });
    createIndex(measurements, 'screeningSessionId', 'screeningSessionId');
    createIndex(measurements, 'moduleRunId', 'moduleRunId');
    createIndex(measurements, 'testAttemptId', 'testAttemptId');
    createIndex(measurements, 'module', 'module');
    const observations = ensure(STORE_NAMES.sensorObservations, { keyPath:'observationId' });
    createIndex(observations, 'screeningSessionId', 'screeningSessionId');
    createIndex(observations, 'moduleRunId', 'moduleRunId');
    createIndex(observations, 'testAttemptId', 'testAttemptId');
    createIndex(observations, 'module', 'module');
    createIndex(observations, 'attemptSequence', ['testAttemptId','sampleSequenceNo']);
    const events = ensure(STORE_NAMES.technicalEvents, { keyPath:'technicalEventId' });
    createIndex(events, 'screeningSessionId', 'screeningSessionId');
    createIndex(events, 'moduleRunId', 'moduleRunId');
    createIndex(events, 'testAttemptId', 'testAttemptId');
    createIndex(events, 'eventCode', 'eventCode');
    createIndex(events, 'occurredAt', 'occurredAt');
    const projections = ensure(STORE_NAMES.resultProjections, { keyPath:'projectionId' });
    createIndex(projections, 'screeningSessionId', 'screeningSessionId');
    createIndex(projections, 'module', 'module');
    createIndex(projections, 'sessionModule', ['screeningSessionId','module'], { unique:true });
    const pending = ensure(STORE_NAMES.pendingSync, { keyPath:'queueItemId' });
    createIndex(pending, 'screeningSessionId', 'screeningSessionId');
    createIndex(pending, 'syncStatus', 'syncStatus');
    createIndex(pending, 'createdAt', 'createdAt');
    const amendments = ensure(STORE_NAMES.sessionAmendments, { keyPath:'amendmentId' });
    createIndex(amendments, 'screeningSessionId', 'screeningSessionId');
    createIndex(amendments, 'createdAt', 'createdAt');
    const audit = ensure(STORE_NAMES.auditEvents, { keyPath:'auditEventId' });
    createIndex(audit, 'screeningSessionId', 'screeningSessionId');
    createIndex(audit, 'eventCode', 'eventCode');
    createIndex(audit, 'occurredAt', 'occurredAt');
  }
  async function writeMetadata(database, namespace) {
    const tx = database.transaction(STORE_NAMES.metadata, 'readwrite');
    tx.objectStore(STORE_NAMES.metadata).put({
      key:'schema', databaseName:database.name, databaseVersion:DB_VERSION,
      storageSchemaVersion:STORE_VERSION, namespace:namespace.key,
      commonDataModelVersion:CONTRACT.version,
      selectionPolicyVersion:POLICY?.selectionPolicyVersion || null,
      updatedAt:nowIso()
    });
    await transactionToPromise(tx);
  }
  async function close() {
    if (!databasePromise) return;
    const database = await databasePromise.catch(() => null);
    database?.close();
    databasePromise = null;
    activeDatabaseKey = null;
  }
  function open() {
    const namespace = namespaceForMode();
    if (!namespace) return Promise.reject(createStoreError('PERSISTENCE_DISABLED', 'Long-term persistence is disabled in Public Mode.'));
    if (!global.indexedDB) return Promise.reject(createStoreError('STORAGE_UNAVAILABLE', 'IndexedDB is unavailable.'));
    if (databasePromise && activeDatabaseKey === namespace.key) return databasePromise;
    if (databasePromise && activeDatabaseKey !== namespace.key) {
      const previous = databasePromise;
      databasePromise = null;
      activeDatabaseKey = null;
      void previous.then((db) => db.close()).catch(() => null);
    }
    activeDatabaseKey = namespace.key;
    databasePromise = new Promise((resolve, reject) => {
      const request = global.indexedDB.open(namespace.databaseName, DB_VERSION);
      request.onupgradeneeded = () => configureSchema(request.result, request.transaction);
      request.onsuccess = async () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); databasePromise = null; activeDatabaseKey = null; };
        try { await writeMetadata(database, namespace); resolve(database); }
        catch (error) { database.close(); databasePromise = null; activeDatabaseKey = null; reject(error); }
      };
      request.onerror = () => { databasePromise = null; activeDatabaseKey = null; reject(createStoreError('STORAGE_OPEN_FAILED', 'Unable to open QuickStroke storage.', { namespace:namespace.key }, request.error)); };
      request.onblocked = () => console.warn('[QuickStrokeResearchStore] Database upgrade is blocked.');
    }).catch((error) => { notifyError(error); throw error; });
    return databasePromise;
  }

  function primaryKeyFor(storeName, record) {
    const lifecycle = LIFECYCLE[storeName];
    if (lifecycle) return record[lifecycle.keyPath];
    const map = {
      [STORE_NAMES.moduleMeasurements]:'moduleMeasurementId', [STORE_NAMES.sensorObservations]:'observationId',
      [STORE_NAMES.technicalEvents]:'technicalEventId', [STORE_NAMES.resultProjections]:'projectionId',
      [STORE_NAMES.pendingSync]:'queueItemId', [STORE_NAMES.metadata]:'key',
      [STORE_NAMES.sessionAmendments]:'amendmentId', [STORE_NAMES.auditEvents]:'auditEventId'
    };
    return record[map[storeName]];
  }
  function ensureRequiredKey(storeName, record) {
    const key = primaryKeyFor(storeName, record);
    if (!key) throw createStoreError('PAYLOAD_VALIDATION_FAILED', `Record for ${storeName} is missing its primary key.`, { storeName });
    return key;
  }
  function stampMode(record) {
    const context = CONTRACT.getSessionContext?.() || {};
    const next = { ...record };
    const currentMode = context.appMode || mode();
    const expectedRole = currentMode === 'dev'
      ? 'engineering_only'
      : currentMode === 'research'
        ? 'research_candidate'
        : 'public_ephemeral';
    if (next.appMode && next.appMode !== currentMode) {
      throw createStoreError('MODE_NAMESPACE_MISMATCH', 'Record appMode does not match the active storage namespace.', {
        recordAppMode:next.appMode, currentMode
      });
    }
    if (next.analysisRole && next.analysisRole !== expectedRole) {
      throw createStoreError('ANALYSIS_ROLE_NAMESPACE_MISMATCH', 'Record analysisRole does not match the active storage namespace.', {
        recordAnalysisRole:next.analysisRole, expectedRole
      });
    }
    next.appMode = currentMode;
    next.analysisRole = expectedRole;
    next.researchProfile = currentMode === 'research'
      ? next.researchProfile || context.researchMetadata?.researchProfile || null
      : null;
    next.selectionPolicyVersion = next.selectionPolicyVersion || POLICY?.selectionPolicyVersion || null;
    return next;
  }
  async function get(storeName, key) {
    if (!isPersistenceEnabled()) return null;
    const db = await open();
    const tx = db.transaction(storeName, 'readonly');
    const done = transactionToPromise(tx);
    const result = await requestToPromise(tx.objectStore(storeName).get(key));
    await done;
    return result || null;
  }
  async function getAllByIndex(storeName, indexName, query = null) {
    if (!isPersistenceEnabled()) return [];
    const db = await open();
    const tx = db.transaction(storeName, 'readonly');
    const done = transactionToPromise(tx);
    const index = tx.objectStore(storeName).index(indexName);
    const result = await requestToPromise(query === null ? index.getAll() : index.getAll(query));
    await done;
    return Array.isArray(result) ? result : [];
  }
  async function assertSessionWritable(screeningSessionId) {
    if (!screeningSessionId) return null;
    const session = await get(STORE_NAMES.screeningSessions, screeningSessionId);
    if (!session) throw createStoreError('STORAGE_RECORD_NOT_FOUND', `No screening session exists for ${screeningSessionId}.`);
    if (session.sessionStatus === 'finalized') throw createStoreError('FINALIZED_SESSION_WRITE_REJECTED', 'The session is finalized. Create an amendment with an audit trail instead.', { screeningSessionId });
    return session;
  }
  async function addImmutable(storeName, record, options = {}) {
    const stamped = stampMode(cloneForStorage(record));
    if (!isPersistenceEnabled()) return stamped;
    const key = ensureRequiredKey(storeName, stamped);
    if (!options.allowFinalized && stamped.screeningSessionId && storeName !== STORE_NAMES.screeningSessions && storeName !== STORE_NAMES.sessionAmendments && storeName !== STORE_NAMES.auditEvents) {
      await assertSessionWritable(stamped.screeningSessionId);
    }
    const db = await open();
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).add(stamped);
      await transactionToPromise(tx);
      return stamped;
    } catch (error) {
      const wrapped = createStoreError(error?.name === 'ConstraintError' ? 'DUPLICATE_ID_CONFLICT' : 'STORAGE_WRITE_FAILED', `Unable to append record to ${storeName}.`, { storeName, key }, error);
      notifyError(wrapped); throw wrapped;
    }
  }
  function identityChanged(current, next) {
    return IMMUTABLE_IDENTITY_FIELDS.some((field) => JSON.stringify(current?.[field] ?? null) !== JSON.stringify(next?.[field] ?? null));
  }
  async function patchOpenLifecycleRecord(storeName, key, patch) {
    if (!isPersistenceEnabled()) return null;
    const config = LIFECYCLE[storeName];
    if (!config) throw createStoreError('INVALID_STORAGE_OPERATION', `${storeName} is not a lifecycle store.`);
    const db = await open();
    const storedPatch = cloneForStorage(patch || {});
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const done = transactionToPromise(tx);
      const store = tx.objectStore(storeName);
      const current = await requestToPromise(store.get(key));
      if (!current) { tx.abort(); throw createStoreError('STORAGE_RECORD_NOT_FOUND', `No ${storeName} record exists for ${key}.`); }
      if (!config.open.includes(current[config.statusField])) { tx.abort(); throw createStoreError('IMMUTABLE_RECORD_UPDATE_REJECTED', `${storeName} record is finalized.`, { key, currentStatus:current[config.statusField] }); }
      if (storedPatch[config.statusField] && storedPatch[config.statusField] !== current[config.statusField]) { tx.abort(); throw createStoreError('PAYLOAD_VALIDATION_FAILED', `Use a lifecycle transition to change ${config.statusField}.`); }
      const next = { ...current, ...storedPatch, updatedAt:nowIso() };
      if (identityChanged(current, next)) { tx.abort(); throw createStoreError('FINALIZED_RECORD_MUTATION_ATTEMPTED', 'Identity fields cannot change.', { key }); }
      store.put(next); await done; return next;
    } catch (error) {
      const wrapped = error?.name === 'QuickStrokeResearchStoreError' ? error : createStoreError('STORAGE_WRITE_FAILED', `Unable to update ${storeName}.`, { key }, error);
      notifyError(wrapped); throw wrapped;
    }
  }
  async function finalizeLifecycleRecord(storeName, key, patch) {
    if (!isPersistenceEnabled()) return null;
    const config = LIFECYCLE[storeName];
    if (!config) throw createStoreError('INVALID_STORAGE_OPERATION', `${storeName} is not a lifecycle store.`);
    const db = await open();
    const storedPatch = cloneForStorage(patch || {});
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const done = transactionToPromise(tx);
      const store = tx.objectStore(storeName);
      const current = await requestToPromise(store.get(key));
      if (!current) { tx.abort(); throw createStoreError('STORAGE_RECORD_NOT_FOUND', `No ${storeName} record exists for ${key}.`); }
      const currentStatus = current[config.statusField];
      const nextStatus = storedPatch[config.statusField];
      if (!config.open.includes(currentStatus)) { tx.abort(); throw createStoreError('IMMUTABLE_RECORD_UPDATE_REJECTED', `${storeName} record is already closed.`, { key, currentStatus }); }
      if (!config.final.includes(nextStatus)) { tx.abort(); throw createStoreError('PAYLOAD_VALIDATION_FAILED', `${config.statusField} must transition to a final state.`, { nextStatus }); }
      const next = { ...current, ...storedPatch };
      if (identityChanged(current, next)) { tx.abort(); throw createStoreError('FINALIZED_RECORD_MUTATION_ATTEMPTED', 'Identity fields cannot change.', { key }); }
      if (storeName === STORE_NAMES.screeningSessions) {
        next.finalizedAt = next.finalizedAt || nowIso();
      } else {
        next.completedAt = next.completedAt || nowIso();
        next.recordClosedAt = next.recordClosedAt || nowIso();
        delete next.finalizedAt;
      }
      next.updatedAt = nowIso();
      store.put(next); await done;
      // Notify opt-in JSSF sync only after the canonical local write has committed.
      // Public, clinical Research and Dev retain their existing storage behavior.
      if ((storeName === STORE_NAMES.moduleRuns || storeName === STORE_NAMES.testAttempts)
          && next.appMode === 'research' && next.researchProfile === 'community_remote_qr') {
        try {
          global.dispatchEvent?.(new global.CustomEvent('quickstroke:research-record-finalized', {
            detail:{kind:storeName === STORE_NAMES.moduleRuns ? 'module_run' : 'test_attempt',record:next}
          }));
        } catch (error) { console.warn('JSSF outbox notification failed.', error); }
      }
      return next;
    } catch (error) {
      const wrapped = error?.name === 'QuickStrokeResearchStoreError' ? error : createStoreError('STORAGE_WRITE_FAILED', `Unable to finalize ${storeName}.`, { key }, error);
      notifyError(wrapped); throw wrapped;
    }
  }
  async function touchSessionActivity(screeningSessionId, patch = {}) {
    if (!screeningSessionId || !isPersistenceEnabled()) return null;
    try {
      const session = await get(STORE_NAMES.screeningSessions, screeningSessionId);
      if (!session || session.sessionStatus === 'finalized') return session;
      return patchOpenLifecycleRecord(STORE_NAMES.screeningSessions, screeningSessionId, { lastActivityAt:patch.lastActivityAt || nowIso(), ...patch });
    } catch (error) { console.warn('[QuickStrokeResearchStore] Unable to touch session.', error); return null; }
  }
  async function maybeMarkProtocolCompleted(screeningSessionId) {
    const [session, runs] = await Promise.all([
      get(STORE_NAMES.screeningSessions, screeningSessionId),
      getAllByIndex(STORE_NAMES.moduleRuns, 'screeningSessionId', screeningSessionId)
    ]);
    if (!session || session.sessionStatus === 'finalized' || session.sessionStatus === 'protocol_completed') return session;
    const firstByModule = {};
    (runs || []).filter((run) => run.moduleRunStatus === 'completed' && run.completedAt).forEach((run) => {
      const current = firstByModule[run.module];
      if (!current || Date.parse(run.completedAt) < Date.parse(current.completedAt)) firstByModule[run.module] = run;
    });
    if (!['face','arm','speech'].every((module) => firstByModule[module])) return session;
    const protocolCompletedAt = session.protocolCompletedAt || new Date(Math.max(...Object.values(firstByModule).map((run) => Date.parse(run.completedAt)))).toISOString();
    const db = await open();
    const tx = db.transaction(STORE_NAMES.screeningSessions, 'readwrite');
    const done = transactionToPromise(tx);
    const store = tx.objectStore(STORE_NAMES.screeningSessions);
    const current = await requestToPromise(store.get(screeningSessionId));
    if (current && current.sessionStatus === 'active') {
      current.sessionStatus = 'protocol_completed';
      current.protocolCompletedAt = protocolCompletedAt;
      current.completedAt = protocolCompletedAt;
      current.protocolCompletionReasonCode = 'FULL_PROTOCOL_FIRST_COMPLETION';
      current.updatedAt = nowIso();
      store.put(current);
    }
    await done;
    CONTRACT.markProtocolCompleted?.(protocolCompletedAt, 'FULL_PROTOCOL_FIRST_COMPLETION');
    return get(STORE_NAMES.screeningSessions, screeningSessionId);
  }

  async function refreshSessionSelection(screeningSessionId) {
    if (!POLICY?.deriveSelectionSummary || !screeningSessionId || !isPersistenceEnabled()) return null;
    const [session, runs] = await Promise.all([
      get(STORE_NAMES.screeningSessions, screeningSessionId),
      getAllByIndex(STORE_NAMES.moduleRuns, 'screeningSessionId', screeningSessionId)
    ]);
    if (!session || session.sessionStatus === 'finalized') return session;
    const selectionSummary = POLICY.deriveSelectionSummary(session, runs);
    return patchOpenLifecycleRecord(STORE_NAMES.screeningSessions, screeningSessionId, {
      moduleSelection: selectionSummary.byModule,
      selectionPolicyVersion: selectionSummary.selectionPolicyVersion,
      selectionUpdatedAt: nowIso()
    });
  }
  async function finalizeModuleRunAndTouch(moduleRunId, patch) {
    const run = await get(STORE_NAMES.moduleRuns, moduleRunId);
    if (!run) throw createStoreError('STORAGE_RECORD_NOT_FOUND', `No module run exists for ${moduleRunId}.`);
    await assertSessionWritable(run.screeningSessionId);
    const attempts = await getAllByIndex(STORE_NAMES.testAttempts, 'moduleRunId', moduleRunId);
    const finalized = await finalizeLifecycleRecord(STORE_NAMES.moduleRuns, moduleRunId, { ...patch, attemptCount:attempts.length });
    await touchSessionActivity(finalized.screeningSessionId, {
      lastActivityAt:finalized.completedAt || nowIso(), lastModuleCompletedAt:finalized.completedAt || nowIso(), lastCompletedModule:finalized.module
    });
    await maybeMarkProtocolCompleted(finalized.screeningSessionId);
    await refreshSessionSelection(finalized.screeningSessionId);
    return finalized;
  }
  function normalizeProjectionForStorage(projection) {
    const source = stampMode(cloneForStorage(projection || {}));
    if (!source.screeningSessionId || !source.module) throw createStoreError('PAYLOAD_VALIDATION_FAILED', 'Projection requires screeningSessionId and module.');
    const raw = source.payload && typeof source.payload === 'object' ? source.payload : source;
    const light = CONTRACT.createLightweightProjectionPayload?.(source.module, {
      ...raw,
      moduleRunId:source.selectedModuleRunId || source.moduleRunId || raw.moduleRunId || null,
      selectedTestAttemptId:source.selectedTestAttemptId || raw.selectedTestAttemptId || raw.testAttemptId || null,
      selectedTestAttemptIds:source.selectedTestAttemptIds || raw.selectedTestAttemptIds || null
    }) || raw;
    return {
      projectionId:source.projectionId || `${source.screeningSessionId}:${source.module}`,
      schemaVersion:light.schemaVersion || CONTRACT.versions.resultProjectionSchema,
      participantId:source.participantId || raw.participantId || null,
      screeningSessionId:source.screeningSessionId,
      appMode:source.appMode, analysisRole:source.analysisRole, researchProfile:source.researchProfile,
      selectionPolicyVersion:source.selectionPolicyVersion,
      module:source.module, selectedModuleRunId:source.selectedModuleRunId || light.moduleRunId || null,
      selectedTestAttemptId:light.selectedTestAttemptId || null, selectedTestAttemptIds:light.selectedTestAttemptIds || null,
      validityStatus:light.validityStatus, technicalValidity:light.technicalValidity,
      observationStatus:light.observationStatus, qualityStatus:light.qualityStatus,
      qualityFlags:light.qualityFlags || [], invalidReasonCode:light.invalidReasonCode || null,
      completedAt:light.completedAt || source.updatedAt || nowIso(), riskLevel:light.riskLevel || null,
      passed:typeof light.passed === 'boolean' ? light.passed : null,
      domainSummary:light.domainSummary || null, researchSummary:light.researchSummary || null, updatedAt:nowIso()
    };
  }
  async function putProjection(projection) {
    const stored = normalizeProjectionForStorage(projection);
    if (!isPersistenceEnabled()) return stored;
    await assertSessionWritable(stored.screeningSessionId);
    const db = await open();
    try {
      const tx = db.transaction(STORE_NAMES.resultProjections, 'readwrite');
      tx.objectStore(STORE_NAMES.resultProjections).put(stored);
      await transactionToPromise(tx);
      await touchSessionActivity(stored.screeningSessionId, { lastResultProjectionAt:stored.updatedAt });
      return stored;
    } catch (error) { const wrapped=createStoreError('PROJECTION_PERSIST_FAILED','Unable to update projection.',{projectionId:stored.projectionId},error); notifyError(wrapped); throw wrapped; }
  }
  function withObservationId(record) {
    const stored = stampMode(cloneForStorage(record));
    stored.observationId = stored.observationId || `SO-${CONTRACT.createId('moduleMeasurement').slice(3)}`;
    return stored;
  }
  async function appendSensorObservations(records) {
    if (!Array.isArray(records) || !records.length) return [];
    const stored = records.map(withObservationId);
    if (!isPersistenceEnabled()) return stored;
    await assertSessionWritable(stored[0].screeningSessionId);
    const db = await open();
    try {
      const tx = db.transaction(STORE_NAMES.sensorObservations, 'readwrite');
      const store = tx.objectStore(STORE_NAMES.sensorObservations);
      stored.forEach((record) => { ensureRequiredKey(STORE_NAMES.sensorObservations, record); store.add(record); });
      await transactionToPromise(tx); return stored;
    } catch (error) { const wrapped=createStoreError(error?.name==='ConstraintError'?'DUPLICATE_ID_CONFLICT':'STORAGE_WRITE_FAILED','Unable to append sensor observations.',{count:stored.length},error); notifyError(wrapped); throw wrapped; }
  }
  async function enqueueSync(item) {
    const stored = stampMode(cloneForStorage(item || {}));
    stored.queueItemId = stored.queueItemId || `SYNC-${CONTRACT.createId('technicalEvent').slice(3)}`;
    stored.syncStatus = stored.syncStatus || 'pending'; stored.createdAt = stored.createdAt || nowIso(); stored.updatedAt = nowIso();
    return addImmutable(STORE_NAMES.pendingSync, stored);
  }
  async function count(storeName) {
    if (!isPersistenceEnabled()) return 0;
    const db = await open(); const tx=db.transaction(storeName,'readonly'); const done=transactionToPromise(tx);
    const result=await requestToPromise(tx.objectStore(storeName).count()); await done; return result;
  }
  async function readBundle(screeningSessionId) {
    const [screeningSession,moduleRuns,testAttempts,moduleMeasurements,sensorObservations,technicalEvents,resultProjections,pendingSync,sessionAmendments,auditEvents] = await Promise.all([
      get(STORE_NAMES.screeningSessions,screeningSessionId), getAllByIndex(STORE_NAMES.moduleRuns,'screeningSessionId',screeningSessionId),
      getAllByIndex(STORE_NAMES.testAttempts,'screeningSessionId',screeningSessionId), getAllByIndex(STORE_NAMES.moduleMeasurements,'screeningSessionId',screeningSessionId),
      getAllByIndex(STORE_NAMES.sensorObservations,'screeningSessionId',screeningSessionId), getAllByIndex(STORE_NAMES.technicalEvents,'screeningSessionId',screeningSessionId),
      getAllByIndex(STORE_NAMES.resultProjections,'screeningSessionId',screeningSessionId), getAllByIndex(STORE_NAMES.pendingSync,'screeningSessionId',screeningSessionId),
      getAllByIndex(STORE_NAMES.sessionAmendments,'screeningSessionId',screeningSessionId), getAllByIndex(STORE_NAMES.auditEvents,'screeningSessionId',screeningSessionId)
    ]);
    return { screeningSession,moduleRuns,testAttempts:CONTRACT.deriveAttemptSelectionFlags?.(moduleRuns,testAttempts)||testAttempts,moduleMeasurements,sensorObservations,technicalEvents,resultProjections,pendingSync,sessionAmendments,auditEvents };
  }
  async function validateSessionIntegrity(screeningSessionId, options = {}) {
    const bundle = await readBundle(screeningSessionId);
    return POLICY?.validateSessionBundle?.(bundle, options) || { canFinalize:true, errors:[], warnings:[], selectionSummary:null };
  }
  async function exportSession(screeningSessionId) {
    if (!screeningSessionId) throw new TypeError('screeningSessionId is required.');
    if (!isPersistenceEnabled()) throw createStoreError('PERSISTENCE_DISABLED','Public Mode does not retain a research session export.');
    const bundle = await readBundle(screeningSessionId);
    const integritySummary = POLICY?.validateSessionBundle?.(bundle, { requireProtocolComplete:false, allowAlreadyFinalized:true }) || null;
    const selectionSummary = POLICY?.deriveSelectionSummary?.(bundle.screeningSession,bundle.moduleRuns) || null;
    const output = {
      exportSchemaVersion:EXPORT_SCHEMA_VERSION, exportedAt:nowIso(), storageNamespace:getStorageNamespace(),
      versionSnapshot:CONTRACT.createVersionSnapshot(), ...bundle, integritySummary, selectionSummary,
      transferState:{ uploadState:bundle.screeningSession?.uploadState || 'not_configured', exportState:'exported_locally', pendingSyncCount:bundle.pendingSync.length }
    };
    return bundle.screeningSession?.appMode === 'research' && POLICY?.sanitizeResearchExport ? POLICY.sanitizeResearchExport(output) : output;
  }
  async function addAuditEvent(screeningSessionId, eventCode, details = {}) {
    const context = CONTRACT.getSessionContext?.() || {};
    return addImmutable(STORE_NAMES.auditEvents, {
      auditEventId:`AUD-${CONTRACT.createId('technicalEvent').slice(3)}`, recordType:'audit_event', schemaVersion:'quickstroke-audit-event-0.1.0',
      participantId:details.participantId || context.participantId || null, screeningSessionId,
      eventCode, occurredAt:nowIso(), actorRole:details.actorRole || context.researchMetadata?.operatorRole || null,
      actorId:details.actorId || context.researchMetadata?.operatorId || null, reasonCode:details.reasonCode || null,
      details:details.details || null, appMode:details.appMode || context.appMode || mode(), analysisRole:details.analysisRole || context.analysisRole || null
    }, { allowFinalized:true });
  }
  async function finalizeResearchSession(screeningSessionId, metadata = {}) {
    const session = await get(STORE_NAMES.screeningSessions, screeningSessionId);
    if (!session) throw createStoreError('STORAGE_RECORD_NOT_FOUND','Session not found.',{screeningSessionId});
    if (session.appMode !== 'research') throw createStoreError('NOT_A_RESEARCH_SESSION','Only Research Mode sessions use research finalization.');
    if (session.sessionStatus === 'finalized') return { finalizedSession:session, integritySummary:await validateSessionIntegrity(screeningSessionId,{requireProtocolComplete:true,requireResearch:true,allowAlreadyFinalized:true}) };
    if (session.sessionStatus !== 'protocol_completed') throw createStoreError('PROTOCOL_NOT_COMPLETED','All three protocol modules must be completed before finalization.');
    const integritySummary = await validateSessionIntegrity(screeningSessionId,{requireProtocolComplete:true,requireResearch:true});
    if (!integritySummary.canFinalize) throw createStoreError('INTEGRITY_VALIDATION_FAILED','Session integrity validation failed.',{errors:integritySummary.errors,warnings:integritySummary.warnings});
    const finalizedAt = metadata.finalizedAt || nowIso();
    const finalizationMetadata = {
      finalizationType:'research_operator_finalize', reasonCode:metadata.reasonCode || 'PARTICIPANT_DATA_COLLECTION_ENDED',
      finalizedByRole:metadata.finalizedByRole || session.researchMetadata?.operatorRole || null,
      finalizedByOperatorId:metadata.finalizedByOperatorId || session.researchMetadata?.operatorId || null,
      integrityPolicyVersion:integritySummary.integrityPolicyVersion || POLICY?.integrityPolicyVersion || null,
      integrityReportHash:CONTRACT.hashObject(integritySummary), amendmentRequiredForChanges:true
    };
    const finalizedSession = await finalizeLifecycleRecord(STORE_NAMES.screeningSessions, screeningSessionId, {
      sessionStatus:'finalized', finalizedAt, finalizationMetadata,
      moduleSelection:integritySummary.selectionSummary?.byModule || null,
      selectionPolicyVersion:POLICY?.selectionPolicyVersion || session.selectionPolicyVersion || null,
      exportState:'ready_for_export', uploadState:session.uploadState || 'not_configured', completionReasonCode:finalizationMetadata.reasonCode
    });
    CONTRACT.finalizeScreeningSession?.({ ...finalizationMetadata, finalizedAt });
    await addAuditEvent(screeningSessionId,'SESSION_FINALIZED',{participantId:session.participantId,actorRole:finalizationMetadata.finalizedByRole,actorId:finalizationMetadata.finalizedByOperatorId,reasonCode:finalizationMetadata.reasonCode,details:{integrityReportHash:finalizationMetadata.integrityReportHash}});
    return { finalizedSession, integritySummary };
  }
  async function finalizeAdministrativeSession(screeningSessionId, metadata = {}) {
    const session = await get(STORE_NAMES.screeningSessions, screeningSessionId);
    if (!session) return { finalizedSession:null, integritySummary:null };
    if (session.sessionStatus === 'finalized') return { finalizedSession:session, integritySummary:null };
    const finalizedAt = metadata.finalizedAt || nowIso();
    const finalizationMetadata = {
      finalizationType:metadata.finalizationType || 'administrative_abandonment',
      reasonCode:metadata.reasonCode || 'SESSION_CLOSED_BEFORE_RESEARCH_FINALIZATION',
      finalizedByRole:metadata.finalizedByRole || session.researchMetadata?.operatorRole || null,
      finalizedByOperatorId:metadata.finalizedByOperatorId || session.researchMetadata?.operatorId || null,
      amendmentRequiredForChanges:true
    };
    const finalizedSession = await finalizeLifecycleRecord(STORE_NAMES.screeningSessions,screeningSessionId,{sessionStatus:'finalized',finalizedAt,finalizationMetadata,completionReasonCode:finalizationMetadata.reasonCode});
    CONTRACT.finalizeScreeningSession?.({ ...finalizationMetadata, finalizedAt });
    await addAuditEvent(screeningSessionId,'SESSION_ADMINISTRATIVELY_FINALIZED',{participantId:session.participantId,reasonCode:finalizationMetadata.reasonCode});
    return { finalizedSession, integritySummary:null };
  }
  async function createSessionAmendment(screeningSessionId, amendment = {}) {
    const session = await get(STORE_NAMES.screeningSessions, screeningSessionId);
    if (!session || session.sessionStatus !== 'finalized') throw createStoreError('AMENDMENT_REQUIRES_FINALIZED_SESSION','Amendments are only allowed after finalization.');
    if (!String(amendment.reason || '').trim()) throw createStoreError('AMENDMENT_REASON_REQUIRED','An amendment reason is required.');
    const record = {
      amendmentId:`AMD-${CONTRACT.createId('technicalEvent').slice(3)}`, recordType:'session_amendment', schemaVersion:'quickstroke-session-amendment-0.1.0',
      participantId:session.participantId, screeningSessionId, createdAt:nowIso(),
      createdByRole:amendment.createdByRole || session.researchMetadata?.operatorRole || null,
      createdByOperatorId:amendment.createdByOperatorId || session.researchMetadata?.operatorId || null,
      reason:String(amendment.reason).trim(), targetRecordType:amendment.targetRecordType || null,
      targetRecordId:amendment.targetRecordId || null, proposedPatch:cloneForStorage(amendment.proposedPatch || {}),
      status:'recorded_not_applied', originalRecordsRemainImmutable:true,
      appMode:session.appMode, analysisRole:session.analysisRole
    };
    const stored = await addImmutable(STORE_NAMES.sessionAmendments,record,{allowFinalized:true});
    await addAuditEvent(screeningSessionId,'SESSION_AMENDMENT_RECORDED',{participantId:session.participantId,reasonCode:'AMENDMENT_RECORDED',details:{amendmentId:stored.amendmentId}});
    return stored;
  }
  async function healthCheck() {
    if (!isPersistenceEnabled()) return { ok:true, persistenceEnabled:false, namespace:'none', reason:'public_mode_ephemeral', checkedAt:nowIso() };
    try { const db=await open(); return {ok:true,persistenceEnabled:true,namespace:getStorageNamespace(),databaseName:db.name,databaseVersion:db.version,storageSchemaVersion:STORE_VERSION,stores:[...db.objectStoreNames],checkedAt:nowIso()}; }
    catch(error){return {ok:false,persistenceEnabled:true,namespace:getStorageNamespace(),errorCode:error?.code||'STORAGE_UNAVAILABLE',message:error?.message||String(error),checkedAt:nowIso()};}
  }

  const api = Object.freeze({
    version:STORE_VERSION, databaseVersion:DB_VERSION, exportSchemaVersion:EXPORT_SCHEMA_VERSION, stores:STORE_NAMES,
    isPersistenceEnabled, getStorageNamespace, open, close, healthCheck, count,
    addScreeningSession:(record)=>addImmutable(STORE_NAMES.screeningSessions,record),
    updateActiveScreeningSession:(id,patch)=>patchOpenLifecycleRecord(STORE_NAMES.screeningSessions,id,patch),
    finalizeScreeningSession:(id,patch)=>finalizeLifecycleRecord(STORE_NAMES.screeningSessions,id,patch),
    finalizeResearchSession, finalizeAdministrativeSession, validateSessionIntegrity, createSessionAmendment,
    addModuleRun:(record)=>addImmutable(STORE_NAMES.moduleRuns,record), finalizeModuleRun:finalizeModuleRunAndTouch,
    addTestAttempt:(record)=>addImmutable(STORE_NAMES.testAttempts,record),
    finalizeTestAttempt:(id,patch)=>finalizeLifecycleRecord(STORE_NAMES.testAttempts,id,patch),
    addModuleMeasurement:(record)=>addImmutable(STORE_NAMES.moduleMeasurements,record),
    appendSensorObservation:(record)=>addImmutable(STORE_NAMES.sensorObservations,withObservationId(record)), appendSensorObservations,
    addTechnicalEvent:(record)=>addImmutable(STORE_NAMES.technicalEvents,record), addAuditEvent,
    putProjection, enqueueSync, get, getAllByIndex, exportSession
  });
  Object.defineProperty(global,'QuickStrokeResearchStore',{value:api,enumerable:true,configurable:false,writable:false});
})(typeof window !== 'undefined' ? window : globalThis);
