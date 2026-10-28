// Temporary owner-only Preview diagnostic. No report storage or network transmission.
export const VERSION='face-cold-1';
export function parts(lines, limit=2800) {
  const out=[''];
  for(const line of lines){if(out[out.length-1].length+line.length+1>limit)out.push('');out[out.length-1]+=line+'\n';}
  return out;
}
export async function activate(a) {
  const query=new URLSearchParams(location.search);
  if(query.get('faceColdStartDebug')!=='1' || !['cold','warm'].includes(query.get('entry')) || !a.allowed()) return;
  let gate;
  try {
    const r=await fetch('/api/face-cold-debug-gate?faceColdStartDebug=1',{
      method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error'});
    if(!r.ok)return;gate=await r.json();
  }catch(_){return;}
  if(gate.schema!==1 || gate.preview!==true || gate.host!==location.hostname || !/^[a-f0-9]{40}$/.test(gate.sha) || !a.allowed())return;
  return install(a,{sha:gate.sha,entry:query.get('entry')});
}
function install(a,meta) {
  const preexisting=a.models().map(Boolean);
  const t0=performance.now(), events=[], snapshots=new Map(), durations=new Map(), restores=[];
  const measured=new WeakMap();let stopped=false,lastTick=null,lastState='',gapCount=0,maxGap=0,dropped=0,rafCount=0;
  const video=document.getElementById('video');
  const now=()=>Math.round(performance.now()-t0);
  const safe=fn=>{try{return fn();}catch(_){return undefined;}};
  const add=(key,value='')=>{if(stopped)return;if(events.length<48)events.push(`${now()}ms ${key}${value!==''?' '+value:''}`);else dropped++;};
  const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return ['x','y','width','height'].map(k=>Math.round(r[k]));};
  const readState=()=>{
    const s=a.state();
    const allowed=['BEFORE_START','RESTING_PHASE','ACTION_PHASE','ACTION_WAIT_SMILE','RETRYING','FACE_DONE','CRITICAL_ASYMMETRY','ABORTED'];
    const phase=allowed.includes(s.phase)?s.phase:'OTHER';
    const reasons=['BASELINE_INSUFFICIENT','NO_FACE_TIMEOUT','HAND_OCCLUSION','MOUTH_NOT_VISIBLE','NO_SMILE_DETECTED','SMILE_TOO_WEAK','INSUFFICIENT_VALID_FRAMES','UNABLE_TO_ASSESS','MODEL_LOAD_FAILED','HAND_MODEL_UNAVAILABLE','CAMERA_PERMISSION_DENIED','CAMERA_NOT_AVAILABLE','CAMERA_STREAM_FAILED','CAMERA_IN_USE','INSECURE_CONTEXT','I18N_LOAD_FAILED','STORAGE_WRITE_FAILED'];
    const invalid=s.invalid ? (reasons.includes(s.invalid)?s.invalid:'OTHER') : null;
    return {phase,countdown:Number.isFinite(s.countdown)?s.countdown:null,attempts:Math.max(0,Math.min(10,Number(s.attempts)||0)),invalid};
  };
  const state=()=>{
    const s=readState(), key=JSON.stringify(s);
    if(key!==lastState){lastState=key;add('state',`${s.phase} cd=${s.countdown??'-'} attempts=${s.attempts} invalid=${s.invalid||'-'}`);}
  };
  const snapshot=stage=>{
    if(stopped || snapshots.has(stage))return;
    const v=video, c=document.getElementById('video-container'), cs=v?getComputedStyle(v):null, vv=window.visualViewport;
    snapshots.set(stage,{t:now(),viewport:[innerWidth,innerHeight],visual:vv?[vv.width,vv.height,vv.offsetLeft,vv.offsetTop].map(Math.round):null,
      html:rect(document.documentElement),body:rect(document.body),container:rect(c),video:rect(v),intrinsic:[v?.videoWidth||0,v?.videoHeight||0],
      startup:document.body.dataset.publicFaceStartup||'none',css:cs?[cs.position,cs.objectFit,cs.objectPosition,cs.transform,cs.overflow]:null,state:readState().phase});
  };
  const opportunity=(key,stage)=>{
    if(rafCount>=12 || stopped)return;rafCount++;
    requestAnimationFrame(()=>safe(()=>{if(stopped)return;add('render-opportunity',key);if(stage)snapshot(stage);}));
  };
  const once=(object,key,label)=>{
    if(!object || typeof object[key]!=='function')return;
    let keys=measured.get(object);if(!keys){keys=new Set();measured.set(object,keys);}if(keys.has(key))return;keys.add(key);
    const original=object[key];let first=true;
    const wrapped=function(...args){if(!first)return original.apply(this,args);first=false;safe(()=>{if(object[key]===wrapped)object[key]=original;});
      const t=performance.now();try{return original.apply(this,args);}finally{safe(()=>{durations.set(label,Math.round((performance.now()-t)*10)/10);});}};
    try{object[key]=wrapped;if(object[key]!==wrapped){add('timing-unavailable',label);return;}
      restores.push(()=>{if(object[key]===wrapped)object[key]=original;});
    }catch(_){add('timing-unavailable',label);}
  };
  const wrap=(name,before,after)=>restores.push(a.wrap(name,original=>function(...args){
    safe(()=>{if(!a.allowed())stop();if(!stopped)before?.(args);});
    try{return original.apply(this,args);}finally{safe(()=>{if(!stopped)after?.(args);});}
  }));
  function stop(){if(stopped)return;stopped=true;for(const undo of restores.reverse())safe(undo);panel?.remove();}
  wrap('detectLoop',()=>{
    if(performance.now()-t0>180000){stop();return;}
    const t=performance.now();if(lastTick!==null){const gap=t-lastTick;maxGap=Math.max(maxGap,gap);if(gap>750 && gapCount++<8)add('animation-frame-gap',Math.round(gap)+'ms');}lastTick=t;
    const [face,hand]=a.models();once(face,'detectForVideo','firstFaceMs');once(hand,'detectForVideo','firstHandMs');

  },state);
  // Measure only the first mouth readback, even when its canvas is created lazily.
  // Scoped synchronous prototype wrappers are restored before the call returns.
  let pixelObserved=false;
  restores.push(a.wrap('getMouthVisibility', original=>function(...args){
    if(pixelObserved || stopped)return original.apply(this,args);pixelObserved=true;
    const proto=globalThis.CanvasRenderingContext2D?.prototype, saved=[];
    if(!proto)return original.apply(this,args);
    for(const [key,label] of [['drawImage','firstPixelDrawMs'],['getImageData','firstPixelReadMs']]){
      safe(()=>{const fn=proto[key];const timed=function(...values){
        if(this!==a.pixels())return fn.apply(this,values);
        const t=performance.now();try{return fn.apply(this,values);}finally{safe(()=>durations.set(label,Math.round((performance.now()-t)*10)/10));}
      };proto[key]=timed;saved.push(()=>{if(proto[key]===timed)proto[key]=fn;});});
    }
    try{return original.apply(this,args);}finally{for(const undo of saved)safe(undo);}
  }));
  wrap('startScreening' ,()=>add('start-handler'),()=>{state();opportunity('start','start');});
  wrap('startActionPhase',()=>add('smile-transition'),()=>{state();opportunity('smile','smile');});
  wrap('onResults',null,state);
  let lastInstruction='';
  const instruction=(kind,args)=>{const key=a.instructionKey(args[0]);if(key===lastInstruction+'')return;lastInstruction=key;add(kind,key);opportunity(key);};
  wrap('showSmilePrompt',null,args=>instruction('instruction-dom',args));
  wrap('showStatusPanel',null,args=>instruction('instruction-dom',args));
  wrap('speakFace',args=>add('voice-request',a.instructionKey(args[0])));
  wrap('reportFaceTts',args=>{const status={TTS_PLAYBACK_STARTED:'started',TTS_ERROR:'error',TTS_NO_START:'no-start',TTS_UNAVAILABLE:'unavailable'}[args[0]];if(status)add('tts-event',status);});
  wrap('showCenterCountdown',null,()=>state());
  const onVideo=e=>{add('video-event',e.type);};
  const visibility=()=>add('visibility',document.visibilityState==='visible'?'visible':'hidden');
  document.addEventListener('visibilitychange',visibility);restores.push(()=>document.removeEventListener('visibilitychange',visibility));
  for(const name of ['loadedmetadata','loadeddata','playing','waiting','stalled','resize','pause','error']){
    video?.addEventListener(name,onVideo);restores.push(()=>video?.removeEventListener(name,onVideo));
  }
  const onStartup=()=>safe(()=>{
    const stage=document.body.dataset.publicFaceStartup;
    if(stage==='preparing'||stage==='ready')opportunity(stage,stage);
  });
  const observer=new MutationObserver(onStartup);observer.observe(document.body,{attributes:true,attributeFilter:['data-public-face-startup']});restores.push(()=>observer.disconnect());
  add('attached',readState().phase);onStartup();state();
  const panel=document.createElement('details');panel.id='face-cold-diagnostic';
  panel.style.cssText='position:fixed;left:8px;bottom:8px;z-index:10000;max-width:calc(100vw - 16px);max-height:30dvh;overflow:auto;background:#102536;color:white;border:1px solid white;border-radius:12px;padding:4px;font:14px/1.5 sans-serif';
  const title=document.createElement('summary');title.textContent='Owner diagnostics';title.style.cssText='min-height:48px;display:list-item;padding:12px';panel.appendChild(title);
  const note=document.createElement('p');note.textContent='Render opportunity ≠ visible paint. No camera content collected.';panel.appendChild(note);
  const fallback=document.createElement('textarea');fallback.hidden=true;fallback.readOnly=true;fallback.setAttribute('aria-label','Diagnostic summary for manual copy');fallback.style.cssText='width:100%;min-height:100px';panel.appendChild(fallback);
  const summary=()=>{
    const lines=[`QuickStroke ${VERSION} entry=${meta.entry}`,`SHA ${meta.sha}`,'Times since attachment; inference = first OBSERVED (earlier work unknown). Rectangles x,y,w,h. rAF is NOT proof of paint.'];
    for(const stage of ['preparing','ready','start','smile']){
      const s=snapshots.get(stage);if(!s){lines.push(`${stage}: MISSING (not observed after authorization)`);continue;}
      lines.push(`${stage} @${s.t}ms ${s.state} startup=${s.startup} viewport=${s.viewport} visual=${s.visual}`,`html=${s.html} body=${s.body} container=${s.container} video=${s.video}`,`intrinsic=${s.intrinsic} css(position,fit,object-position,transform,overflow)=${s.css}`);
    }
    lines.push(`Models already present at attachment: face=${preexisting[0]} hand=${preexisting[1]}; first-page inference may be missing.`);
    for(const key of ['firstFaceMs','firstHandMs','firstPixelDrawMs','firstPixelReadMs'])lines.push(`${key}=${durations.get(key)??'MISSING'}`);
    lines.push(`Final observed state: ${lastState}; voice-request does not prove playback.`);
    lines.push(`max rAF gap=${Math.round(maxGap)}ms; significant gaps=${gapCount}; omitted events=${dropped}`,...events);
    return parts(lines);
  };
  const buttons=[];
  const copy=async index=>{
    const chunks=summary();buttons[1].hidden=chunks.length<2;buttons[2].hidden=chunks.length<3;
    const text=chunks[index];if(!text)return;
    try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);}
    catch(_){fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();}
  };
  for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.textContent=i?'Copy Summary Part '+(i+1):'Copy Summary';b.hidden=i>0;b.style.cssText='min-width:48px;min-height:48px;padding:8px';b.onclick=()=>{void copy(i);};buttons.push(b);panel.appendChild(b);}
  document.body.appendChild(panel);
  const exit=()=>stop();window.addEventListener('pagehide',exit,{once:true});restores.push(()=>window.removeEventListener('pagehide',exit));
  // No persistence; the page lifecycle releases hooks and in-memory observations.
}
