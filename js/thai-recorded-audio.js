/* QuickStroke Thai recorded audio A/B: opt-in, no clinical/measurement changes. */
(function () {
  'use strict';
  const KEY='quickstroke_audio_ab';
  const q=new URLSearchParams(location.search).get('audio');
  if(q==='tts'||q==='recorded') {
    try { sessionStorage.setItem(KEY,q); } catch(_) {}
  }
  let mode='auto';
  try { mode=['recorded','tts'].includes(sessionStorage.getItem(KEY)) ? sessionStorage.getItem(KEY) : 'auto'; } catch(_) {}
  const manifest={
    'หน้าตรงและอยู่นิ่ง':'face_01_rest.mp3',
    'ยิ้มกว้าง':'face_02_smile.mp3',
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
    'จบการทดสอบ ขอบคุณค่ะ':'result_01_thanks.mp3'
  };
  const alias={'เตรียมพูด รอเสียงสัญญาณก่อนเริ่มพูด':'เตรียมพูด รอจนหน้าจอแสดงว่าเริ่มพูดได้',
    'ข้อมือขยับ เหยียดข้อมือให้ตรงแล้วลองอีกครั้ง':'ข้อมือขยับ เหยียดข้อมือให้ตรงแล้วลองอีกครั้ง'};
  const norm=s=>String(s||'').replace(/[\u200b\u200c\u200d]/g,'').replace(/\s+/g,'').replace(/[.,，。!?ฯ]/g,'').replace(/ๆ/g,'ๆ');
  const lookup=new Map(Object.entries(manifest).map(([s,f])=>[norm(s),f]));
  let player=null, active=null, token=0, unlocked=false;
  function use(lang) {
    if (!String(lang||'th').toLowerCase().startsWith('th')) return false;
    if(mode==='recorded') return true;
    if(mode==='tts') return false;
    // Samsung Internet can advertise a Thai TTS voice but fail to produce
    // audible prompts. Prefer the bundled Thai recordings on that browser.
    if (String(navigator.userAgent||'').includes('SamsungBrowser/')) return true;
    const voices=window.speechSynthesis?.getVoices?.() || [];
    if (voices.some(v=>String(v?.lang||'').toLowerCase().replace('_','-').startsWith('th'))) return false;
    // iOS can deliver its voice list asynchronously; keep the proven iOS TTS path.
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent||'')) return false;
    // An absent Thai voice on Android (including Samsung) uses bundled audio.
    return true;
  }
  function fileFor(text) { return lookup.get(norm(alias[text]||text))||null; }
  function stop() {
    token++;
    if(active) { active('cancelled'); active=null; }
    if(player) { try {player.pause();player.removeAttribute('src');player.load();} catch(_) {} }
  }
  function unlock() {
    if(unlocked) return;
    unlocked=true;
    if(!player) player=new Audio();
    player.preload='auto';
    player.muted=false;
    // Never play a muted prime: its pending play() promise can settle after the
    // real instruction starts and inadvertently pause audible playback.
    // The visible "ทดสอบเสียง" control below plays real audio on a direct tap.
  }
  document.addEventListener('pointerdown',unlock,{capture:true,once:true});
  document.addEventListener('touchstart',unlock,{capture:true,once:true});
  function play(text,{onDone,timeoutMs=13000}={}) {
    const file=fileFor(text);
    const module=file?.startsWith('face_') ? 'face' :
      file?.startsWith('arm_') ? 'arm' : file?.startsWith('speech_') ? 'speech' : null;
    const report=(code,stage,status,errorCode)=> {
      if (!module) return;
      try {
        const remote=window.QuickStrokeJssfRemote;
        if(remote?.canSync?.() !== true) return;
        void remote.queueTtsTelemetry?.(
          module,code,stage,status,'th-TH',errorCode,
          'recorded-'+file+'-'+status,'recorded_audio','th-TH'
        )?.catch?.(()=>{});
      } catch(_) {}
    };
    if(!file) {onDone?.('missing');return Promise.resolve('missing');}
    stop();const my=token;
    if(!player) player=new Audio();
    player.preload='auto';player.muted=false;player.volume=1;player.playbackRate=1;
    const url=new URL('./audio/th/'+file,document.baseURI);
    player.src=url.href;
    return new Promise(resolve=>{
      let settled=false;
      const finish=status=>{
        if(settled)return;
        settled=true;clearTimeout(timer);
        player.removeEventListener('ended',ended);player.removeEventListener('error',failed);
        if(my===token)active=null;
        if(status==='ended') report('TTS_PLAYBACK_STARTED','prompt','ended');
        else if(status==='blocked'||status==='timeout'||status==='error'||status==='exception')
          report(status==='timeout'?'TTS_NO_START':'TTS_ERROR','prompt',status,status);
        onDone?.(status);resolve(status);
      };
      const ended=()=>finish('ended'),failed=()=>finish('error');
      active=finish;player.addEventListener('ended',ended);player.addEventListener('error',failed);
      const timer=setTimeout(()=>{if(my===token)stop();finish('timeout');},timeoutMs);
      try { const p=player.play();if(p?.catch)p.catch(()=>finish('blocked')); }
      catch(_){finish('exception');}
    });
  }
  function addAudioTestControl() {
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
  window.QuickStrokeThaiRecorded={mode,use,fileFor,play,stop,unlock};
})();
