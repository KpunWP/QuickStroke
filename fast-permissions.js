/**
 * fast-permissions.js
 * Shared camera/microphone permission helper for QuickStroke.
 * UI text is loaded from locales/<locale>/ui.json → messages.permissions.
 *
 * Usage:
 *   const result = await FastPermissions.request('camera', lang);
 *   FastPermissions.requestWithUI('camera', lang, onSuccess);
 */
(function (global) {
  'use strict';

  const VERSION = 'fast-permissions-1.1.0';

  const LOCALE_MAP = Object.freeze({
    th: 'th-TH', 'th-TH': 'th-TH',
    en: 'en-US', 'en-US': 'en-US',
    ja: 'ja-JP', 'ja-JP': 'ja-JP'
  });

  const REQUIRED_KEYS = Object.freeze([
    'checking', 'needCamera', 'needMic', 'cameraTitle', 'micTitle',
    'privacyNote', 'allowBtn', 'blockedTitle', 'blockedCamera', 'blockedMic',
    'notFoundCamera', 'notFoundMic', 'inUse', 'insecure', 'generic',
    'retryBtn', 'howToTitle', 'iosSafari', 'androidChrome', 'desktop',
    'reloadBtn', 'loadError'
  ]);

  const packCache = new Map();

  function readSavedLocale() {
    try {
      return (
        localStorage.getItem('quickstroke_locale') ||
        sessionStorage.getItem('fast_lang') ||
        localStorage.getItem('fast_lang') ||
        'th'
      );
    } catch (error) {
      return 'th';
    }
  }

  function normalizeLocale(lang) {
    const value = String(lang || readSavedLocale() || 'th');
    return LOCALE_MAP[value] || LOCALE_MAP[value.split('-')[0]] || 'th-TH';
  }

  function isValidPack(pack) {
    if (!pack || typeof pack !== 'object') return false;
    return REQUIRED_KEYS.every((key) => {
      if (['iosSafari', 'androidChrome', 'desktop'].includes(key)) {
        return Array.isArray(pack[key]) && pack[key].length > 0;
      }
      return typeof pack[key] === 'string' && pack[key].trim().length > 0;
    });
  }

  async function fetchPermissionPack(locale) {
    const url = new URL(`locales/${locale}/ui.json`, document.baseURI);
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url.pathname}`);
    const messages = await response.json();
    if (!isValidPack(messages.permissions)) {
      throw new Error(`Missing or invalid permissions namespace in ${locale}`);
    }
    return messages.permissions;
  }

  async function getStrings(lang) {
    const locale = normalizeLocale(lang);
    if (packCache.has(locale)) return packCache.get(locale);

    // Reuse the currently loaded shared i18n pack when it matches.
    try {
      const i18n = global.QuickStrokeI18n;
      const messages = i18n && typeof i18n.getMessages === 'function'
        ? i18n.getMessages()
        : null;
      const currentLocale = messages?.meta?.locale ||
        (typeof i18n?.getLocale === 'function' ? i18n.getLocale() : null);
      if (normalizeLocale(currentLocale) === locale && isValidPack(messages?.permissions)) {
        packCache.set(locale, messages.permissions);
        return messages.permissions;
      }
    } catch (error) {
      console.warn('FastPermissions: shared i18n pack unavailable', error);
    }

    try {
      const pack = await fetchPermissionPack(locale);
      packCache.set(locale, pack);
      return pack;
    } catch (primaryError) {
      // English is the developer-reference fallback pack.
      if (locale !== 'en-US') {
        try {
          const fallback = await fetchPermissionPack('en-US');
          packCache.set(locale, fallback);
          return fallback;
        } catch (fallbackError) {
          console.error('FastPermissions: failed to load permission language packs', primaryError, fallbackError);
        }
      } else {
        console.error('FastPermissions: failed to load permission language pack', primaryError);
      }
      throw primaryError;
    }
  }

  function detectPlatform() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    if (isIOS) return 'iosSafari';
    if (isAndroid) return 'androidChrome';
    return 'desktop';
  }

  function permissionQueryName(kind) {
    return kind === 'mic' ? 'microphone' : kind;
  }

  async function checkState(type) {
    if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
    try {
      const status = await navigator.permissions.query({
        name: permissionQueryName(type)
      });
      return status.state;
    } catch (error) {
      return 'unknown';
    }
  }

  function reasonCodeFor(kind, errorType) {
    const prefix = kind === 'camera' ? 'CAMERA' : 'MICROPHONE';

    switch (errorType) {
      case 'i18n':
        return 'I18N_LOAD_FAILED';
      case 'insecure':
        return 'INSECURE_CONTEXT';
      case 'blocked':
        return `${prefix}_PERMISSION_DENIED`;
      case 'notfound':
        return `${prefix}_NOT_AVAILABLE`;
      case 'inuse':
        return `${prefix}_IN_USE`;
      case 'generic':
      default:
        return `${prefix}_STREAM_FAILED`;
    }
  }

  function resultMetadata(kind, startedAt, permissionStateBefore) {
    return {
      helperVersion: VERSION,
      kind,
      platform: detectPlatform(),
      permissionStateBefore,
      requestedAt: new Date(startedAt).toISOString(),
      completedAt: new Date().toISOString()
    };
  }

  async function request(kind, lang = 'th') {
    const startedAt = Date.now();
    const permissionStateBefore = await checkState(kind);
    let S;
    try {
      S = await getStrings(lang);
    } catch (error) {
      return {
        ok: false,
        errorType: 'i18n',
        reasonCode: reasonCodeFor(kind, 'i18n'),
        message: 'Unable to load language resources.',
        raw: error,
        ...resultMetadata(kind, startedAt, permissionStateBefore)
      };
    }

    if (!['camera', 'mic'].includes(kind)) {
      return {
        ok: false,
        errorType: 'generic',
        reasonCode: 'INVALID_PERMISSION_KIND',
        message: S.generic,
        ...resultMetadata(kind, startedAt, permissionStateBefore)
      };
    }

    if (!window.isSecureContext && location.hostname !== 'localhost') {
      return {
        ok: false,
        errorType: 'insecure',
        reasonCode: reasonCodeFor(kind, 'insecure'),
        message: S.insecure,
        ...resultMetadata(kind, startedAt, permissionStateBefore)
      };
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        ok: false,
        errorType: 'generic',
        reasonCode: reasonCodeFor(kind, 'generic'),
        message: S.generic,
        ...resultMetadata(kind, startedAt, permissionStateBefore)
      };
    }

    const constraints = kind === 'camera'
      ? { video: { facingMode: 'user', width: 640, height: 480 }, audio: false }
      : { audio: true, video: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return {
        ok: true,
        stream,
        reasonCode: null,
        ...resultMetadata(kind, startedAt, permissionStateBefore)
      };
    } catch (err) {
      let errorType;
      let message;
      switch (err.name) {
        case 'NotAllowedError':
        case 'SecurityError':
          errorType = 'blocked';
          message = kind === 'camera' ? S.blockedCamera : S.blockedMic;
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorType = 'notfound';
          message = kind === 'camera' ? S.notFoundCamera : S.notFoundMic;
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorType = 'inuse';
          message = S.inUse;
          break;
        default:
          errorType = 'generic';
          message = `${S.generic} (${err.name || 'UnknownError'})`;
      }
      return {
        ok: false,
        errorType,
        reasonCode: reasonCodeFor(kind, errorType),
        message,
        raw: err,
        ...resultMetadata(kind, startedAt, permissionStateBefore)
      };
    }
  }

  function createLoadErrorOverlay(message) {
    const oldOverlay = document.getElementById('fast-perm-overlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'fast-perm-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#F8FAFC;display:flex;align-items:center;justify-content:center;padding:28px 22px;font-family:system-ui,sans-serif;color:#0F172A;text-align:center';
    overlay.innerHTML = `
      <div style="width:100%;max-width:360px;background:#fff;border:1px solid #E5E7EB;border-radius:28px;padding:28px 22px;box-shadow:0 24px 60px rgba(15,23,42,.14)">
        <div style="font-size:36px;margin-bottom:12px">⚠️</div>
        <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 18px">${message}</p>
        <button type="button" style="width:100%;background:#2B7DE9;color:#fff;border:none;border-radius:16px;padding:13px;font-size:15px;font-weight:800;cursor:pointer">Reload</button>
      </div>`;
    overlay.querySelector('button').onclick = () => location.reload();
    document.body.appendChild(overlay);
  }

  function requestWithUI(kind, lang, onSuccess, onFailure) {
    openPermissionUI(kind, lang, onSuccess, onFailure).catch((error) => {
      console.error('FastPermissions UI failed', error);
      createLoadErrorOverlay('Unable to load language resources. Please reload the page.');
    });
  }

  async function openPermissionUI(kind, lang, onSuccess, onFailure) {
    const S = await getStrings(lang);
    const platform = detectPlatform();

    const existing = document.getElementById('fast-perm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'fast-perm-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;background:#F8FAFC;
      display:flex;align-items:center;justify-content:center;
      padding:28px 22px;font-family:'IBM Plex Sans Thai','Manrope','DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;
      color:#0F172A;text-align:center`;

    const icon = kind === 'camera' ? '📷' : '🎤';
    const needMsg = kind === 'camera' ? S.needCamera : S.needMic;
    const title = kind === 'camera' ? S.cameraTitle : S.micTitle;

    overlay.innerHTML = `
      <div style="width:100%;max-width:360px;background:#FFFFFF;border:1px solid #E5E7EB;
        border-radius:28px;padding:28px 22px 24px;box-shadow:0 24px 60px rgba(15,23,42,0.14)">
        <div style="width:76px;height:76px;margin:0 auto 18px;border-radius:24px;
          background:linear-gradient(180deg,#EFF6FF,#DBEAFE);display:flex;align-items:center;justify-content:center;
          box-shadow:inset 0 0 0 1px rgba(43,125,233,0.14)">
          <div style="font-size:36px;line-height:1">${icon}</div>
        </div>
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.2px;color:#0F172A;margin-bottom:8px">${title}</div>
        <p style="font-size:15px;line-height:1.65;max-width:300px;margin:0 auto;color:#475569">${needMsg}</p>
        <p style="font-size:12px;line-height:1.5;margin:10px auto 20px;color:#64748B">${S.privacyNote}</p>
        <button id="fast-perm-allow" type="button" style="width:100%;background:linear-gradient(180deg,#2B7DE9,#155FC3);color:#fff;border:none;
          border-radius:18px;padding:15px 22px;font-size:16px;font-weight:800;
          cursor:pointer;font-family:inherit;box-shadow:0 12px 28px rgba(43,125,233,0.28)">${S.allowBtn}</button>
        <div id="fast-perm-error" style="display:none;width:100%;margin-top:18px"></div>
      </div>`;

    document.body.appendChild(overlay);

    const allowBtn = overlay.querySelector('#fast-perm-allow');
    const errorBox = overlay.querySelector('#fast-perm-error');

    async function attempt() {
      allowBtn.disabled = true;
      allowBtn.textContent = S.checking;
      const result = await request(kind, lang);

      if (result.ok) {
        overlay.remove();
        if (typeof onSuccess === 'function') onSuccess(result.stream, result);
        return;
      }

      if (typeof onFailure === 'function') {
        try {
          onFailure(result);
        } catch (callbackError) {
          console.error('FastPermissions failure callback failed', callbackError);
        }
      }

      allowBtn.style.display = 'none';
      const steps = S[platform] || S.desktop;
      const errTitle = result.errorType === 'blocked' ? S.blockedTitle : '⚠️';
      let html = `
        <div style="background:#FEF2F2;border:1.5px solid #FECACA;
          border-radius:18px;padding:15px;margin-bottom:14px;text-align:left">
          <div style="font-size:15px;font-weight:800;color:#DC2626;margin-bottom:6px">${errTitle}</div>
          <div style="font-size:13px;color:#7F1D1D;line-height:1.55">${result.message}</div>
        </div>`;

      if (result.errorType === 'blocked') {
        html += `
          <div style="text-align:left;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:14px 16px;margin-bottom:14px">
            <div style="font-size:13px;font-weight:800;margin-bottom:10px;color:#0F172A">${S.howToTitle}</div>
            <ol style="margin:0;padding-left:20px;font-size:13px;color:#475569;line-height:1.9">
              ${steps.map((step) => `<li>${step}</li>`).join('')}
            </ol>
          </div>
          <button id="fast-perm-reload" type="button" style="width:100%;background:linear-gradient(180deg,#2B7DE9,#155FC3);color:#fff;border:none;
            border-radius:16px;padding:13px;font-size:15px;font-weight:800;cursor:pointer;
            font-family:inherit;box-shadow:0 10px 24px rgba(43,125,233,0.24)">${S.reloadBtn}</button>`;
      } else {
        html += `
          <button id="fast-perm-retry" type="button" style="width:100%;background:linear-gradient(180deg,#2B7DE9,#155FC3);color:#fff;border:none;
            border-radius:16px;padding:13px;font-size:15px;font-weight:800;cursor:pointer;
            font-family:inherit;box-shadow:0 10px 24px rgba(43,125,233,0.24)">${S.retryBtn}</button>`;
      }

      errorBox.innerHTML = html;
      errorBox.style.display = 'block';

      const reloadBtn = errorBox.querySelector('#fast-perm-reload');
      const retryBtn = errorBox.querySelector('#fast-perm-retry');
      if (reloadBtn) reloadBtn.onclick = () => location.reload();
      if (retryBtn) retryBtn.onclick = () => {
        errorBox.style.display = 'none';
        allowBtn.style.display = 'block';
        allowBtn.disabled = false;
        allowBtn.textContent = S.allowBtn;
      };
    }

    allowBtn.onclick = attempt;
  }

  global.FastPermissions = {
    version: VERSION,
    request,
    requestWithUI,
    checkState,
    detectPlatform,
    getStrings,
    reasonCodeFor
  };
})(window);
