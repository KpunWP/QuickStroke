/* QuickStroke IndexedDB research store — v0.1.0
 *
 * Load after config.js and data-contract.js.
 * Mutable sessionStorage projections remain separate from this database.
 */
(function initQuickStrokeResearchStore(global) {
  'use strict';

  if (global.QuickStrokeResearchStore) return;

  const CONTRACT = global.QuickStrokeDataContract;
  if (!CONTRACT) {
    throw new Error('QuickStrokeResearchStore requires QuickStrokeDataContract.');
  }

  const DB_NAME = 'quickstroke_research';
  const DB_VERSION = 1;
  const STORE_VERSION = 'quickstroke-local-store-0.1.1';

  const STORE_NAMES = Object.freeze({
    metadata: 'metadata',
    screeningSessions: 'screening_sessions',
    moduleRuns: 'module_runs',
    testAttempts: 'test_attempts',
    moduleMeasurements: 'module_measurements',
    sensorObservations: 'sensor_observations',
    technicalEvents: 'technical_events',
    resultProjections: 'result_projections',
    pendingSync: 'pending_sync'
  });

  const LIFECYCLE_CONFIG = Object.freeze({
    [STORE_NAMES.screeningSessions]: Object.freeze({
      keyPath: 'screeningSessionId',
      statusField: 'sessionStatus',
      openStatuses: Object.freeze(['active']),
      finalStatuses: Object.freeze(['completed', 'aborted', 'expired'])
    }),
    [STORE_NAMES.moduleRuns]: Object.freeze({
      keyPath: 'moduleRunId',
      statusField: 'moduleRunStatus',
      openStatuses: Object.freeze(['in_progress']),
      finalStatuses: Object.freeze(['completed', 'aborted', 'interrupted'])
    }),
    [STORE_NAMES.testAttempts]: Object.freeze({
      keyPath: 'testAttemptId',
      statusField: 'attemptStatus',
      openStatuses: Object.freeze(['in_progress']),
      finalStatuses: Object.freeze(['completed', 'aborted', 'interrupted'])
    })
  });

  const IMMUTABLE_IDENTITY_FIELDS = Object.freeze([
    'participantId',
    'screeningSessionId',
    'legacyAssessmentId',
    'moduleRunId',
    'testAttemptId',
    'moduleMeasurementId',
    'technicalEventId',
    'module',
    'measurementTarget',
    'startedAt',
    'createdAt'
  ]);

  let databasePromise = null;

  function nowIso() {
    return CONTRACT.nowIso();
  }

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
      if (typeof global.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
        global.dispatchEvent(new global.CustomEvent('quickstroke:research-store-error', {
          detail: {
            code: error?.code || 'STORAGE_WRITE_FAILED',
            message: error?.message || String(error),
            details: error?.details || null,
            occurredAt: nowIso()
          }
        }));
      }
    } catch (dispatchError) {
      console.warn('[QuickStrokeResearchStore] Unable to dispatch storage error.', dispatchError);
    }
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

  function createIndex(store, name, keyPath, options = {}) {
    if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
  }

  function configureSchema(database, transaction) {
    const ensureStore = (name, options) => database.objectStoreNames.contains(name)
      ? transaction.objectStore(name)
      : database.createObjectStore(name, options);

    const metadata = ensureStore(STORE_NAMES.metadata, { keyPath: 'key' });
    createIndex(metadata, 'updatedAt', 'updatedAt');

    const sessions = ensureStore(STORE_NAMES.screeningSessions, { keyPath: 'screeningSessionId' });
    createIndex(sessions, 'participantId', 'participantId');
    createIndex(sessions, 'sessionStatus', 'sessionStatus');
    createIndex(sessions, 'startedAt', 'startedAt');

    const moduleRuns = ensureStore(STORE_NAMES.moduleRuns, { keyPath: 'moduleRunId' });
    createIndex(moduleRuns, 'screeningSessionId', 'screeningSessionId');
    createIndex(moduleRuns, 'participantId', 'participantId');
    createIndex(moduleRuns, 'module', 'module');
    createIndex(moduleRuns, 'moduleRunStatus', 'moduleRunStatus');
    createIndex(moduleRuns, 'sessionModule', ['screeningSessionId', 'module']);

    const attempts = ensureStore(STORE_NAMES.testAttempts, { keyPath: 'testAttemptId' });
    createIndex(attempts, 'screeningSessionId', 'screeningSessionId');
    createIndex(attempts, 'moduleRunId', 'moduleRunId');
    createIndex(attempts, 'participantId', 'participantId');
    createIndex(attempts, 'module', 'module');
    createIndex(attempts, 'measurementTarget', 'measurementTarget');
    createIndex(attempts, 'attemptStatus', 'attemptStatus');
    createIndex(attempts, 'moduleRunSequence', ['moduleRunId', 'attemptSequenceNo']);

    const measurements = ensureStore(STORE_NAMES.moduleMeasurements, { keyPath: 'moduleMeasurementId' });
    createIndex(measurements, 'screeningSessionId', 'screeningSessionId');
    createIndex(measurements, 'moduleRunId', 'moduleRunId');
    createIndex(measurements, 'testAttemptId', 'testAttemptId');
    createIndex(measurements, 'module', 'module');
    createIndex(measurements, 'measurementTarget', 'measurementTarget');

    const sensorObservations = ensureStore(STORE_NAMES.sensorObservations, { keyPath: 'observationId' });
    createIndex(sensorObservations, 'screeningSessionId', 'screeningSessionId');
    createIndex(sensorObservations, 'moduleRunId', 'moduleRunId');
    createIndex(sensorObservations, 'testAttemptId', 'testAttemptId');
    createIndex(sensorObservations, 'module', 'module');
    createIndex(sensorObservations, 'attemptSequence', ['testAttemptId', 'sampleSequenceNo']);

    const events = ensureStore(STORE_NAMES.technicalEvents, { keyPath: 'technicalEventId' });
    createIndex(events, 'screeningSessionId', 'screeningSessionId');
    createIndex(events, 'moduleRunId', 'moduleRunId');
    createIndex(events, 'testAttemptId', 'testAttemptId');
    createIndex(events, 'eventCode', 'eventCode');
    createIndex(events, 'occurredAt', 'occurredAt');

    const projections = ensureStore(STORE_NAMES.resultProjections, { keyPath: 'projectionId' });
    createIndex(projections, 'screeningSessionId', 'screeningSessionId');
    createIndex(projections, 'module', 'module');
    createIndex(projections, 'sessionModule', ['screeningSessionId', 'module'], { unique: true });

    const pendingSync = ensureStore(STORE_NAMES.pendingSync, { keyPath: 'queueItemId' });
    createIndex(pendingSync, 'screeningSessionId', 'screeningSessionId');
    createIndex(pendingSync, 'syncStatus', 'syncStatus');
    createIndex(pendingSync, 'createdAt', 'createdAt');
  }

  async function writeMetadata(database) {
    const transaction = database.transaction(STORE_NAMES.metadata, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.metadata);
    store.put({
      key: 'schema',
      databaseName: DB_NAME,
      databaseVersion: DB_VERSION,
      storageSchemaVersion: STORE_VERSION,
      commonDataModelVersion: CONTRACT.version,
      baselineManifestVersion: CONTRACT.versions.baselineManifest,
      updatedAt: nowIso()
    });
    await transactionToPromise(transaction);
  }

  function open() {
    if (databasePromise) return databasePromise;
    if (!global.indexedDB) {
      return Promise.reject(createStoreError(
        'STORAGE_UNAVAILABLE',
        'IndexedDB is unavailable in this browser.'
      ));
    }

    databasePromise = new Promise((resolve, reject) => {
      const request = global.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = request.result;
        configureSchema(database, request.transaction);
        if (event.oldVersion > 0 && event.oldVersion < DB_VERSION) {
          console.info(`[QuickStrokeResearchStore] Upgrading database ${event.oldVersion} → ${DB_VERSION}.`);
        }
      };

      request.onsuccess = async () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };
        try {
          await writeMetadata(database);
          resolve(database);
        } catch (error) {
          database.close();
          databasePromise = null;
          reject(createStoreError('STORAGE_WRITE_FAILED', 'Unable to write database metadata.', {}, error));
        }
      };

      request.onerror = () => {
        databasePromise = null;
        reject(createStoreError('STORAGE_OPEN_FAILED', 'Unable to open QuickStroke research storage.', {}, request.error));
      };

      request.onblocked = () => {
        console.warn('[QuickStrokeResearchStore] Database upgrade is blocked by another open page.');
      };
    }).catch((error) => {
      notifyError(error);
      throw error;
    });

    return databasePromise;
  }

  async function close() {
    if (!databasePromise) return;
    const database = await databasePromise.catch(() => null);
    database?.close();
    databasePromise = null;
  }

  function cloneForStorage(record) {
    if (!record || typeof record !== 'object') {
      throw createStoreError('PAYLOAD_VALIDATION_FAILED', 'Research record must be an object.');
    }
    if (typeof global.structuredClone === 'function') return global.structuredClone(record);
    return JSON.parse(JSON.stringify(record));
  }

  function primaryKeyFor(storeName, record) {
    const lifecycle = LIFECYCLE_CONFIG[storeName];
    if (lifecycle) return record[lifecycle.keyPath];
    const keyMap = {
      [STORE_NAMES.moduleMeasurements]: 'moduleMeasurementId',
      [STORE_NAMES.sensorObservations]: 'observationId',
      [STORE_NAMES.technicalEvents]: 'technicalEventId',
      [STORE_NAMES.resultProjections]: 'projectionId',
      [STORE_NAMES.pendingSync]: 'queueItemId',
      [STORE_NAMES.metadata]: 'key'
    };
    return record[keyMap[storeName]];
  }

  function ensureRequiredKey(storeName, record) {
    const key = primaryKeyFor(storeName, record);
    if (!key) {
      throw createStoreError(
        'PAYLOAD_VALIDATION_FAILED',
        `Record for ${storeName} is missing its primary key.`,
        { storeName }
      );
    }
    return key;
  }

  async function addImmutable(storeName, record) {
    const database = await open();
    const storedRecord = cloneForStorage(record);
    const key = ensureRequiredKey(storeName, storedRecord);

    try {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).add(storedRecord);
      await transactionToPromise(transaction);
      return storedRecord;
    } catch (error) {
      const code = error?.name === 'ConstraintError' ? 'DUPLICATE_ID_CONFLICT' : 'STORAGE_WRITE_FAILED';
      const wrapped = createStoreError(
        code,
        `Unable to append immutable record to ${storeName}.`,
        { storeName, key },
        error
      );
      notifyError(wrapped);
      throw wrapped;
    }
  }

  function identityChanged(current, next) {
    return IMMUTABLE_IDENTITY_FIELDS.some((field) => {
      if (!(field in current) && !(field in next)) return false;
      return JSON.stringify(current[field] ?? null) !== JSON.stringify(next[field] ?? null);
    });
  }


  async function patchOpenLifecycleRecord(storeName, key, patch) {
    const config = LIFECYCLE_CONFIG[storeName];
    if (!config) throw createStoreError('INVALID_STORAGE_OPERATION', `${storeName} is not a lifecycle store.`);
    const database = await open();
    const storedPatch = cloneForStorage(patch || {});

    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const transactionDone = transactionToPromise(transaction);
      const store = transaction.objectStore(storeName);
      const current = await requestToPromise(store.get(key));
      if (!current) {
        transaction.abort();
        throw createStoreError('STORAGE_RECORD_NOT_FOUND', `No ${storeName} record exists for ${key}.`);
      }
      if (!config.openStatuses.includes(current[config.statusField])) {
        transaction.abort();
        throw createStoreError(
          'IMMUTABLE_RECORD_UPDATE_REJECTED',
          `${storeName} record ${key} is already finalized.`,
          { currentStatus: current[config.statusField] }
        );
      }
      if (storedPatch[config.statusField] && storedPatch[config.statusField] !== current[config.statusField]) {
        transaction.abort();
        throw createStoreError(
          'PAYLOAD_VALIDATION_FAILED',
          `Use finalizeLifecycleRecord to change ${config.statusField}.`
        );
      }
      const next = { ...current, ...storedPatch, updatedAt: nowIso() };
      if (identityChanged(current, next)) {
        transaction.abort();
        throw createStoreError(
          'FINALIZED_RECORD_MUTATION_ATTEMPTED',
          `Identity fields cannot change while updating ${storeName}.`,
          { key }
        );
      }
      store.put(next);
      await transactionDone;
      return next;
    } catch (error) {
      const wrapped = error?.name === 'QuickStrokeResearchStoreError'
        ? error
        : createStoreError('STORAGE_WRITE_FAILED', `Unable to update open ${storeName} record.`, { key }, error);
      notifyError(wrapped);
      throw wrapped;
    }
  }

  async function finalizeLifecycleRecord(storeName, key, patch) {
    const config = LIFECYCLE_CONFIG[storeName];
    if (!config) {
      throw createStoreError('INVALID_STORAGE_OPERATION', `${storeName} is not a lifecycle store.`);
    }
    const database = await open();
    const storedPatch = cloneForStorage(patch || {});

    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const transactionDone = transactionToPromise(transaction);
      const store = transaction.objectStore(storeName);
      const current = await requestToPromise(store.get(key));
      if (!current) {
        transaction.abort();
        throw createStoreError('STORAGE_RECORD_NOT_FOUND', `No ${storeName} record exists for ${key}.`);
      }

      const currentStatus = current[config.statusField];
      const nextStatus = storedPatch[config.statusField];
      if (!config.openStatuses.includes(currentStatus)) {
        transaction.abort();
        throw createStoreError(
          'IMMUTABLE_RECORD_UPDATE_REJECTED',
          `${storeName} record ${key} is already finalized.`,
          { currentStatus }
        );
      }
      if (!config.finalStatuses.includes(nextStatus)) {
        transaction.abort();
        throw createStoreError(
          'PAYLOAD_VALIDATION_FAILED',
          `${config.statusField} must transition to a final status.`,
          { nextStatus }
        );
      }

      const next = { ...current, ...storedPatch };
      if (identityChanged(current, next)) {
        transaction.abort();
        throw createStoreError(
          'FINALIZED_RECORD_MUTATION_ATTEMPTED',
          `Identity fields cannot change while finalizing ${storeName}.`,
          { key }
        );
      }

      if (!next.completedAt) next.completedAt = nowIso();
      if (!next.finalizedAt) next.finalizedAt = nowIso();
      store.put(next);
      await transactionDone;
      return next;
    } catch (error) {
      const wrapped = error?.name === 'QuickStrokeResearchStoreError'
        ? error
        : createStoreError('STORAGE_WRITE_FAILED', `Unable to finalize ${storeName} record.`, { key }, error);
      notifyError(wrapped);
      throw wrapped;
    }
  }

  async function touchSessionActivity(screeningSessionId, patch = {}) {
    if (!screeningSessionId) return null;
    try {
      return await patchOpenLifecycleRecord(STORE_NAMES.screeningSessions, screeningSessionId, {
        lastActivityAt: patch.lastActivityAt || nowIso(),
        ...(patch.lastModuleCompletedAt ? { lastModuleCompletedAt: patch.lastModuleCompletedAt } : {}),
        ...(patch.lastCompletedModule ? { lastCompletedModule: patch.lastCompletedModule } : {}),
        ...(patch.lastResultProjectionAt ? { lastResultProjectionAt: patch.lastResultProjectionAt } : {})
      });
    } catch (error) {
      if (error?.code !== 'IMMUTABLE_RECORD_UPDATE_REJECTED' && error?.code !== 'STORAGE_RECORD_NOT_FOUND') {
        console.warn('[QuickStrokeResearchStore] Unable to update session activity metadata.', error);
      }
      return null;
    }
  }

  async function finalizeModuleRunAndTouch(moduleRunId, patch) {
    const finalized = await finalizeLifecycleRecord(STORE_NAMES.moduleRuns, moduleRunId, patch);
    await touchSessionActivity(finalized.screeningSessionId, {
      lastActivityAt: finalized.completedAt || finalized.finalizedAt || nowIso(),
      lastModuleCompletedAt: finalized.completedAt || finalized.finalizedAt || nowIso(),
      lastCompletedModule: finalized.module || null
    });
    return finalized;
  }

  function normalizeProjectionForStorage(projection) {
    const source = cloneForStorage(projection || {});
    if (!source.screeningSessionId || !source.module) {
      throw createStoreError('PAYLOAD_VALIDATION_FAILED', 'Projection requires screeningSessionId and module.');
    }

    const rawPayload = source.payload && typeof source.payload === 'object'
      ? source.payload
      : source;
    const lightweight = CONTRACT.createLightweightProjectionPayload
      ? CONTRACT.createLightweightProjectionPayload(source.module, {
          ...rawPayload,
          moduleRunId: source.selectedModuleRunId || source.moduleRunId || rawPayload.moduleRunId || null,
          selectedTestAttemptId: source.selectedTestAttemptId || rawPayload.selectedTestAttemptId || rawPayload.testAttemptId || null,
          selectedTestAttemptIds: source.selectedTestAttemptIds || rawPayload.selectedTestAttemptIds || null
        })
      : rawPayload;

    return {
      projectionId: source.projectionId || `${source.screeningSessionId}:${source.module}`,
      schemaVersion: lightweight.schemaVersion || CONTRACT.versions?.resultProjectionSchema || source.schemaVersion,
      participantId: source.participantId || rawPayload.participantId || null,
      screeningSessionId: source.screeningSessionId,
      module: source.module,
      selectedModuleRunId: source.selectedModuleRunId || lightweight.moduleRunId || source.moduleRunId || null,
      selectedTestAttemptId: lightweight.selectedTestAttemptId || null,
      selectedTestAttemptIds: lightweight.selectedTestAttemptIds || null,
      validityStatus: lightweight.validityStatus,
      technicalValidity: lightweight.technicalValidity,
      observationStatus: lightweight.observationStatus,
      qualityStatus: lightweight.qualityStatus,
      qualityFlags: lightweight.qualityFlags || [],
      invalidReasonCode: lightweight.invalidReasonCode || null,
      completedAt: lightweight.completedAt || source.updatedAt || nowIso(),
      riskLevel: lightweight.riskLevel || null,
      passed: typeof lightweight.passed === 'boolean' ? lightweight.passed : null,
      domainSummary: lightweight.domainSummary || null,
      researchSummary: lightweight.researchSummary || null,
      updatedAt: nowIso()
    };
  }

  async function putProjection(projection) {
    const database = await open();
    const stored = normalizeProjectionForStorage(projection);

    try {
      const transaction = database.transaction(STORE_NAMES.resultProjections, 'readwrite');
      transaction.objectStore(STORE_NAMES.resultProjections).put(stored);
      await transactionToPromise(transaction);
      await touchSessionActivity(stored.screeningSessionId, {
        lastActivityAt: stored.updatedAt,
        lastResultProjectionAt: stored.updatedAt
      });
      return stored;
    } catch (error) {
      const wrapped = createStoreError(
        'PROJECTION_PERSIST_FAILED',
        'Unable to update the mutable result projection.',
        { projectionId: stored.projectionId },
        error
      );
      notifyError(wrapped);
      throw wrapped;
    }
  }

  async function get(storeName, key) {
    const database = await open();
    const transaction = database.transaction(storeName, 'readonly');
    const transactionDone = transactionToPromise(transaction);
    const result = await requestToPromise(transaction.objectStore(storeName).get(key));
    await transactionDone;
    return result || null;
  }

  async function getAllByIndex(storeName, indexName, query = null) {
    const database = await open();
    const transaction = database.transaction(storeName, 'readonly');
    const transactionDone = transactionToPromise(transaction);
    const index = transaction.objectStore(storeName).index(indexName);
    const result = await requestToPromise(index.getAll(query));
    await transactionDone;
    return Array.isArray(result) ? result : [];
  }

  function withObservationId(observation) {
    const stored = cloneForStorage(observation);
    stored.observationId = stored.observationId || `SO-${CONTRACT.createId('moduleMeasurement').slice(3)}`;
    return stored;
  }

  async function appendSensorObservations(observations) {
    if (!Array.isArray(observations) || observations.length === 0) return [];
    const database = await open();
    const stored = observations.map(withObservationId);

    try {
      const transaction = database.transaction(STORE_NAMES.sensorObservations, 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.sensorObservations);
      stored.forEach((record) => {
        ensureRequiredKey(STORE_NAMES.sensorObservations, record);
        store.add(record);
      });
      await transactionToPromise(transaction);
      return stored;
    } catch (error) {
      const wrapped = createStoreError(
        error?.name === 'ConstraintError' ? 'DUPLICATE_ID_CONFLICT' : 'STORAGE_WRITE_FAILED',
        'Unable to append sensor observations.',
        { count: stored.length },
        error
      );
      notifyError(wrapped);
      throw wrapped;
    }
  }

  async function enqueueSync(item) {
    const stored = cloneForStorage(item || {});
    stored.queueItemId = stored.queueItemId || `SYNC-${CONTRACT.createId('technicalEvent').slice(3)}`;
    stored.syncStatus = stored.syncStatus || 'pending';
    stored.createdAt = stored.createdAt || nowIso();
    stored.updatedAt = nowIso();
    return addImmutable(STORE_NAMES.pendingSync, stored);
  }

  async function exportSession(screeningSessionId) {
    if (!screeningSessionId) throw new TypeError('screeningSessionId is required.');

    const [session, moduleRuns, attempts, measurements, observations, events, projections] = await Promise.all([
      get(STORE_NAMES.screeningSessions, screeningSessionId),
      getAllByIndex(STORE_NAMES.moduleRuns, 'screeningSessionId', screeningSessionId),
      getAllByIndex(STORE_NAMES.testAttempts, 'screeningSessionId', screeningSessionId),
      getAllByIndex(STORE_NAMES.moduleMeasurements, 'screeningSessionId', screeningSessionId),
      getAllByIndex(STORE_NAMES.sensorObservations, 'screeningSessionId', screeningSessionId),
      getAllByIndex(STORE_NAMES.technicalEvents, 'screeningSessionId', screeningSessionId),
      getAllByIndex(STORE_NAMES.resultProjections, 'screeningSessionId', screeningSessionId)
    ]);

    const exportedAttempts = CONTRACT.deriveAttemptSelectionFlags
      ? CONTRACT.deriveAttemptSelectionFlags(moduleRuns, attempts)
      : attempts;

    return {
      exportSchemaVersion: 'quickstroke-session-export-0.1.1',
      exportedAt: nowIso(),
      versionSnapshot: CONTRACT.createVersionSnapshot(),
      screeningSession: session,
      moduleRuns,
      testAttempts: exportedAttempts,
      moduleMeasurements: measurements,
      sensorObservations: observations,
      technicalEvents: events,
      resultProjections: projections
    };
  }

  async function count(storeName) {
    const database = await open();
    const transaction = database.transaction(storeName, 'readonly');
    const transactionDone = transactionToPromise(transaction);
    const result = await requestToPromise(transaction.objectStore(storeName).count());
    await transactionDone;
    return result;
  }

  async function healthCheck() {
    try {
      const database = await open();
      return {
        ok: true,
        databaseName: database.name,
        databaseVersion: database.version,
        storageSchemaVersion: STORE_VERSION,
        stores: [...database.objectStoreNames],
        checkedAt: nowIso()
      };
    } catch (error) {
      return {
        ok: false,
        errorCode: error?.code || 'STORAGE_UNAVAILABLE',
        message: error?.message || String(error),
        checkedAt: nowIso()
      };
    }
  }

  const api = Object.freeze({
    version: STORE_VERSION,
    databaseName: DB_NAME,
    databaseVersion: DB_VERSION,
    stores: STORE_NAMES,
    open,
    close,
    healthCheck,
    count,
    addScreeningSession: (record) => addImmutable(STORE_NAMES.screeningSessions, record),
    updateActiveScreeningSession: (screeningSessionId, patch) => patchOpenLifecycleRecord(
      STORE_NAMES.screeningSessions,
      screeningSessionId,
      patch
    ),
    finalizeScreeningSession: (screeningSessionId, patch) => finalizeLifecycleRecord(
      STORE_NAMES.screeningSessions,
      screeningSessionId,
      patch
    ),
    addModuleRun: (record) => addImmutable(STORE_NAMES.moduleRuns, record),
    finalizeModuleRun: finalizeModuleRunAndTouch,
    addTestAttempt: (record) => addImmutable(STORE_NAMES.testAttempts, record),
    finalizeTestAttempt: (testAttemptId, patch) => finalizeLifecycleRecord(
      STORE_NAMES.testAttempts,
      testAttemptId,
      patch
    ),
    addModuleMeasurement: (record) => addImmutable(STORE_NAMES.moduleMeasurements, record),
    appendSensorObservation: (record) => addImmutable(
      STORE_NAMES.sensorObservations,
      withObservationId(record)
    ),
    appendSensorObservations,
    addTechnicalEvent: (record) => addImmutable(STORE_NAMES.technicalEvents, record),
    putProjection,
    enqueueSync,
    get,
    getAllByIndex,
    exportSession
  });

  Object.defineProperty(global, 'QuickStrokeResearchStore', {
    value: api,
    enumerable: true,
    configurable: false,
    writable: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
