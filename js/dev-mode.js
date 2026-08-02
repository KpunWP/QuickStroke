/* QuickStroke global developer mode — v0.2.0
 *
 * Load after config.js, data-contract.js and research-store.js.
 * Developer mode changes visibility and logging only. It must never change
 * thresholds, algorithms, validity, observation or user-facing decisions.
 */
(function initQuickStrokeDevMode(global) {
  'use strict';

  if (global.QuickStrokeDevMode) return;

  const VERSION = 'quickstroke-dev-mode-0.2.0';
  const STORAGE_KEY = 'quickstroke_dev_mode';
  const LEGACY_STORAGE_KEY = 'fast_dev_mode';
  const CHANGE_EVENT = 'quickstroke:dev-mode-change';
  const BADGE_ID = 'quickstroke-global-dev-badge';
  const STYLE_ID = 'quickstroke-global-dev-style';

  const CONTRACT = global.QuickStrokeDataContract || null;
  const RESEARCH_STORE = global.QuickStrokeResearchStore || null;

  function safeSessionStorage() {
    try {
      return global.sessionStorage || null;
    } catch (error) {
      console.warn('[QuickStrokeDevMode] sessionStorage unavailable.', error);
      return null;
    }
  }

  function readStoredState() {
    const storage = safeSessionStorage();
    if (!storage) return false;
    return storage.getItem(STORAGE_KEY) === '1' || storage.getItem(LEGACY_STORAGE_KEY) === '1';
  }

  function writeStoredState(enabled) {
    const storage = safeSessionStorage();
    if (!storage) return;
    if (enabled) {
      storage.setItem(STORAGE_KEY, '1');
      storage.setItem(LEGACY_STORAGE_KEY, '1');
    } else {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  function stateFromQuery() {
    try {
      const params = new URLSearchParams(global.location?.search || '');
      if (params.get('dev') === '1') return true;
      if (params.get('dev') === '0') return false;
    } catch (error) {
      console.warn('[QuickStrokeDevMode] Unable to parse URL query.', error);
    }
    return null;
  }

  let enabled = (() => {
    const queryState = stateFromQuery();
    if (queryState !== null) {
      writeStoredState(queryState);
      return queryState;
    }
    return readStoredState();
  })();

  function inferModule() {
    const pathname = String(global.location?.pathname || '').toLowerCase();
    if (pathname.includes('face-test')) return 'face';
    if (pathname.includes('arm-test')) return 'arm';
    if (pathname.includes('speech-test')) return 'speech';
    if (pathname.includes('result')) return 'result';
    if (pathname.endsWith('/') || pathname.includes('index')) return 'index';
    return 'unknown';
  }

  function sanitizeValue(value, depth = 0) {
    if (depth > 4) return '[TRUNCATED]';
    if (value === null || value === undefined) return value ?? null;
    if (typeof value === 'string') return value.slice(0, 500);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitizeValue(item, depth + 1));
    if (typeof value === 'object') {
      const result = {};
      Object.entries(value).slice(0, 40).forEach(([key, item]) => {
        if (/useragent|deviceid|groupid|token|authorization|cookie|rawaudio|image|video/i.test(key)) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeValue(item, depth + 1);
        }
      });
      return result;
    }
    return String(value).slice(0, 500);
  }

  function ensureStyle() {
    if (!global.document || global.document.getElementById(STYLE_ID)) return;
    const style = global.document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BADGE_ID}{
        position:fixed;
        left:10px;
        bottom:calc(10px + env(safe-area-inset-bottom));
        z-index:2147483000;
        display:none;
        pointer-events:none;
        padding:5px 9px;
        border:1px solid rgba(255,255,255,.35);
        border-radius:999px;
        background:rgba(20,26,35,.88);
        color:#7CFFB2;
        box-shadow:0 5px 18px rgba(0,0,0,.28);
        font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        letter-spacing:.08em;
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
      }
      body.qs-global-dev-mode #${BADGE_ID}{display:block}
    `;
    (global.document.head || global.document.documentElement).appendChild(style);
  }

  function ensureBadge() {
    if (!global.document) return null;
    ensureStyle();
    let badge = global.document.getElementById(BADGE_ID);
    if (!badge) {
      badge = global.document.createElement('div');
      badge.id = BADGE_ID;
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = 'DEV MODE';
      (global.document.body || global.document.documentElement).appendChild(badge);
    }
    return badge;
  }

  function applyDomState() {
    if (!global.document) return;
    ensureBadge();
    global.document.body?.classList.toggle('qs-global-dev-mode', enabled);
    global.document.documentElement?.classList.toggle('qs-global-dev-mode', enabled);
  }

  function dispatchChange(source) {
    try {
      global.dispatchEvent?.(new global.CustomEvent(CHANGE_EVENT, {
        detail: Object.freeze({ enabled, source, changedAt: new Date().toISOString() })
      }));
    } catch (error) {
      console.warn('[QuickStrokeDevMode] Unable to dispatch change event.', error);
    }
  }

  function buildTechnicalEvent(eventCode, details = {}) {
    if (!CONTRACT) return null;
    const context = CONTRACT.getSessionContext?.() || {};
    if (!context.participantId || !context.screeningSessionId) return null;

    const module = details.module || inferModule();
    const eventModule = ['face', 'arm', 'speech'].includes(module) ? module : null;
    const occurredAt = CONTRACT.nowIso?.() || new Date().toISOString();

    return {
      technicalEventId: CONTRACT.createId('technicalEvent'),
      recordType: 'technical_event',
      schemaVersion: CONTRACT.versions?.technicalEventSchema || 'technical-event-0.1.0',
      participantId: context.participantId,
      screeningSessionId: context.screeningSessionId,
      legacyAssessmentId: context.legacyAssessmentId || null,
      module: eventModule,
      moduleRunId: details.moduleRunId || (eventModule ? CONTRACT.getCurrentModuleRunId?.(eventModule) : null) || null,
      testAttemptId: details.testAttemptId || null,
      eventCode,
      category: details.category || 'developer_mode',
      severity: details.severity || 'info',
      phase: details.phase || null,
      occurredAt,
      recordedAt: occurredAt,
      sourceComponent: 'global-dev-mode',
      sourceVersion: VERSION,
      recovered: false,
      recoveredAt: null,
      recoveryAction: null,
      messageKey: null,
      details: sanitizeValue({
        page: inferModule(),
        ...details,
        module: undefined,
        moduleRunId: undefined,
        testAttemptId: undefined,
        category: undefined,
        severity: undefined,
        phase: undefined
      }),
      versionSnapshot: CONTRACT.createVersionSnapshot?.(eventModule) || null
    };
  }

  function logEvent(eventCode, details = {}) {
    if (!enabled && eventCode !== 'DEV_MODE_DISABLED') return Promise.resolve(null);
    const safeCode = String(eventCode || 'DEV_EVENT').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const event = buildTechnicalEvent(safeCode, details);

    console.info(`[QuickStrokeDevMode] ${safeCode}`, sanitizeValue(details));
    if (!event || !RESEARCH_STORE?.addTechnicalEvent) return Promise.resolve(event);

    return RESEARCH_STORE.addTechnicalEvent(event).catch((error) => {
      console.warn('[QuickStrokeDevMode] Unable to persist technical event.', error);
      return null;
    });
  }

  function setEnabled(nextEnabled, options = {}) {
    const next = Boolean(nextEnabled);
    const previous = enabled;
    const source = options.source || 'api';
    if (previous === next) {
      applyDomState();
      return enabled;
    }

    if (previous && !next) {
      void logEvent('DEV_MODE_DISABLED', { source });
    }

    enabled = next;
    writeStoredState(enabled);
    applyDomState();
    dispatchChange(source);

    if (!previous && enabled) {
      void logEvent('DEV_MODE_ENABLED', { source });
    }
    return enabled;
  }

  function enable(options = {}) {
    return setEnabled(true, options);
  }

  function disable(options = {}) {
    return setEnabled(false, options);
  }

  function toggle(options = {}) {
    return setEnabled(!enabled, options);
  }

  function isEnabled() {
    return enabled;
  }

  async function exportCurrentSession() {
    const context = CONTRACT?.getSessionContext?.() || {};
    if (!context.screeningSessionId) throw new Error('No active screening session.');
    if (!RESEARCH_STORE?.exportSession) throw new Error('Research store is unavailable.');
    return RESEARCH_STORE.exportSession(context.screeningSessionId);
  }

  async function copyCurrentSessionLog() {
    const payload = await exportCurrentSession();
    const text = JSON.stringify(payload, null, 2);
    if (global.navigator?.clipboard?.writeText) {
      await global.navigator.clipboard.writeText(text);
    } else {
      const area = global.document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      global.document.body.appendChild(area);
      area.select();
      global.document.execCommand('copy');
      area.remove();
    }
    return text;
  }

  function safeFilenamePart(value, fallback = 'unknown') {
    const normalized = String(value || fallback)
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || fallback;
  }

  function compactUtcTimestamp(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown-time';
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  async function buildCurrentSessionTextFile() {
    const payload = await exportCurrentSession();
    const text = JSON.stringify(payload, null, 2);
    const sessionId = safeFilenamePart(payload?.screeningSession?.screeningSessionId, 'unknown-session');
    const exportedAt = compactUtcTimestamp(payload?.exportedAt || new Date());
    const filename = `quickstroke-session_${sessionId}_${exportedAt}.txt`;
    const file = new File([text], filename, { type: 'text/plain;charset=utf-8' });
    return { payload, text, filename, file };
  }

  async function shareCurrentSessionFile() {
    const prepared = await buildCurrentSessionTextFile();
    const navigatorObject = global.navigator;
    if (!navigatorObject?.share) {
      const error = new Error('File sharing is not supported by this browser.');
      error.code = 'FILE_SHARE_UNSUPPORTED';
      throw error;
    }
    const shareData = {
      title: 'QuickStroke session log',
      text: `QuickStroke session export ${prepared.payload?.screeningSession?.screeningSessionId || ''}`.trim(),
      files: [prepared.file]
    };
    if (navigatorObject.canShare && !navigatorObject.canShare({ files: shareData.files })) {
      const error = new Error('This browser cannot share files.');
      error.code = 'FILE_SHARE_UNSUPPORTED';
      throw error;
    }
    await navigatorObject.share(shareData);
    return {
      filename: prepared.filename,
      byteLength: prepared.file.size,
      screeningSessionId: prepared.payload?.screeningSession?.screeningSessionId || null
    };
  }

  async function downloadCurrentSessionFile() {
    const prepared = await buildCurrentSessionTextFile();
    if (!global.document || !global.URL?.createObjectURL) {
      throw new Error('File download is not supported by this browser.');
    }
    const url = global.URL.createObjectURL(prepared.file);
    const anchor = global.document.createElement('a');
    anchor.href = url;
    anchor.download = prepared.filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    global.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    global.setTimeout(() => global.URL.revokeObjectURL(url), 1000);
    return {
      filename: prepared.filename,
      byteLength: prepared.file.size,
      screeningSessionId: prepared.payload?.screeningSession?.screeningSessionId || null
    };
  }

  function initDom() {
    applyDomState();
    if (enabled) {
      void logEvent('DEV_PAGE_OPENED', {
        page: inferModule(),
        path: String(global.location?.pathname || '')
      });
    }
  }

  if (global.document?.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', initDom, { once: true });
  } else {
    initDom();
  }

  const api = Object.freeze({
    version: VERSION,
    storageKey: STORAGE_KEY,
    changeEvent: CHANGE_EVENT,
    enable,
    disable,
    toggle,
    setEnabled,
    isEnabled,
    applyDomState,
    logEvent,
    exportCurrentSession,
    copyCurrentSessionLog,
    buildCurrentSessionTextFile,
    shareCurrentSessionFile,
    downloadCurrentSessionFile
  });

  Object.defineProperty(global, 'QuickStrokeDevMode', {
    value: api,
    enumerable: true,
    configurable: false,
    writable: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
