/* Engineering-only visual projection. Never changes app mode, sessions or module policies. */
(function(global){
  'use strict';
  const page=location.pathname.split('/').pop()||'index.html';
  const name=({'index.html':'home','face-test.html':'face','arm-test.html':'arm','speech-test.html':'speech','result.html':'result'})[page];
  const markers={home:'html[data-qs-staff-entry="0"]',face:'html[data-face-public="1"]',arm:'html[data-arm-public="1"]',speech:'html[data-speech-public="1"]',result:'html[data-result-public="1"]'};
  let style=null,originalViewport=null,listening=false;
  function enabled(){return global.QuickStrokeDevMode?.isEnabled?.()===true&&global.QuickStrokeAppMode?.resolveMode?.()==='dev'&&global.QuickStrokeAppMode?.getAnalysisRole?.()==='engineering_only'&&!['public','research'].includes(global.QuickStrokeDataContract?.getSessionContext?.()?.appMode);}
  function collect(rules,from,to){return [...rules].map(rule=>{
    if(rule.selectorText?.includes(from))return rule.cssText.split(from).join(to);
    if(rule.cssRules){const nested=collect(rule.cssRules,from,to);return nested?rule.cssText.slice(0,rule.cssText.indexOf('{')+1)+nested+'}':'';}
    return '';
  }).join('\n');}
  function apply(){
    const viewport=document.querySelector('meta[name="viewport"]');
    if(!enabled()||!markers[name]){style?.remove();style=null;delete document.documentElement.dataset.demoPresentation;if(originalViewport!==null&&viewport)viewport.content=originalViewport;return false;}
    if(style)return true;
    const from=markers[name],to='html[data-demo-presentation="'+name+'"]';
    const css=[...document.querySelectorAll('style')].map(node=>node.sheet?collect(node.sheet.cssRules,from,to):'').join('\n');
    if(!css.trim())return false;
    style=document.createElement('style');style.id='demo-public-presentation-style';style.textContent=css+(name==='home'?'\n'+to+' .mode-zone,'+to+' .dev-zone{display:none!important}':'');document.head.append(style);
    document.documentElement.dataset.demoPresentation=name;
    if(viewport){originalViewport=viewport.content;viewport.content='width=device-width, initial-scale=1.0, viewport-fit=cover';}
    if(!listening){for(const event of ['quickstroke:dev-mode-change','quickstroke:app-mode-change'])global.addEventListener(event,apply);listening=true;}
    return true;
  }
  global.QuickStrokeDemoPresentation=Object.freeze({enabled,apply});
  apply();
})(window);
