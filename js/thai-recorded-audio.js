/* QuickStroke Thai recorded audio A/B: opt-in, no clinical/measurement changes. */
(function () {
  'use strict';
  const KEY='quickstroke_audio_ab';
  const ANDROID_ROUTE_KEY='quickstroke_android_th_audio_route_v1';
  let androidAutoRoute=null;
  const q=new URLSearchParams(location.search).get('audio');
  if(q==='tts'||q==='recorded') {
    try { sessionStorage.setItem(KEY,q); } catch(_) {}
  }
  let mode='auto';
  try { mode=['recorded','tts'].includes(sessionStorage.getItem(KEY)) ? sessionStorage.getItem(KEY) : 'auto'; } catch(_) {}
  const manifest={
    'หน้าตรงและอยู่นิ่ง':'face_01_rest.mp3',
    'ยิ้มกว้าง':'face_02_smile.mp3',
    'ถือโทรศัพท์ด้วยมือซ้ายตามภาพ แล้วกดยืนยันเพื่อเริ่มทดสอบ':'arm_12_left_start.mp3',
    'เหยียดแขนซ้ายไปข้างหน้าตามภาพ และถือนิ่งๆ':'arm_01_left.mp3',
    'เหยียดแขนขวาไปข้างหน้าตามภาพ และถือนิ่งๆ':'arm_06_right.mp3',
    'เริ่มทดสอบ หลับตา และถือนิ่งๆ':'arm_02_start.mp3',
    'ดีมาก':'arm_03_good.mp3',
    'เกือบเสร็จแล้ว':'arm_04_almost.mp3',
    'ลดแขนลง':'arm_05_lower.mp3',
    'ถือนิ่งๆ':'arm_07_still.mp3',
    'ข้อมือขยับ เหยียดข้อมือให้ตรงแล้วลองอีกครั้ง':'arm_08_wrist.mp3',
    'การเคลื่อนไหวไม่ชัด ลองอีกครั้ง':'arm_09_retry.mp3',
    'แขนทั้งสองข้างปกติ':'arm_10_complete.mp3',
    'อาจพบแขนตก หากสงสัยสโตรก โทร 1669 ทันที':'arm_11_alert.mp3',
    'เตรียมพูด รอจนหน้าจอแสดงว่าเริ่มพูดได้':'speech_01_prepare.mp3',
    'เตรียมพูดตามข้อความบนหน้าจอ รอจนขึ้นว่าเริ่มพูดได้':'speech_02_instruction.mp3',
    'เตรียมพูด':'speech_03_prepare_short.mp3',
    '3':'speech_04_count_three.mp3',
    '2':'speech_05_count_two.mp3',
    '1':'speech_06_count_one.mp3',
    'ทดสอบการพูดเสร็จแล้ว':'speech_07_module_complete.mp3',
    'จบการทดสอบ ขอบคุณค่ะ':'result_01_thanks.mp3'
  };
  const alias={'เตรียมพูด รอเสียงสัญญาณก่อนเริ่มพูด':'เตรียมพูด รอจนหน้าจอแสดงว่าเริ่มพูดได้',
    'ข้อมือขยับ เหยียดข้อมือให้ตรงแล้วลองอีกครั้ง':'ข้อมือขยับ เหยียดข้อมือให้ตรงแล้วลองอีกครั้ง'};
  const norm=s=>String(s||'').replace(/[\u200b\u200c\u200d]/g,'').replace(/\s+/g,'').replace(/[.,，。!?ฯ]/g,'').replace(/ๆ/g,'ๆ');
  const lookup=new Map(Object.entries(manifest).map(([s,f])=>[norm(s),f]));
  // Consent warm-up: cache every required Thai prompt before the first module.
  // A completed fetch is verified as audio bytes, not merely preload='auto'.
  const AUDIO_CACHE='quickstroke-jssf-th-audio-v2';
  const REQUIRED_FILES=[...new Set(Object.values(manifest))];
  let preparePromise=null;
  function shouldPrepare() {
    // The consented Android JSSF Speech protocol always plays the five
    // bundled recordings, even if this device has Thai TTS for Face/Arm.
    // Preload them BEFORE the first participant action to avoid muted cues.
    if (/Android/i.test(navigator.userAgent||'') && /\/jssf-consent\.html$/.test(location.pathname||'')) return true;
    if(mode==='tts') return false;
    if(mode==='recorded') return true;
    return /Android/i.test(navigator.userAgent||'') && use('th-TH');
  }
  async function prepareAll(onProgress) {
    if(!shouldPrepare()) return {ready:true,total:0,done:0,skipped:true};
    if(preparePromise) return preparePromise;
    preparePromise=(async()=>{
      if(!('caches' in window)) throw new Error('Browser audio cache unavailable');
      const cache=await caches.open(AUDIO_CACHE);
      let done=0;
      for(const file of REQUIRED_FILES){
        const url=new URL('./audio/th/'+file,document.baseURI).href;
        let response=await cache.match(url);
        if(!response?.ok || !(await response.clone().arrayBuffer()).byteLength) {
          const fresh=await fetch(url,{cache:'no-store'});
          if(!fresh.ok || !(fresh.headers.get('content-type')||'').includes('audio/')) throw new Error('Audio HTTP error: '+file);
          const bytes=await fresh.clone().arrayBuffer();
          if(bytes.byteLength<1000) throw new Error('Audio file incomplete: '+file);
          await cache.put(url,fresh);
          response=await cache.match(url);
        }
        done++;
        onProgress?.(done,REQUIRED_FILES.length);
      }
      return {ready:true,total:REQUIRED_FILES.length,done};
    })();
    try { return await preparePromise; }
    catch(error){preparePromise=null;throw error;}
  }
  let player=null, active=null, token=0, unlocked=false;
  function use(lang) {
    if (!String(lang||'th').toLowerCase().startsWith('th')) return false;
    // Apply the research pilot's platform-specific preference without altering
    // legacy Public or Dev A/B preferences. MP3 playback remains a fallback
    // capability on iOS, independently of this primary-route decision.
    const ctx=window.QuickStrokeDataContract?.getSessionContext?.();
    const consentedJssf=ctx?.appMode==='research' &&
      ctx?.researchMetadata?.researchProfile==='community_remote_qr' &&
      ctx?.researchMetadata?.consentStatus==='consented';
    if (consentedJssf) {
      if (/Android/i.test(navigator.userAgent||'')) return true;
      if (/iPad|iPhone|iPod/i.test(navigator.userAgent||'')) return false;
    }
    if(mode==='recorded') return true;
    if(mode==='tts') return false;
    const ua=String(navigator.userAgent||'');
    // getVoices() is asynchronous on Android. Choose the route only once per
    // tab/session; otherwise the opening Arm MP3 can turn into a different TTS
    // voice when the Thai voice list arrives a few seconds later.
    if (/Android/i.test(ua)) {
      if(androidAutoRoute===null){
        try { androidAutoRoute=sessionStorage.getItem(ANDROID_ROUTE_KEY); } catch (_) {}
        if(androidAutoRoute!=='tts' && androidAutoRoute!=='recorded'){
          const voices=window.speechSynthesis?.getVoices?.() || [];
          const hasThaiVoice=voices.some(v=>String(v?.lang||'').toLowerCase().replace('_','-').startsWith('th'));
          androidAutoRoute=ua.includes('SamsungBrowser/') || !hasThaiVoice ? 'recorded' : 'tts';
          try { sessionStorage.setItem(ANDROID_ROUTE_KEY,androidAutoRoute); } catch (_) {}
        }
      }
      return androidAutoRoute==='recorded';
    }
    // iOS Safari delivers getVoices() asynchronously. Preserve native TTS.
    if (/iPad|iPhone|iPod/i.test(ua)) return false;
    const voices=window.speechSynthesis?.getVoices?.() || [];
    return !voices.some(v=>String(v?.lang||'').toLowerCase().replace('_','-').startsWith('th'));
  }
  function fileFor(text) { return lookup.get(norm(alias[text]||text))||null; }
  function stop() {
    token++;
    const previous=active;
    active=null;
    if(previous) previous('cancelled');
    if(player) {
      try { player.pause();player.removeAttribute('src'); } catch(_) {}
      player=null;
    }
  }
  function unlock() {
    if(unlocked) return;
    unlocked=true;
    // A soundless primer is not an audible playback authorization.
    // The Consent voice check is initiated directly by the participant.
  }
  document.addEventListener('pointerdown',unlock,{capture:true,once:true});
  document.addEventListener('touchstart',unlock,{capture:true,once:true});
  function play(text,{onDone,timeoutMs=13000}={}) {
    const file=fileFor(text);
    if(!file) {onDone?.('missing');return Promise.resolve('missing');}
    stop();const my=token;
    // Create a new media element for each prompt. Reusing a media element
    // across MP3 src changes can trigger an asynchronous media error on Android.
    const current=new Audio();
    player=current;
    current.preload='auto';current.muted=false;current.volume=1;current.playbackRate=1;
    const url=new URL('./audio/th/'+file,document.baseURI);
    current.src=url.href;
    const module=file.startsWith('face_')?'face':file.startsWith('arm_')?'arm':file.startsWith('speech_')?'speech':null;
    const report=(status,reason)=>{
      if(!module) return;
      const remote=window.QuickStrokeJssfRemote;
      if(remote?.canSync?.()!==true)return;
      const code=status==='ended'?'TTS_PLAYBACK_STARTED':status==='timeout'?'TTS_NO_START':'TTS_ERROR';
      void remote.queueTtsTelemetry?.(module,code,'prompt',status,'th-TH',reason,'recorded-'+file+'-'+status,'recorded_audio','th-TH')?.catch?.(()=>{});
    };
    return new Promise(resolve=>{
      let settled=false;
      let timer=null;
      const finish=(status,reason)=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        current.removeEventListener('ended',ended);
        current.removeEventListener('error',failed);
        if(my===token){active=null;if(status!=='ended')try{current.pause();}catch(_){}}
        if(status!=='cancelled')report(status,reason);
        onDone?.(status);resolve(status);
      };
      const ended=()=>finish('ended');
      const failed=()=>finish('error',String(current.error?.code||'media_error'));
      active=finish;
      current.addEventListener('ended',ended);
      current.addEventListener('error',failed);
      timer=setTimeout(()=>finish('timeout','time_limit'),timeoutMs);
      try {
        const attempt=current.play();
        attempt?.catch?.(error=>finish(error?.name==='NotAllowedError'?'blocked':'error',error?.name||'play_failed'));
      }catch(error){finish('exception',error?.name||'play_exception');}
    });
  }
  function addAudioTestControl() {
    // Keep engineering playback controls out of Public and JSSF Research screens.
    if (window.QuickStrokeDevMode?.isEnabled?.() !== true) return;
    // The recorded path is currently used primarily on Android browsers.
    // Always provide an audible, direct-gesture test when that path is selected,
    // so users can distinguish browser playback from an application prompt error.
    if (!use('th-TH') || document.getElementById('quickstroke-audio-test')) return;
    const button=document.createElement('button');
    button.id='quickstroke-audio-test';
    button.type='button';
    button.textContent='🔊 ทดสอบเสียง';
    button.setAttribute('aria-label','ทดสอบเสียงคำแนะนำภาษาไทย');
    button.style.cssText='position:fixed;right:10px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:10000;width:auto;max-width:calc(100vw - 20px);min-height:42px;padding:9px 14px;background:#175c89;color:#fff;border:2px solid #fff;border-radius:999px;font:600 14px system-ui,sans-serif;box-shadow:0 2px 12px #0005;';
    const status=document.createElement('span');
    status.id='quickstroke-audio-status';
    status.setAttribute('role','status');
    status.style.cssText='position:fixed;right:10px;bottom:calc(62px + env(safe-area-inset-bottom));z-index:10000;max-width:min(320px,calc(100vw - 20px));padding:8px 10px;border-radius:9px;background:#fff;color:#172938;font:14px system-ui,sans-serif;box-shadow:0 1px 10px #0003;display:none;';
    button.addEventListener('click',()=>{
      status.textContent='กำลังเล่นเสียงทดสอบ…';
      status.style.display='block';
      // play() starts synchronously in the tap handler, preserving activation.
      void play('หน้าตรงและอยู่นิ่ง').then(result=>{
        status.textContent=result==='ended'
          ? 'เสียงเล่นจบแล้ว หากไม่ได้ยิน กรุณาเพิ่มระดับเสียงสื่อ'
          : 'เล่นเสียงไม่ได้ ('+result+') กรุณาเพิ่มระดับเสียงสื่อหรือลองเปิดผ่าน Chrome';
      });
    });
    document.body.appendChild(status);
    document.body.appendChild(button);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addAudioTestControl,{once:true});
  else addAudioTestControl();
  window.QuickStrokeThaiRecorded={mode,use,fileFor,play,stop,unlock,prepareAll,shouldPrepare};
})();
