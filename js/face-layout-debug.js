// Temporary opt-in metadata diagnostics. No media reads, engine hooks, storage or report uploads.
export async function startFaceLayoutDebug() {
  const query = new URLSearchParams(location.search);
  const publicOnly = () => document.documentElement.dataset.facePublic === '1' &&
    window.QuickStrokeAppMode?.resolveMode?.() === 'public' &&
    window.QuickStrokeDevMode?.isEnabled?.() !== true && !query.has('mesh');
  if (query.get('faceLayoutDebug') !== '1' || !publicOnly()) return;
  let gate;
  try {
    const response = await fetch('/api/face-layout-debug-gate?faceLayoutDebug=1', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store'
    });
    if (!response.ok) return;
    gate = await response.json();
  } catch (_) { return; } // Offline/unknown environment fails closed, with no diagnostic UI or capture.
  if (gate.schema !== 1 || gate.preview !== true || gate.host !== location.hostname ||
      !/^[a-f0-9]{40}$/.test(gate.sha || '') || !publicOnly()) return;
  if (document.getElementById('qs-face-layout-debug')) return;

  const start = document.getElementById('start-btn');
  const video = document.getElementById('video');
  if (!start || !video) return;
  const originTime = performance.now();
  const snapshots = [];
  const computed = [], computedIndex = new Map();
  const timers = new Set();
  const frames = new Set();
  let stopped = false, starts = 0, marks = 0, pending = 0, beforeQueued = false, resultWasVisible = false;
  const round = n => Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  const elapsed = () => round(performance.now() - originTime);
  const fingerprint = text => {
    let hash = 2166136261;
    for (const c of text) hash = Math.imul(hash ^ c.codePointAt(0), 16777619) >>> 0;
    return hash.toString(16).padStart(8, '0');
  };
  const styles = [...document.querySelectorAll('style')].map((s, i) => ({
    i, id: ['public-face-style','public-face-startup-style','public-face-active-style'].includes(s.id) ? s.id : '',
    n: s.textContent.length, fnv: fingerprint(s.textContent)
  }));
  const allowedClasses = ['start-ready','screening-active','result-visible','notice-status','notice-pose',
    'notice-smile','pose-warning-visible','smile-prompt-visible'];
  const properties = ['display','position','width','height','min-width','min-height','max-width','max-height',
    'top','right','bottom','left','padding','border-width','box-sizing','overflow-x','overflow-y',
    'transform','filter','backdrop-filter','perspective','contain','clip-path','object-fit','object-position',
    'aspect-ratio','background-color','opacity','z-index','visibility','grid-template-rows','grid-template-columns',
    'grid-row-start','grid-row-end','align-items','justify-content','will-change','isolation'];
  const element = (node, pseudo) => {
    if (!node) return null;
    const css = getComputedStyle(node, pseudo);
    const values = properties.map(p => css.getPropertyValue(p).replace(/url\([^)]*\)/g, 'url(redacted)'));
    const signature = JSON.stringify(values);
    if (!computedIndex.has(signature)) { computedIndex.set(signature, computed.length); computed.push(values); }
    const cs = computedIndex.get(signature);
    if (pseudo) return { cs, contentPresent: !['none','normal',''].includes(css.content) };
    const r = node.getBoundingClientRect();
    return { r: [r.x,r.y,r.width,r.height].map(round), client: [node.clientWidth,node.clientHeight],
      scroll: [node.scrollWidth,node.scrollHeight], cs };
  };
  const host = document.createElement('div');
  host.id = 'qs-face-layout-debug';
  host.style.cssText = 'position:fixed;left:8px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;max-width:calc(100vw - 16px);font-size:16px;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>
    :host{color:#172536;font-family:system-ui,sans-serif;line-height:1.5}
    button{font:600 14px/1.5 system-ui,sans-serif;min-height:48px;padding:8px 12px;border:1px solid #75899d;border-radius:10px;background:#fff;color:#172536;cursor:pointer}
    button:focus-visible{outline:3px solid #0d58b8;outline-offset:2px}
    section{width:min(290px,calc(100vw - 16px));max-height:50dvh;overflow:auto;box-sizing:border-box;background:#fff;border:1px solid #75899d;border-radius:12px;padding:8px}
    section[hidden],textarea[hidden]{display:none} p{font-size:13px;margin:6px 0} nav{display:grid;gap:6px}
    textarea{box-sizing:border-box;width:100%;height:90px;font:12px/1.4 monospace}
  </style><button type="button" id="toggle" aria-expanded="false" aria-controls="panel">Layout</button>
  <section id="panel" hidden aria-label="Face layout diagnostics">
    <p>Preview diagnostics. Collapse before Start. Copy after completion.</p>
    <nav><button type="button" id="mark">Mark black bands visible</button><button type="button" id="copy">Copy diagnostic report</button></nav>
    <p id="status" aria-live="off">Preparing bounded snapshots…</p>
    <textarea id="fallback" readonly inputmode="none" aria-label="Diagnostic JSON — select and copy" hidden></textarea>
  </section>`;
  const panel = shadow.getElementById('panel'), toggle = shadow.getElementById('toggle');
  const status = shadow.getElementById('status'), fallback = shadow.getElementById('fallback');
  const report = () => ({ schema: 1, tool: 'face-layout-20261026-v1', build: { sha: gate.sha, host: gate.host },
    styles, css: { keys: properties, values: computed }, starts, pendingSnapshots: pending, limits: { snapshots: 12, starts: 2, marks: 4 }, beforeStartCaptured: snapshots.some(s => s.kind === 'before-start'), snapshots });
  const stop = () => {
    stopped = true;
    observer.disconnect();
    start.removeEventListener('click', onStart, true);
    for (const t of timers) clearTimeout(t);
    for (const f of frames) cancelAnimationFrame(f);
    timers.clear(); frames.clear(); snapshots.length = 0;
    host.remove();
  };
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };
  const capture = (kind, requestedAt) => {
    if (stopped) return;
    if (!publicOnly()) return stop();
    if (snapshots.length >= 12) return;
    const vv = window.visualViewport;
    let settings = {};
    try { settings = video.srcObject?.getVideoTracks?.()[0]?.getSettings?.() || {}; } catch (_) {}
    // Batch reads after a rendering opportunity, then update only the isolated diagnostic UI.
    // No values/text from result labels, media pixels, track labels/IDs or session objects.
    const snapshot = { kind, requestedAt, at: elapsed(),
      viewport: { window: [innerWidth,innerHeight], document: [document.documentElement.clientWidth,document.documentElement.clientHeight],
        visual: vv ? [vv.width,vv.height,vv.offsetLeft,vv.offsetTop,vv.scale].map(round) : null,
        scroll: [scrollX,scrollY].map(round) },
      state: { lang: ['th','en','ja','th-TH','en-US','ja-JP'].includes(document.documentElement.lang) ? document.documentElement.lang : null, classes: allowedClasses.filter(c => document.body.classList.contains(c)),
        startup: ['ready','preparing'].includes(document.body.dataset.publicFaceStartup) ? document.body.dataset.publicFaceStartup : null },
      elements: Object.fromEntries(['html','body','video-container','video','canvas','dashboard','score-box','public-face-startup','no-face-banner']
        .map(id => [id, element(id === 'html' ? document.documentElement : id === 'body' ? document.body : document.getElementById(id))])),
      bodyPseudo: { before: element(document.body,'::before'), after: element(document.body,'::after') },
      video: { intrinsic: [video.videoWidth,video.videoHeight], readyState: video.readyState, paused: video.paused, ended: video.ended,
        track: { width: round(settings.width), height: round(settings.height), aspectRatio: Number.isFinite(settings.aspectRatio) ? Math.round(settings.aspectRatio * 10000) / 10000 : null } },
      ui: { expanded: !panel.hidden, r: element(host).r } };
    snapshots.push(snapshot);
    status.textContent = `${snapshots.length}/12 snapshots. ${kind}.`;
  };
  const schedule = (kind, delay = 0, onlyReady = false) => {
    if (stopped || snapshots.length + pending >= 12) return;
    pending++;
    const requestedAt = elapsed();
    later(() => {
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        // A task after rAF lets the preceding frame's layout/paint finish. No read inside Start.
        later(() => {
          pending--;
          if (onlyReady && !document.body.classList.contains('start-ready')) return;
          capture(kind, requestedAt);
        }, 0);
      });
      frames.add(frame);
    }, delay);
  };
  const onStart = () => {
    if (stopped || !publicOnly() || document.body.classList.contains('screening-active') || starts >= 2) return;
    starts++;
    // Passive listener: do not await, cancel, wrap or replace the real Start/audio/measurement handler.
    schedule('after-start', 0);
    schedule('after-start-250ms', 250);
    schedule('after-start-1000ms', 1000);
  };
  const update = () => {
    if (!publicOnly()) return stop();
    if (!beforeQueued && document.body.classList.contains('start-ready')) {
      beforeQueued = true;
      schedule('before-start', 0, true);
    }
    const result = document.body.classList.contains('result-visible');
    if (result && !resultWasVisible) schedule('after-result-visible');
    resultWasVisible = result;
    // Keep the collapsed control away from the accepted completion buttons.
    const top = result ? 'calc(80px + env(safe-area-inset-top))' : 'auto';
    const bottom = result ? 'auto' : 'calc(12px + env(safe-area-inset-bottom))';
    if (host.style.top !== top) host.style.top = top;
    if (host.style.bottom !== bottom) host.style.bottom = bottom;
  };
  const observer = new MutationObserver(update);
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  shadow.getElementById('mark').addEventListener('click', () => {
    if (marks++ < 4) schedule('bands-visible');
  });
  shadow.getElementById('copy').addEventListener('click', () => {
    if (!publicOnly()) return stop();
    const json = JSON.stringify(report());
    const manualCopy = () => { fallback.hidden = false; fallback.value = json; fallback.focus(); fallback.select();
      status.textContent = 'Clipboard unavailable. Select this JSON and copy manually.'; };
    if (!navigator.clipboard?.writeText) return manualCopy();
    navigator.clipboard.writeText(json).then(() => { status.textContent = 'Diagnostic JSON copied. No report uploaded.'; }, manualCopy);
  });
  document.body.appendChild(host);
  start.addEventListener('click', onStart, { capture: true, passive: true });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  update();
}
