/* Technical Demo V1: read-only, Dev/engineering-only, in-memory presentation.
 * dev=1 is NOT authentication. Demonstration UAT requires a protected Preview.
 * No acquisition, recognition, inference, storage, export or network APIs here.
 */
(function (global) {
  'use strict';
  function eligible() {
    return global.QuickStrokeDevMode?.isEnabled?.() === true &&
      global.QuickStrokeAppMode?.resolveMode?.() === 'dev' &&
      global.QuickStrokeAppMode?.getAnalysisRole?.() === 'engineering_only' &&
      !['public','research'].includes(global.QuickStrokeDataContract?.getSessionContext?.()?.appMode);
  }
  if (!eligible()) return;
  let face = null, faceAt = 0, transcript = '', speechAttempt = null, asrState = '', asrAttempt = null;
  let root, fields, toggle, read, module, timer, points = [], measureKey = '', origin = 0;
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const angle = value => finite(value) ? value.toFixed(1) + '°' : '—';
  const put = (node, value) => { const text=String(value); if(node.textContent!==text)node.textContent=text; };
  function faceSignal(value) {
    if (!eligible()) return;
    // Scalar allowlist only; no landmarks or frames retained.
    face = {yaw:value.yaw,pitch:value.pitch,roll:value.roll,asymmetry:value.asymmetry,aligned:value.aligned};
    faceAt = performance.now();
  }
  function faceLost() { face = null; }
  function speechResult(value) {
    if (!eligible() || !read || module !== 'speech') return;
    const state = read();
    if (speechAttempt !== state.attempt) { transcript = ''; speechAttempt = state.attempt; }
    transcript = typeof value === 'string' ? value : '';
  }
  function speechState(value) {
    if (!eligible() || !read || module !== 'speech') return;
    asrAttempt=read().attempt;asrState=value;
  }
  function field(label, key) {
    const cell=document.createElement('div'), name=document.createElement('span'), value=document.createElement('strong');
    cell.className='qs-tech-cell'; name.textContent=label;value.dataset.metric=key;value.textContent='—';
    cell.append(name,value);fields.append(cell);return value;
  }
  let values = {}, graph, graphLine, graphLabel;
  const movedControls=[];
  function disposeIfIneligible(){
    if(eligible())return;
    stop();
    for(const {button,parent,next} of movedControls)parent.insertBefore(button,next?.parentNode===parent?next:null);
    movedControls.length=0;
    root?.remove();document.getElementById('qs-technical-demo-style')?.remove();
    delete document.documentElement.dataset.technicalDemo;
    face=null;transcript='';asrState='';points=[];
  }
  function drawGraph() {
    if (!graphLine) return;
    const ceiling=Math.max(5,...points.map(p=>p.value));
    graphLine.setAttribute('points',points.map(p=>(8+Math.min(10,p.time)/10*284).toFixed(1)+','+(70-p.value/ceiling*60).toFixed(1)).join(' '));
    put(graphLabel,'Phone drift · 0–10 s · 0–'+ceiling.toFixed(1)+'°');
    graph.setAttribute('aria-label',graphLabel.textContent+'; '+points.length+' sampled readings');
  }
  function stop() { clearInterval(timer);timer=null; }
  function tick() {
    if (!eligible()) { disposeIfIneligible();return; }
    if (document.hidden) return;
    let s;try { s=read(); } catch (_) { return; } // Presentation cannot interrupt a measurement.
    if (module==='face') {
      const fresh=face && performance.now()-faceAt<1000 && s.camera && s.framePresent;
      for(const key of ['yaw','pitch','roll'])put(values[key],fresh?angle(face[key]):'—');
      put(values.asymmetry,fresh&&finite(face.asymmetry)?face.asymmetry.toFixed(2):'—');
      put(values.quality,!s.camera?'Camera unavailable':!s.model?'Preparing model':!fresh?'No current tracking':s.paused?'Tracking paused':face.aligned?'Aligned · technical':'Adjust pose · technical');
      placeFace();
    } else if (module==='arm') {
      const measuring=s.phase==='MEASURE', key=String(s.side)+':'+s.attempt;
      if (measuring && key!==measureKey) { points=[];measureKey=key;origin=performance.now(); }
      const fresh=measuring && finite(s.sampleAt) && s.sampleAt>0 && performance.now()-s.sampleAt<=s.freshMs;
      put(values.side,['left','right'].includes(s.side)?s.side.toUpperCase():'—');
      put(values.current,fresh?angle(s.current):'—');put(values.maximum,fresh?angle(s.maximum):'—');
      put(values.quality,s.reason?'Not ready · '+s.reason:!s.ready?'Waiting for sensor':measuring?(fresh?'Measuring':'Sensor stale'):'Ready');
      if (fresh&&finite(s.current)) {
        const time=Math.min(10,Math.max(0,performance.now()-origin)/1000);
        points.push({time,value:s.current});if(points.length>60)points.shift();drawGraph();
      }
      // No new points outside MEASURE. Last side trace remains visible, clearly sampled.
    } else {
      if (speechAttempt!==s.attempt || ['IDLE','CALIBRATING','READY_CUE','RETRYING'].includes(s.phase)) {transcript='';speechAttempt=s.attempt;}
      put(values.target,s.target||'—');put(values.transcript,transcript||'—');
      if(asrAttempt!==s.attempt)asrState='';
      put(values.mic,s.phase==='RECORDING'&&asrState==='Capturing audio'?'Browser audio active':s.mic);
      put(values.recognition,s.recognition==='Unavailable'||s.recognition.startsWith('Error:')?s.recognition:s.phase==='RECORDING'?asrState||s.recognition:s.recognition);
      put(values.match,s.phase==='DONE'&&transcript?s.match||'Unavailable':'Pending');
    }
  }
  // Face stays over an unused edge strip. Never resize/reparent the camera.
  // If instructions/controls/subject leave no space, collapse data rather than cover them.
  function placeFace() {
    if (!root || root.hidden) return;
    const protectedIds=['top-bar','face-status-row','progress-dots','dashboard','score-box','start-btn','reset-btn','no-face-banner','pose-warn-msg','smile-prompt','center-countdown','status-msg','btn-row'];
    const viewport=global.visualViewport, height=viewport?.height||innerHeight;
    const boxes=[...protectedIds.map(id=>document.getElementById(id)),...document.querySelectorAll('button')].filter(e=>e&&!root.contains(e)).filter(e=>{
      const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&Number(c.opacity)!==0;
    }).map(e=>e.getBoundingClientRect()).filter(b=>b.width&&b.height);
    // Keep the central face region clear even when alignment guides are hidden.
    boxes.push({top:height*.28,bottom:height*.74});
    const intervals=boxes.map(b=>[Math.max(8,b.top-8),Math.min(height-8,b.bottom+8)]).sort((a,b)=>a[0]-b[0]);
    let cursor=8,slots=[];for(const [a,b] of intervals){if(a>cursor)slots.push([cursor,a]);cursor=Math.max(cursor,b);}if(cursor<height-8)slots.push([cursor,height-8]);
    const need=root.getBoundingClientRect().height,slot=slots.find(([a,b])=>b-a>=need);
    if(slot){root.style.top=slot[0]+'px';root.style.visibility='visible';return;}
    // Automatic compact fallback; owner can reopen when the current instruction clears.
    if(!fields.hidden){fields.hidden=true;toggle.setAttribute('aria-expanded','false');put(toggle,'Show Technical Data');stop();}
    const small=slots.find(([a,b])=>b-a>=48);
    root.style.visibility=small?'visible':'hidden';if(small)root.style.top=small[0]+'px';
    if(!timer)timer=setInterval(tick,200); // only Dev; monitors safe availability, no engine interaction
  }
  function register(name, getter) {
    if (!eligible() || root || !['face','arm','speech'].includes(name)) return;
    module=name;read=getter;document.documentElement.dataset.technicalDemo=name;
    const style=document.createElement('style');style.id='qs-technical-demo-style';style.textContent=`
      #qs-technical-demo{--tech:#0D9488;box-sizing:border-box;width:100%;max-width:27rem;margin:8px auto;padding:10px;border:1px solid var(--tech);border-radius:16px;background:#102639;color:#fff;font:500 1rem/1.4 'Manrope','IBM Plex Sans Thai',sans-serif;flex:none;text-align:left;overflow-wrap:anywhere;z-index:90}
      html[data-technical-demo=face] #face-mesh-toggle{top:auto!important;right:auto!important;left:12px!important;bottom:calc(60px + env(safe-area-inset-bottom))!important;min-height:48px}
      html[data-technical-demo=face] #face-status-row,html[data-technical-demo=face] #progress-dots,html[data-technical-demo=face] #pose-hud{display:none!important}
      html[data-technical-demo=arm] #test-screen #mid,html[data-technical-demo=speech] #test-screen #mid{overflow-y:auto!important;justify-content:flex-start!important;min-height:0!important;padding-bottom:160px!important}
      html[data-technical-demo=arm] #test-screen.arm-guide-measuring #result-row,html[data-technical-demo=arm] #drift-wrap{display:none!important}
      html[data-technical-demo=arm] #test-screen.arm-guide-measuring #mid{padding-top:84px!important}
      html[data-technical-demo=arm] #test-screen #cd-wrap{position:static!important;inset:auto!important;transform:none!important;flex:none!important;margin:6px auto!important}
      #qs-technical-demo[data-module=arm] .qs-tech-fields{grid-template-columns:repeat(3,minmax(0,1fr))}
      #qs-technical-demo[data-module=arm] svg{height:64px}
      #qs-technical-demo *{box-sizing:border-box}#qs-technical-demo [hidden]{display:none!important}
      #qs-technical-demo button{min-width:48px;min-height:48px;width:100%;border:0;border-radius:10px;background:#18384e;color:#fff;font:inherit;font-weight:700;font-size:.875rem;padding:10px;text-align:left;cursor:pointer}
      #qs-technical-demo button:focus-visible{outline:3px solid #fff;outline-offset:3px}
      #qs-technical-demo .qs-tech-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
      #qs-technical-demo .qs-tech-cell{min-width:0}#qs-technical-demo .qs-tech-cell span{display:block;font-size:.75rem;color:#d3e5f1}
      #qs-technical-demo strong{display:block;font-size:1.375rem;line-height:1.25;font-variant-numeric:tabular-nums}
      #qs-technical-demo .qs-tech-wide{grid-column:1/-1}#qs-technical-demo .qs-tech-wide strong{font-size:1rem}
      #qs-technical-demo .qs-tech-secondary{margin-top:8px}#qs-technical-demo .qs-tech-secondary summary{min-height:48px;display:flex;align-items:center;cursor:pointer;font-size:.875rem}
      #qs-technical-demo .qs-tech-secondary button{position:static!important;inset:auto!important;width:100%!important;margin:6px 0!important;max-width:100%!important}
      #qs-technical-demo svg{display:block;width:100%;height:88px}#qs-technical-demo small{font-size:.75rem;display:block;color:#d3e5f1}
      #qs-technical-demo[data-module=arm]{--tech:#2563EB}#qs-technical-demo[data-module=speech]{--tech:#7C3AED}
      #qs-technical-demo[data-module=face]{position:fixed;left:8px;right:8px;width:calc(100% - 16px);margin:0 auto;padding:6px}
      #qs-technical-demo[data-module=face] .qs-tech-fields{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
      #qs-technical-demo[data-module=face] strong{font-size:1.125rem}#qs-technical-demo[data-module=face] .qs-tech-wide{grid-column:1/-1}
      #qs-technical-demo[data-module=face] .qs-tech-wide strong{font-size:.75rem}
      @media(prefers-reduced-motion:reduce){#qs-technical-demo *{transition:none!important;animation:none!important}}
    `;document.head.append(style);
    root=document.createElement('section');root.id='qs-technical-demo';root.dataset.module=name;root.lang='en';root.setAttribute('aria-label','Technical demonstration · not a diagnosis');
    toggle=document.createElement('button');toggle.type='button';toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-controls','qs-tech-fields');toggle.textContent='Hide Technical Data';
    fields=document.createElement('div');fields.id='qs-tech-fields';fields.className='qs-tech-fields';
    root.append(toggle,fields);
    if(name==='face') {
      for(const key of ['yaw','pitch','roll'])values[key]=field(key[0].toUpperCase()+key.slice(1)+' · 2D',key);
      values.asymmetry=field('Smile asymmetry¹','asymmetry');values.quality=field('Tracking · technical only','quality');values.quality.parentElement.className+=' qs-tech-wide';
      values.asymmetry.parentElement.firstChild.textContent='Smile ratio';
      values.asymmetry.title='Existing blendshape asymmetry ratio, not a diagnosis. Unavailable without smile evidence.';
      document.body.append(root);
    } else {
      const parent=document.querySelector('#test-screen #mid')||document.getElementById('mid');
      if(!parent){root=null;return;}if(name==='arm')parent.insertBefore(root,document.getElementById('cd-wrap'));else parent.append(root);
      if(name==='arm') {
        for(const [label,key]of [['Arm','side'],['Phone drift','current'],['Maximum drift','maximum'],['Sensor readiness','quality']])values[key]=field(label,key);
        values.quality.parentElement.className+=' qs-tech-wide';values.quality.style.fontSize='1rem';
        graph=document.createElementNS('http://www.w3.org/2000/svg','svg');graph.setAttribute('viewBox','0 0 300 80');graph.setAttribute('role','img');
        graphLine=document.createElementNS(graph.namespaceURI,'polyline');graphLine.setAttribute('fill','none');graphLine.setAttribute('stroke','#93c5fd');graphLine.setAttribute('stroke-width','2');graph.append(graphLine);
        const wrap=document.createElement('div');wrap.className='qs-tech-wide';graphLabel=document.createElement('small');graphLabel.textContent='Phone drift · waiting · 5 Hz display samples';wrap.append(graphLabel,graph);fields.append(wrap);
      } else {
        for(const [label,key]of [['Target phrase','target'],['Recognized speech · browser ASR','transcript'],['Microphone','mic'],['Recognition','recognition'],['Phrase match · not diagnosis','match']]){values[key]=field(label,key);if(['target','transcript','match'].includes(key))values[key].parentElement.className+=' qs-tech-wide';}
      }
    }
    if(name!=='face') {
      const secondary=document.createElement('details'),caption=document.createElement('summary');
      secondary.className='qs-tech-secondary';caption.textContent='Developer tools';secondary.append(caption);root.append(secondary);
      const collect=()=>{for(const id of ['arm-dev-toggle','mobile-dbg-toggle','quickstroke-audio-test']){const button=document.getElementById(id);if(button){movedControls.push({button,parent:button.parentNode,next:button.nextSibling});secondary.append(button);}}};
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',collect,{once:true});else collect();
    }
    toggle.addEventListener('click',()=>{fields.hidden=!fields.hidden;toggle.setAttribute('aria-expanded',String(!fields.hidden));put(toggle,fields.hidden?'Show Technical Data':'Hide Technical Data');stop();if(!fields.hidden){tick();if(!timer)timer=setInterval(tick,200);}else if(name==='face')timer=setInterval(tick,200);});
    tick();if(!timer)timer=setInterval(tick,200);
    global.addEventListener('quickstroke:dev-mode-change',disposeIfIneligible);
    global.addEventListener('quickstroke:app-mode-change',disposeIfIneligible);
    global.addEventListener('pagehide',()=>{stop();transcript='';face=null;points=[];}, {once:true});
    global.addEventListener('pageshow',()=>{if(eligible()&&!timer&&!fields.hidden){tick();if(!timer)timer=setInterval(tick,200);}});
  }
  global.QuickStrokeTechnicalDemo=Object.freeze({register,faceSignal,faceLost,speechResult,speechState});
})(window);
