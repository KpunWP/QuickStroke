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
    // Keep one reusable element. User gesture primes media on iOS without emitting a sound.
    try {player.muted=true;player.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';const p=player.play();p?.then(()=>{player.pause();player.muted=false;}).catch(()=>{player.muted=false;});} catch(_) {player.muted=false;}
  }
  document.addEventListener('pointerdown',unlock,{capture:true,once:true});
  document.addEventListener('touchstart',unlock,{capture:true,once:true});
  function play(text,{onDone,timeoutMs=13000}={}) {
    const file=fileFor(text);
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
        onDone?.(status);resolve(status);
      };
      const ended=()=>finish('ended'),failed=()=>finish('error');
      active=finish;player.addEventListener('ended',ended);player.addEventListener('error',failed);
      const timer=setTimeout(()=>{if(my===token)stop();finish('timeout');},timeoutMs);
      try { const p=player.play();if(p?.catch)p.catch(()=>finish('blocked')); }
      catch(_){finish('exception');}
    });
  }
  window.QuickStrokeThaiRecorded={mode,use,fileFor,play,stop,unlock};
})();
