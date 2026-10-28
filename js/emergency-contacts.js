/* Explicit JSSF exhibition presentation only: callers verify Public mode and the
   existing tab-scoped event context. Outside it, language never selects a country. */
(function (global) {
  'use strict';
  const copy = {
    th: ['บริการรถพยาบาล — เลือกประเทศที่อยู่ขณะนี้', 'ประเทศไทย — รถพยาบาล', 'ประเทศญี่ปุ่น — รถพยาบาล', 'ประเทศอื่น: ติดต่อบริการฉุกเฉินในพื้นที่ทันที'],
    en: ['Ambulance — choose the country you are in', 'Thailand — Ambulance', 'Japan — Ambulance', 'Other countries: contact local emergency services immediately.'],
    ja: ['救急車 — 現在いる国を選んでください', 'タイ — 救急車', '日本 — 救急車', 'その他の国：直ちに現地の救急サービスへ連絡してください。']
  };
  const destinations = Object.freeze([Object.freeze({country:'TH',number:'1669'}),Object.freeze({country:'JP',number:'119'})]);

  // Explicit Public selection only. Never derive a general-use country from locale.
  const publicGroups = new Set();
  let manualCountry = null;
  let storageFailed = false;
  let resumeListenerInstalled = false;
  const countryKey = 'quickstroke_public_emergency_country';
  function selectedCountry() {
    try {
      const saved = storageFailed ? null : global.sessionStorage?.getItem(countryKey);
      if (saved === 'TH' || saved === 'JP') manualCountry = saved;
    } catch (_) { /* In-memory selection still works when storage is unavailable. */ }
    return manualCountry;
  }
  function renderPublic(parent, language, exhibition) {
    if (!resumeListenerInstalled) {
      global.addEventListener?.('pageshow', () => { for (const group of publicGroups) group.update(); });
      resumeListenerInstalled = true;
    }
    for (const group of publicGroups) if (!group.root.isConnected) publicGroups.delete(group);
    const lang = String(language).split('-')[0];
    const key = copy[lang] ? lang : 'en';
    const labels = {
      th: ['ประเทศไทย','ญี่ปุ่น','เปลี่ยนประเทศ','เลือกประเทศสำหรับโทรฉุกเฉิน'],
      en: ['Thailand','Japan','Change country','Choose country for emergency calls'],
      ja: ['タイ','日本','国を変更','救急通報する国を選択']
    }[key];
    const root = document.createElement('div');
    root.dataset.emergencyCountries = '1'; root.dataset.publicCompact = '1';
    root.setAttribute('role','group'); root.setAttribute('aria-label', labels[3]);
    root.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;flex-basis:100%;min-width:0;max-width:100%';
    const link = document.createElement('a');
    link.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:48px;min-height:48px;max-width:100%;padding:8px 12px;border:1px solid currentColor;border-radius:12px;color:inherit;font:inherit;font-weight:700;line-height:1.6;white-space:normal;overflow-wrap:break-word';
    const details = document.createElement('details');
    details.style.cssText = 'min-width:0;max-width:100%';
    const summary = document.createElement('summary');
    summary.textContent = labels[2];
    summary.style.cssText = 'box-sizing:border-box;min-width:48px;min-height:48px;padding:12px 8px;cursor:pointer;line-height:1.6;overflow-wrap:break-word';
    const picker = document.createElement('select');
    picker.dataset.emergencyCountryPicker = '1'; picker.setAttribute('aria-label', labels[3]);
    picker.style.cssText = 'box-sizing:border-box;min-width:48px;min-height:48px;max-width:100%;font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:8px;padding:8px';
    for (const [i, country] of ['TH','JP'].entries()) {
      const option = document.createElement('option');option.value=country;option.textContent=labels[i];picker.appendChild(option);
    }
    const other = document.createElement('span');other.textContent=copy[key][3];
    other.style.cssText='flex-basis:100%;font-size:.875em;line-height:1.6;overflow-wrap:break-word';
    const record = {root, update() {
      // Thailand is a fixed, visibly labelled ordinary-entry preset, not detected location.
      const country = selectedCountry() || (exhibition && key !== 'th' ? 'JP' : 'TH');
      const i = country === 'TH' ? 0 : 1, target=destinations[i];
      link.href='tel:'+target.number;link.textContent=labels[i]+' · '+target.number;
      link.dataset.emergencyCountry=country;link.setAttribute('aria-label',copy[key][i+1]+' · '+target.number);
      picker.value=country;
    }};
    picker.addEventListener('change', () => {
      if (!['TH','JP'].includes(picker.value)) return;
      manualCountry=picker.value;
      try { global.sessionStorage?.setItem(countryKey,manualCountry); } catch (_) { storageFailed = true; }
      for (const group of publicGroups) group.update();
    });
    details.appendChild(summary);details.appendChild(picker);
    root.appendChild(link);root.appendChild(details);root.appendChild(other);
    parent.style.flexWrap='wrap';parent.appendChild(root);publicGroups.add(record);record.update();return root;
  }
  global.QuickStrokeEmergency = Object.freeze({
    destinations,
    render(parent, language, { jssfExhibition = false, publicCompact = false } = {}) {
      parent.querySelector('[data-emergency-countries]')?.remove();
      if (publicCompact === true) return renderPublic(parent, language, jssfExhibition === true);
      const lang = String(language).split('-')[0];
      const text = copy[lang] || copy.en;
      const compact = jssfExhibition === true;
      const targets = compact ? [destinations[lang === 'th' ? 0 : 1]] : destinations;
      const group = document.createElement('div');
      group.dataset.emergencyCountries = '1'; group.setAttribute('role','group'); group.setAttribute('aria-label',compact ? text[lang === 'th' ? 1 : 2] : text[0]);
      group.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;flex-basis:100%;min-width:0;max-width:100%';
      if (!compact) {
        const title=document.createElement('span');title.textContent=text[0];title.style.cssText='flex-basis:100%;font-weight:700';group.appendChild(title);
      }
      targets.forEach(target=>{
        const index = target.country === 'TH' ? 0 : 1;
        const link=document.createElement('a');link.href='tel:'+target.number;link.textContent=(compact ? (lang === 'th' ? 'ประเทศไทย' : lang === 'ja' ? '日本' : 'Japan') : text[index+1])+' · '+target.number;
        link.dataset.emergencyCountry=target.country;
        link.setAttribute('aria-label',text[index+1]+' · '+target.number);
        link.style.cssText='display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:48px;min-height:48px;max-width:100%;padding:8px 12px;border:1px solid currentColor;border-radius:12px;color:inherit;font:inherit;font-weight:700;line-height:1.6;white-space:normal;overflow-wrap:break-word';
        group.appendChild(link);
      });
      if (!compact) {
        const other=document.createElement('span');other.textContent=text[3];other.style.flexBasis='100%';group.appendChild(other);
      }
      parent.style.flexWrap='wrap';parent.appendChild(group);return group;
    }
  });
})(window);
