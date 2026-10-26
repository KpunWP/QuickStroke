// Pure formatter: existing report data only. No DOM reads, sampling, I/O or state changes.
export function buildFaceLayoutSummary(report) {
  const knownClasses = ['start-ready','screening-active','result-visible','notice-status','notice-pose',
    'notice-smile','pose-warning-visible','smile-prompt-visible'];
  const num = x => typeof x === 'number' && Number.isFinite(x) ? String(Math.round(x * 10) / 10) : '?';
  const list = (a, n) => Array.isArray(a) ? a.slice(0,n).map(num).join(',') : '?';
  const rect = e => e?.r?.length === 4 ? '[' + list(e.r,4) + ']' : 'MISSING';
  const css = e => {
    const values = report.css?.values?.[e?.cs] || [];
    return Object.fromEntries((report.css?.keys || []).map((key,i) => [key,values[i]]));
  };
  const enumValue = (value, allowed) => allowed.includes(value) ? value : '?';
  const color = value => typeof value === 'string' && value.length <= 64 &&
    (value === 'transparent' || /^rgba?\([\d.,% /]+\)$/.test(value) || /^color\((?:srgb|display-p3) [\d.% /+-]+\)$/.test(value)) ? value : '?';
  const position = value => typeof value === 'string' && value.length <= 48 &&
    /^[\d.%+ -]+$/.test(value) ? value : '?';
  const layoutCSS = snapshot => {
    const c=css(snapshot.elements?.['video-container']),v=css(snapshot.elements?.video);
    const pos=['static','relative','absolute','fixed','sticky'], over=['visible','hidden','clip','scroll','auto','overlay'];
    return `container position=${enumValue(c.position,pos)}; video position=${enumValue(v.position,pos)}; fit=${enumValue(v['object-fit'],['cover','contain','fill','none','scale-down'])}; object-position=${position(v['object-position'])}; overflow container=${enumValue(c['overflow-x'],over)}/${enumValue(c['overflow-y'],over)}, video=${enumValue(v['overflow-x'],over)}/${enumValue(v['overflow-y'],over)}; background container=${color(c['background-color'])}, video=${color(v['background-color'])}`;
  };
  const intersects = (a,b) => a?.length===4 && b?.length===4 && a.every(Number.isFinite) && b.every(Number.isFinite) &&
    a[2]>0 && a[3]>0 && b[2]>0 && b[3]>0 && Math.min(a[0]+a[2],b[0]+b[2])>Math.max(a[0],b[0]) && Math.min(a[1]+a[3],b[1]+b[3])>Math.max(a[1],b[1]);
  const layers = snapshot => {
    const names={'canvas':'canvas (pixels unknown)','dashboard':'instruction area (child paint unknown)',
      'score-box':'result panel','public-face-startup':'startup bubble','no-face-banner':'no-face banner'};
    const result=[];
    for(const [id,name] of Object.entries(names)) {
      const e=snapshot.elements?.[id],s=css(e);
      if(e && intersects(e.r,snapshot.elements?.video?.r) && s.display!=='none' && s.visibility!=='hidden' && s.opacity!=='0')result.push(name);
    }
    if(intersects(snapshot.ui?.r,snapshot.elements?.video?.r))result.push(`diagnostic control (${snapshot.ui?.expanded?'expanded':'collapsed'})`);
    if(snapshot.bodyPseudo?.before?.contentPresent)result.push('body::before (rect unknown)');
    if(snapshot.bodyPseudo?.after?.contentPresent)result.push('body::after (rect unknown)');
    return result.length ? result.join(', ') : 'none recorded';
  };
  const snapshots=Array.isArray(report.snapshots)?report.snapshots:[];
  const first=kind=>snapshots.find(s=>s.kind===kind);
  const last=kind=>snapshots.filter(s=>s.kind===kind).at(-1);
  const stages=[['Before Start',first('before-start')],['After Start',first('after-start')],
    ['After Start ~250ms',first('after-start-250ms')],['After Start ~1s',first('after-start-1000ms')],
    ['Bands visible (latest)',last('bands-visible')],['Completion/result (latest)',last('after-result-visible')]];
  let previous=null;
  const blocks=stages.map(([label,snapshot])=>{
    if(!snapshot)return `${label}: MISSING${label.startsWith('Bands')?' — use Mark black bands visible.':'.'}`;
    const vv=snapshot.viewport?.visual,e=snapshot.elements||{},track=snapshot.video?.track;
    const classes=knownClasses.filter(c=>snapshot.state?.classes?.includes(c));
    const priorClasses=knownClasses.filter(c=>previous?.state?.classes?.includes(c));
    const added=classes.filter(c=>!priorClasses.includes(c)),removed=priorClasses.filter(c=>!classes.includes(c));
    const state=previous ? (added.length||removed.length ? `added ${added.join(',')||'none'}; removed ${removed.join(',')||'none'}` : 'classes unchanged') : (classes.join(',')||'no listed classes');
    const currentCSS=layoutCSS(snapshot),currentLayers=layers(snapshot);
    const lines=[`${label} @${num(snapshot.at)}ms:`,
      `visualViewport=${vv?.length>=5?`${num(vv[0])}x${num(vv[1])} offset(${num(vv[2])},${num(vv[3])}) scale ${num(vv[4])}`:'MISSING'}; body=${rect(e.body)}`,
      `container=${rect(e['video-container'])}; video=${rect(e.video)}; intrinsic=${num(snapshot.video?.intrinsic?.[0])}x${num(snapshot.video?.intrinsic?.[1])}; track=${num(track?.width)}x${num(track?.height)}`,
      `CSS: ${previous&&currentCSS===layoutCSS(previous)?'unchanged from previous available stage':currentCSS}`,
      `State: ${state}; startup=${enumValue(snapshot.state?.startup,['ready','preparing'])}; lang=${enumValue(snapshot.state?.lang,['th','en','ja','th-TH','en-US','ja-JP'])}.`,
      `Over-video candidates: ${previous&&currentLayers===layers(previous)?'same as previous available stage':currentLayers}.`];
    previous=snapshot;
    return lines.join('\n');
  });
  const sha=/^[a-f0-9]{40}$/.test(report.build?.sha||'')?report.build.sha:'unavailable';
  const tool=/^face-layout-\d{8}-v\d{1,3}$/.test(report.tool||'')?report.tool:'unavailable';
  const header=`QuickStroke Face Layout Summary v1\nSHA ${sha}; diagnostic ${tool}\nRects=[x,y,width,height] CSS px; intrinsic=width x height; ?=unavailable. Times from tool enable. Pending snapshots=${num(report.pendingSnapshots)}.\n`;
  const note='\nAfter-Start samples use the first click; bands/result use latest. Candidates are not proof of occlusion. No pixels sampled.';
  const whole=header+'\n'+blocks.join('\n\n')+note;
  if(whole.length<=3000)return [whole];
  // All six stages remain present. Split whole stage blocks, never trim their text.
  const midpoint=3;
  return [header+'Part 1/2\n\n'+blocks.slice(0,midpoint).join('\n\n')+note,
    header+'Part 2/2\n\n'+blocks.slice(midpoint).join('\n\n')+note];
}

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
    section[hidden],textarea[hidden],button[hidden]{display:none} p{font-size:13px;margin:6px 0} nav{display:grid;gap:6px}
    textarea{box-sizing:border-box;width:100%;height:90px;font:12px/1.4 monospace}
  </style><button type="button" id="toggle" aria-expanded="false" aria-controls="panel">Layout</button>
  <section id="panel" hidden aria-label="Face layout diagnostics">
    <p>Preview diagnostics. Collapse before Start. Copy after completion.</p>
    <nav><button type="button" id="mark">Mark black bands visible</button><button type="button" id="copy">Copy diagnostic report</button><button type="button" id="summary">Copy Summary</button><button type="button" id="summary-next" hidden>Copy Summary Part 2</button></nav>
    <p id="status" aria-live="off">Preparing bounded snapshots…</p>
    <textarea id="fallback" readonly inputmode="none" aria-label="Diagnostic JSON — select and copy" hidden></textarea><textarea id="summary-fallback" readonly inputmode="none" aria-label="Diagnostic summary — select and copy" hidden></textarea>
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
  let summaryParts = [], nextSummaryPart = 1;
  const nextButton = shadow.getElementById('summary-next');
  const copySummaryPart = index => {
    if (!publicOnly()) return stop();
    const text = summaryParts[index];
    const label = `Summary part ${index + 1}/${summaryParts.length}`;
    const manualCopy = () => {
      const field = shadow.getElementById('summary-fallback');
      field.hidden = false; field.value = text; field.focus(); field.select();
      status.textContent = `${label}: select and copy the text manually.`;
    };
    if (!navigator.clipboard?.writeText) return manualCopy();
    navigator.clipboard.writeText(text).then(() => {
      status.textContent = `${label} copied.${summaryParts.length > 1 ? ' Copy both parts.' : ''}`;
    }, manualCopy);
  };
  shadow.getElementById('summary').addEventListener('click', () => {
    if (!publicOnly()) return stop();
    summaryParts = buildFaceLayoutSummary(report());
    nextSummaryPart = 1;
    nextButton.hidden = summaryParts.length < 2;
    copySummaryPart(0);
  });
  nextButton.addEventListener('click', () => {
    copySummaryPart(nextSummaryPart);
  });
  document.body.appendChild(host);
  start.addEventListener('click', onStart, { capture: true, passive: true });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  update();
}
