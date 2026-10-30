/* Temporary owner-enabled diagnostic. No capture, transcript, storage or upload. */
(function (global) {
  'use strict';
  const eligible = () => global.QuickStrokeDevMode?.isEnabled?.() === true &&
    global.QuickStrokeAppMode?.resolveMode?.() === 'dev' &&
    global.QuickStrokeAppMode?.getAnalysisRole?.() === 'engineering_only' &&
    global.QuickStrokeDataContract?.getSessionContext?.()?.appMode === 'dev';
  if (!eligible() || !/iPhone|iPad|iPod/.test(navigator.userAgent) ||
      new URLSearchParams(location.search).get('speechRetryDebug') !== '1') return;
  const codes = new Set(('DEAD_MIC_DETECTED DEAD_MIC_RECOVERY_FAILED MICROPHONE_PERMISSION_DENIED MICROPHONE_NOT_FOUND MICROPHONE_IN_USE MICROPHONE_STREAM_FAILED MICROPHONE_START_FAILED WEB_AUDIO_UNAVAILABLE VOICE_NOT_RECOGNIZED NO_VOICE USER_START USER_RETRY STEP_BEGIN STEP_OK STEP_TIMEOUT STEP_ERROR START_ERROR ASR_RESULT ASR_ENDED RELEASE_FULL RELEASE_KEEP RELEASED_FULL RELEASED_KEEP IOS_STANDARD_CAPTURE_ACTIVE IOS_ASR_ONLY_TRIAL_ENABLED IOS_REUSE_PROBE_STARTED IOS_REUSE_PROBE_STABLE IOS_REUSE_PROBE_UNSTABLE IOS_REUSE_PIPELINE_ACCEPTED IOS_REUSE_PIPELINE_REJECTED MIC_PIPELINE_READY MIC_PREPARATION_TIMEOUT MIC_PREPARATION_FAILED IOS_CALIBRATION_DIGITAL_SILENCE IOS_RETRY_CAPTURE_START_FAILED ASR_ENGINE_STARTED ASR_AUDIO_STARTED ASR_AUDIO_CAPTURE ASR_NO_TRANSCRIPT ASR_START_RETRY_EXHAUSTED ASR_UNAVAILABLE ASR_NO_SPEECH ASR_PERMISSION_OR_SERVICE_DENIED ASR_NETWORK ASR_LANGUAGE_OR_GRAMMAR ASR_ABORTED ASR_OTHER_ERROR IOS_ASR_SHUTDOWN_STARTED IOS_ASR_SHUTDOWN_FINISHED IOS_ASR_SHUTDOWN_TIMEOUT').split(' '));
  const stages = new Set('capture public_retry_gesture_capture acquire_microphone get_user_media get_user_media_retry audio_context_resume audio_context_running public_post_tts_capture public_post_tts_context_resume'.split(' '));
  const errors = new Set('NotAllowedError SecurityError NotFoundError DevicesNotFoundError NotReadableError TrackStartError SpeechMicTimeoutError AbortError InvalidStateError NotSupportedError Error unknown'.split(' '));
  const phases = new Set('IDLE CALIBRATING READY_CUE RECORDING RETRYING DONE'.split(' '));
  let closed=false, live=false, rows=[], dropped=0, panel, output, sha='', start=0;
  function clear() { closed=true;live=false;rows=[];dropped=0;if(output)output.value='';panel?.remove();panel=null;output=null;sha=''; }
  global.addEventListener('pagehide',clear,{once:true});
  for (const event of ['quickstroke:dev-mode-change','quickstroke:app-mode-change'])
    global.addEventListener(event,()=>{if(!eligible())clear();});
  function record(code, value={}) {
    if(!live || !eligible()){if(live)clear();return;}
    if(!codes.has(code))return;
    const [stage,error]=String(value.detail || '').split(':');
    const detail=stages.has(stage) ? stage+(errors.has(error)?':'+error:'') : '';
    const row={ms:Math.round(performance.now()-start),code,
      phase:phases.has(value.phase)?value.phase:'unknown',
      context:['running','suspended','closed','interrupted','none'].includes(value.context)?value.context:'unknown',
      track:['live','ended','none'].includes(value.track)?value.track:'unknown',
      muted:value.muted===true, recognition:value.recognition===true, requested:value.requested===true, detail};
    if(rows.length===160){rows.shift();dropped++;}rows.push(row);
  }
  function summary(){
    if(!live||!eligible()){clear();return '';}
    return 'Speech Retry stages v1\nSHA '+sha+'\nBounded events '+rows.length+'; dropped '+dropped+'\n'+
      rows.map(r=>r.ms+'ms '+r.code+' '+r.phase+' ctx='+r.context+' track='+r.track+(r.muted?' muted':'')+' ASR='+Number(r.recognition)+' requested='+Number(r.requested)+(r.detail?' '+r.detail:'')).join('\n');
  }
  global.QuickStrokeSpeechRetryDiagnostic=Object.freeze({active:()=>live&&eligible(),record});
  // Empty authorization POST only. No diagnostic data leaves memory.
  global.fetch('/api/speech-retry-debug-gate?speechRetryDebug=1',{method:'POST',cache:'no-store',credentials:'same-origin'})
    .then(r=>r.ok?r.json():null).then(meta=>{
      if(closed || !eligible() || !meta?.eligible || !/^[a-f0-9]{40}$/.test(meta.sha))return;
      sha=meta.sha;start=performance.now();live=true;
      panel=document.createElement('details');panel.id='qs-speech-retry-diagnostic';
      const title=document.createElement('summary');title.textContent='Speech Retry diagnostics · ready';
      const button=document.createElement('button');button.type='button';button.textContent='Copy stage summary';button.style.minHeight='48px';
      output=document.createElement('textarea');output.readOnly=true;output.hidden=true;output.setAttribute('aria-label','Local diagnostic summary');output.style.cssText='width:100%;min-height:180px;box-sizing:border-box';
      button.onclick=async()=>{
        const text=summary();if(!text)return;
        // Selectable fallback stays available even when clipboard permission fails.
        output.value=text;output.hidden=false;output.focus();output.select();
        try{await navigator.clipboard.writeText(text);}catch(_){}
      };
      panel.append(title,button,output);
      const host=document.getElementById('qs-technical-demo');
      if(!host){clear();return;}host.append(panel);
    }).catch(()=>{}); // Fail closed; do not affect the module.
})(window);
