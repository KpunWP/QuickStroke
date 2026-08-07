/* QuickStroke application-mode controller — v1.0.1
 *
 * Separates Public, Research, and Dev operation. The selected mode is used only
 * for the next session; every created session receives an immutable mode and
 * research-metadata snapshot.
 */
(function initQuickStrokeAppMode(global) {
  'use strict';
  if (global.QuickStrokeAppMode) return;

  const VERSION = 'quickstroke-app-mode-1.0.1';
  const STUDY_ID_POLICY_VERSION = 'quickstroke-study-id-random-1.0.0';
  const MODES = Object.freeze(['public', 'research', 'dev']);
  const PROFILES = Object.freeze({
    clinic_supervised: Object.freeze({ enabled: true, dataCollectionEnabled: true }),
    community_remote_qr: Object.freeze({ enabled: false, dataCollectionEnabled: false })
  });
  const ANALYSIS_ROLE = Object.freeze({
    public: 'public_ephemeral',
    research: 'research_candidate',
    dev: 'engineering_only'
  });
  const KEYS = Object.freeze({
    selectedMode: 'quickstroke_selected_app_mode',
    researchContext: 'quickstroke_research_context',
    sessionModeSnapshot: 'fast_session_app_mode',
    sessionAnalysisRole: 'fast_session_analysis_role',
    sessionResearchSnapshot: 'fast_session_research_metadata',
    devMode: 'quickstroke_dev_mode',
    legacyDevMode: 'fast_dev_mode'
  });
  const CHANGE_EVENT = 'quickstroke:app-mode-change';

  function safeStorage() {
    try { return global.sessionStorage || null; } catch (error) { return null; }
  }
  function safeJsonParse(value, fallback = null) {
    try { return JSON.parse(value); } catch (error) { return fallback; }
  }
  function normalizeStudyId(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, '-').slice(0, 64);
  }
  function secureRandomHex(byteLength = 8) {
    const cryptoApi = global.crypto || null;
    if (cryptoApi?.randomUUID) {
      return cryptoApi.randomUUID().replace(/-/g, '').slice(0, byteLength * 2).toUpperCase();
    }
    if (cryptoApi?.getRandomValues && typeof global.Uint8Array === 'function') {
      const bytes = new global.Uint8Array(byteLength);
      cryptoApi.getRandomValues(bytes);
      return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    throw new Error('Secure random generation is unavailable.');
  }
  function generateStudyId() {
    const hex = secureRandomHex(12);
    return `QS-${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,24)}`;
  }
  function selectedFromQuery() {
    try {
      const params = new URLSearchParams(global.location?.search || '');
      if (params.get('dev') === '1') return 'dev';
      if (params.get('mode') === 'research' || params.get('research') === '1') return 'research';
      if (params.get('mode') === 'public') return 'public';
    } catch (error) { /* ignore */ }
    return null;
  }
  function getSelectedMode() {
    const storage = safeStorage();
    const queryMode = selectedFromQuery();
    if (queryMode) return queryMode;
    if (storage?.getItem(KEYS.devMode) === '1' || storage?.getItem(KEYS.legacyDevMode) === '1') return 'dev';
    const stored = storage?.getItem(KEYS.selectedMode);
    return MODES.includes(stored) ? stored : 'public';
  }
  function resolveMode() {
    const storage = safeStorage();
    const snapshotted = storage?.getItem(KEYS.sessionModeSnapshot);
    return MODES.includes(snapshotted) ? snapshotted : getSelectedMode();
  }
  function getAnalysisRole(mode = resolveMode()) {
    return ANALYSIS_ROLE[mode] || ANALYSIS_ROLE.public;
  }
  function dispatchChange(source = 'api') {
    try {
      global.dispatchEvent?.(new global.CustomEvent(CHANGE_EVENT, {
        detail: Object.freeze({
          selectedMode: getSelectedMode(),
          sessionMode: resolveMode(),
          source,
          changedAt: new Date().toISOString()
        })
      }));
    } catch (error) { /* ignore */ }
  }
  function setMode(mode, options = {}) {
    if (!MODES.includes(mode)) throw new TypeError(`Unsupported app mode: ${String(mode)}`);
    const storage = safeStorage();
    storage?.setItem(KEYS.selectedMode, mode);
    dispatchChange(options.source || 'set_mode');
    return mode;
  }
  function clearSessionSnapshot() {
    const storage = safeStorage();
    if (!storage) return;
    storage.removeItem(KEYS.sessionModeSnapshot);
    storage.removeItem(KEYS.sessionAnalysisRole);
    storage.removeItem(KEYS.sessionResearchSnapshot);
  }
  function validateResearchMetadata(metadata, options = {}) {
    const errors = [];
    const warnings = [];
    const source = metadata && typeof metadata === 'object' ? metadata : {};
    const profile = source.researchProfile || 'clinic_supervised';
    const profileConfig = PROFILES[profile];
    if (!profileConfig) errors.push('RESEARCH_PROFILE_UNSUPPORTED');
    else if (!profileConfig.enabled || !profileConfig.dataCollectionEnabled) errors.push('RESEARCH_PROFILE_DISABLED');
    const normalizedStudyId = normalizeStudyId(source.studyId);
    if (!normalizedStudyId) errors.push('STUDY_ID_REQUIRED');
    if (source.studyIdSource && !['system_generated_random','externally_assigned'].includes(source.studyIdSource)) errors.push('STUDY_ID_SOURCE_INVALID');
    if (source.studyIdSource === 'system_generated_random') {
      if (!/^QS-(?:[0-9A-F]{4}-){5}[0-9A-F]{4}$/.test(normalizedStudyId)) errors.push('STUDY_ID_FORMAT_INVALID');
      if (source.studyIdGenerationPolicyVersion !== STUDY_ID_POLICY_VERSION) errors.push('STUDY_ID_POLICY_VERSION_MISMATCH');
    } else if (!source.studyIdSource) {
      warnings.push('STUDY_ID_SOURCE_NOT_RECORDED');
    }
    if (!['pending', 'consented', 'declined', 'withdrawn'].includes(source.consentStatus)) errors.push('CONSENT_STATUS_INVALID');
    if (options.requireConsented !== false && source.consentStatus !== 'consented') errors.push('CONSENT_NOT_CONFIRMED');
    if (!String(source.consentVersion || '').trim()) errors.push('CONSENT_VERSION_REQUIRED');
    if (!String(source.recruitmentSource || '').trim()) errors.push('RECRUITMENT_SOURCE_REQUIRED');
    if (!String(source.operatorRole || '').trim()) errors.push('OPERATOR_ROLE_REQUIRED');
    if (!source.operatorId) warnings.push('OPERATOR_ID_NOT_RECORDED');
    if (!source.siteCode) warnings.push('SITE_CODE_NOT_RECORDED');
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
  }
  function normalizeResearchMetadata(input = {}) {
    const profile = String(input.researchProfile || 'clinic_supervised');
    const config = PROFILES[profile] || null;
    const normalizedInputStudyId = normalizeStudyId(input.studyId);
    const studyId = normalizedInputStudyId || generateStudyId();
    const studyIdSource = String(input.studyIdSource || 'system_generated_random');
    return Object.freeze({
      researchProfile: profile,
      researchProfileEnabled: config?.enabled === true,
      dataCollectionEnabled: config?.dataCollectionEnabled === true,
      studyId,
      studyIdSource,
      studyIdGenerationPolicyVersion: studyIdSource === 'system_generated_random' ? STUDY_ID_POLICY_VERSION : null,
      consentStatus: String(input.consentStatus || 'pending'),
      consentVersion: String(input.consentVersion || '').trim() || null,
      consentRecordedAt: input.consentRecordedAt || (input.consentStatus === 'consented' ? new Date().toISOString() : null),
      recruitmentSource: String(input.recruitmentSource || '').trim() || null,
      operatorRole: String(input.operatorRole || '').trim() || null,
      operatorId: String(input.operatorId || '').trim() || null,
      siteCode: String(input.siteCode || '').trim() || null,
      configuredAt: input.configuredAt || new Date().toISOString(),
      source: input.source || 'app_mode_controller'
    });
  }
  function configureResearchContext(input = {}) {
    const normalized = normalizeResearchMetadata(input);
    const validation = validateResearchMetadata(normalized, { requireConsented: true });
    if (!validation.valid) throw new Error(validation.errors.join(', '));
    const storage = safeStorage();
    storage?.setItem(KEYS.researchContext, JSON.stringify(normalized));
    setMode('research', { source: input.source || 'research_context_configured' });
    return normalized;
  }
  function clearResearchContext() {
    safeStorage()?.removeItem(KEYS.researchContext);
  }
  function getResearchMetadata(options = {}) {
    const storage = safeStorage();
    const preferSession = options.preferSession !== false;
    const sessionValue = preferSession ? safeJsonParse(storage?.getItem(KEYS.sessionResearchSnapshot), null) : null;
    if (sessionValue) return Object.freeze(sessionValue);
    const selectedValue = safeJsonParse(storage?.getItem(KEYS.researchContext), null);
    return selectedValue ? Object.freeze(selectedValue) : null;
  }
  function applySessionSnapshot(options = {}) {
    const storage = safeStorage();
    if (!storage) throw new Error('sessionStorage is required for app-mode snapshotting.');
    if (!options.force && MODES.includes(storage.getItem(KEYS.sessionModeSnapshot))) {
      return getSessionSnapshot();
    }
    const mode = options.mode && MODES.includes(options.mode) ? options.mode : getSelectedMode();
    const role = getAnalysisRole(mode);
    let researchMetadata = null;
    if (mode === 'research') {
      researchMetadata = getResearchMetadata({ preferSession: false });
      const validation = validateResearchMetadata(researchMetadata, { requireConsented: true });
      if (!validation.valid) throw new Error(`Research session cannot start: ${validation.errors.join(', ')}`);
    }
    storage.setItem(KEYS.sessionModeSnapshot, mode);
    storage.setItem(KEYS.sessionAnalysisRole, role);
    if (researchMetadata) storage.setItem(KEYS.sessionResearchSnapshot, JSON.stringify(researchMetadata));
    else storage.removeItem(KEYS.sessionResearchSnapshot);
    dispatchChange(options.source || 'session_snapshot_applied');
    return getSessionSnapshot();
  }
  function getSessionSnapshot() {
    const storage = safeStorage();
    const mode = resolveMode();
    return Object.freeze({
      appMode: mode,
      analysisRole: storage?.getItem(KEYS.sessionAnalysisRole) || getAnalysisRole(mode),
      researchMetadata: getResearchMetadata({ preferSession: true })
    });
  }
  function isPersistenceEnabled(mode = resolveMode()) {
    return mode === 'research' || mode === 'dev';
  }
  function assertResearchReady() {
    const snapshot = getSessionSnapshot();
    if (snapshot.appMode !== 'research') return Object.freeze({ valid: true, errors: Object.freeze([]), warnings: Object.freeze([]) });
    return validateResearchMetadata(snapshot.researchMetadata, { requireConsented: true });
  }

  const api = Object.freeze({
    version: VERSION,
    studyIdPolicyVersion: STUDY_ID_POLICY_VERSION,
    modes: MODES,
    profiles: PROFILES,
    analysisRoles: ANALYSIS_ROLE,
    keys: KEYS,
    normalizeStudyId,
    generateStudyId,
    normalizeResearchMetadata,
    getSelectedMode,
    resolveMode,
    getAnalysisRole,
    setMode,
    clearSessionSnapshot,
    configureResearchContext,
    clearResearchContext,
    getResearchMetadata,
    validateResearchMetadata,
    applySessionSnapshot,
    getSessionSnapshot,
    isPersistenceEnabled,
    assertResearchReady
  });

  Object.defineProperty(global, 'QuickStrokeAppMode', { value: api, enumerable: true, configurable: false, writable: false });
})(typeof window !== 'undefined' ? window : globalThis);
