/**
 * fast-permissions.js
 * Shared camera/mic permission helper สำหรับ FAST Screening
 * รองรับ 3 ภาษา: ไทย / English / 日本語
 *
 * วิธีใช้:
 *   const result = await FastPermissions.request('camera', lang);
 *   if (result.ok) { ใช้ result.stream } else { แสดง result.errorType }
 *
 *   หรือใช้ UI helper:
 *   FastPermissions.requestWithUI('camera', lang, onSuccess);
 */
(function (global) {
  'use strict';

  // ── i18n ──────────────────────────────────────────────────────────────
  const STR = {
    th: {
      checking: 'กำลังตรวจสอบสิทธิ์...',
      needCamera: 'ขั้นตอนนี้ต้องใช้กล้องเพื่อตรวจใบหน้า',
      needMic: 'ขั้นตอนนี้ต้องใช้ไมโครโฟนเพื่อตรวจการพูด',
      allowBtn: 'อนุญาตและเริ่ม',
      // error states
      blockedTitle: '🔒 ไม่ได้รับอนุญาตให้ใช้',
      blockedCamera: 'กล้องถูกปิดกั้น กรุณาเปิดสิทธิ์การใช้กล้อง',
      blockedMic: 'ไมโครโฟนถูกปิดกั้น กรุณาเปิดสิทธิ์การใช้ไมโครโฟน',
      notFoundCamera: 'ไม่พบกล้องในอุปกรณ์นี้',
      notFoundMic: 'ไม่พบไมโครโฟนในอุปกรณ์นี้',
      inUse: 'อุปกรณ์กำลังถูกใช้งานโดยแอปอื่น กรุณาปิดแอปอื่นแล้วลองใหม่',
      insecure: 'ต้องเปิดผ่าน HTTPS เท่านั้น',
      generic: 'เกิดข้อผิดพลาดในการเข้าถึงอุปกรณ์',
      retryBtn: 'ลองอีกครั้ง',
      howToTitle: 'วิธีเปิดสิทธิ์การใช้งาน',
      // browser-specific recovery
      iosSafari: ['แตะไอคอน "อา" (aA) ที่แถบที่อยู่ด้านบน', 'เลือก "การตั้งค่าเว็บไซต์"', 'เปิดสิทธิ์กล้อง/ไมโครโฟน แล้วโหลดหน้าใหม่'],
      androidChrome: ['แตะไอคอนแม่กุญแจ 🔒 ข้างที่อยู่เว็บ', 'เลือก "สิทธิ์" หรือ "Permissions"', 'เปิดกล้อง/ไมโครโฟน แล้วโหลดหน้าใหม่'],
      desktop: ['คลิกไอคอนแม่กุญแจ 🔒 ข้างที่อยู่เว็บ', 'เปิดสิทธิ์กล้อง/ไมโครโฟน', 'โหลดหน้าใหม่'],
      reloadBtn: 'โหลดหน้าใหม่',
    },
    en: {
      checking: 'Checking permissions...',
      needCamera: 'This step needs your camera to check facial symmetry',
      needMic: 'This step needs your microphone to check speech',
      allowBtn: 'Allow & Start',
      blockedTitle: '🔒 Permission Denied',
      blockedCamera: 'Camera access is blocked. Please enable camera permission.',
      blockedMic: 'Microphone access is blocked. Please enable microphone permission.',
      notFoundCamera: 'No camera found on this device',
      notFoundMic: 'No microphone found on this device',
      inUse: 'Device is being used by another app. Close it and try again.',
      insecure: 'This must be opened over HTTPS',
      generic: 'Error accessing the device',
      retryBtn: 'Try Again',
      howToTitle: 'How to enable access',
      iosSafari: ['Tap the "aA" icon in the address bar', 'Select "Website Settings"', 'Enable Camera/Microphone, then reload'],
      androidChrome: ['Tap the lock icon 🔒 next to the URL', 'Select "Permissions"', 'Enable Camera/Microphone, then reload'],
      desktop: ['Click the lock icon 🔒 next to the URL', 'Enable Camera/Microphone', 'Reload the page'],
      reloadBtn: 'Reload Page',
    },
    ja: {
      checking: '権限を確認しています...',
      needCamera: 'このステップでは顔の対称性を確認するためにカメラが必要です',
      needMic: 'このステップでは発話を確認するためにマイクが必要です',
      allowBtn: '許可して開始',
      blockedTitle: '🔒 アクセスが拒否されました',
      blockedCamera: 'カメラがブロックされています。カメラの権限を有効にしてください。',
      blockedMic: 'マイクがブロックされています。マイクの権限を有効にしてください。',
      notFoundCamera: 'このデバイスにカメラが見つかりません',
      notFoundMic: 'このデバイスにマイクが見つかりません',
      inUse: 'デバイスは他のアプリで使用中です。閉じてからもう一度お試しください。',
      insecure: 'HTTPS経由で開く必要があります',
      generic: 'デバイスへのアクセスでエラーが発生しました',
      retryBtn: 'もう一度試す',
      howToTitle: 'アクセスを有効にする方法',
      iosSafari: ['アドレスバーの「あA」アイコンをタップ', '「Webサイトの設定」を選択', 'カメラ/マイクを有効にして再読み込み'],
      androidChrome: ['URL横の鍵アイコン🔒をタップ', '「権限」を選択', 'カメラ/マイクを有効にして再読み込み'],
      desktop: ['URL横の鍵アイコン🔒をクリック', 'カメラ/マイクを有効にする', 'ページを再読み込み'],
      reloadBtn: '再読み込み',
    },
  };

  // ── Detect browser/OS ─────────────────────────────────────────────────
  function detectPlatform() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    if (isIOS) return 'iosSafari';
    if (isAndroid) return 'androidChrome';
    return 'desktop';
  }

  // ── Check permission state (ถ้า browser รองรับ) ──────────────────────
  async function checkState(type) {
    // type: 'camera' | 'microphone'
    if (!navigator.permissions || !navigator.permissions.query) return 'unknown';
    try {
      const status = await navigator.permissions.query({ name: type });
      return status.state; // 'granted' | 'denied' | 'prompt'
    } catch (e) {
      // บาง browser ไม่รองรับ query camera/mic → unknown
      return 'unknown';
    }
  }

  // ── Request media ─────────────────────────────────────────────────────
  // kind: 'camera' | 'mic'
  async function request(kind, lang = 'th') {
    const S = STR[lang] || STR.th;

    // ตรวจ secure context (HTTPS)
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      return { ok: false, errorType: 'insecure', message: S.insecure };
    }

    const constraints = kind === 'camera'
      ? { video: { facingMode: 'user', width: 640, height: 480 }, audio: false }
      : { audio: true, video: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { ok: true, stream };
    } catch (err) {
      let errorType, message;
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
          message = S.generic + ' (' + err.name + ')';
      }
      return { ok: false, errorType, message, raw: err };
    }
  }

  // ── UI: full-screen permission gate ───────────────────────────────────
  // สร้าง overlay ขออนุญาต + แสดงวิธีแก้ถ้า block
  function requestWithUI(kind, lang, onSuccess) {
    const S = STR[lang] || STR.th;
    const platform = detectPlatform();

    // สร้าง overlay
    const overlay = document.createElement('div');
    overlay.id = 'fast-perm-overlay';
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      z-index:9999;
      background:#F8FAFC;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
      font-family:'IBM Plex Sans Thai','Manrope',sans-serif;
      color:#0F172A;
      text-align:center;
      `;

    const icon = '🧠';
    const needMsg = kind === 'camera' ? S.needCamera : S.needMic;
    
    overlay.innerHTML = `
    <div style="
      width:100%;
      max-width:420px;
      background:#FFFFFF;
      border:1px solid #E2E8F0;
      border-radius:28px;
      padding:32px 24px;
      box-shadow:0 12px 40px rgba(15,23,42,.08);
    ">
    
      <div style="
        width:72px;
        height:72px;
        margin:0 auto 18px;
        border-radius:20px;
        background:#DBEAFE;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:40px;
      ">
        ${icon}
      </div>
    
      <div style="
        font-size:22px;
        font-weight:800;
        color:#0F172A;
        margin-bottom:12px;
      ">
        FAST Screening
      </div>
    
      <p style="
        font-size:15px;
        line-height:1.7;
        color:#475569;
        margin-bottom:24px;
      ">
        ${needMsg}
      </p>
    
      <button
        id="fast-perm-allow"
        style="
          width:100%;
          background:#2B7DE9;
          color:#FFFFFF;
          border:none;
          border-radius:18px;
          padding:16px;
          font-size:16px;
          font-weight:700;
          cursor:pointer;
          box-shadow:0 8px 24px rgba(43,125,233,.25);
        ">
        ${S.allowBtn}
      </button>
    
      <div
        id="fast-perm-error"
        style="display:none;margin-top:16px;">
      </div>
    
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
        onSuccess(result.stream);
        return;
      }

      // แสดง error + วิธีแก้
      allowBtn.style.display = 'none';
      const steps = S[platform] || S.desktop;
      const errTitle = result.errorType === 'blocked' ? S.blockedTitle : '⚠️';
      let html = `
        <div style="background:rgba(239,68,68,0.1);border:1.5px solid rgba(239,68,68,0.3);
          border-radius:14px;padding:16px;margin-bottom:14px">
          <div style="font-size:15px;font-weight:600;color:#EF4444;margin-bottom:6px">${errTitle}</div>
          <div style="font-size:13px;color:rgba(241,245,249,0.7);line-height:1.5">${result.message}</div>
        </div>`;

      if (result.errorType === 'blocked') {
        html += `
          <div style="text-align:left;background:rgba(255,255,255,0.04);border-radius:12px;padding:14px 16px;margin-bottom:14px">
            <div style="font-size:13px;font-weight:600;margin-bottom:10px;color:rgba(241,245,249,0.9)">${S.howToTitle}</div>
            <ol style="margin:0;padding-left:20px;font-size:13px;color:rgba(241,245,249,0.65);line-height:1.9">
              ${steps.map(s => `<li>${s}</li>`).join('')}
            </ol>
          </div>
          <button id="fast-perm-reload" style="width:100%;background:#3B82F6;color:#fff;border:none;
            border-radius:12px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;
            font-family:inherit">${S.reloadBtn}</button>`;
      } else {
        html += `
          <button id="fast-perm-retry" style="width:100%;background:#3B82F6;color:#fff;border:none;
            border-radius:12px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;
            font-family:inherit">${S.retryBtn}</button>`;
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

  // ── Export ────────────────────────────────────────────────────────────
  global.FastPermissions = { request, requestWithUI, checkState, detectPlatform };

})(window);
