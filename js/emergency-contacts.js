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
  global.QuickStrokeEmergency = Object.freeze({
    destinations,
    render(parent, language, { jssfExhibition = false } = {}) {
      parent.querySelector('[data-emergency-countries]')?.remove();
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
