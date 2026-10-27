import fs from 'node:fs';
const baseline=JSON.parse(fs.readFileSync(new URL('./fixtures/emergency-approved-boundaries.json',import.meta.url)));
export function restoreReferences(html,file){for(const [before,after] of baseline.references[file]||[])html=html.replace(after,before);return html;}
export function restoreResultEmergency(html){
 html=html.replace(/<script id="emergency-contacts">[^]*?<\/script>\n/,'');
 for(const [name,next] of [['renderSummary','moduleStatus'],['renderReminder','appendTechnicalRow']]){
  const a=html.indexOf('   function '+name+'('),b=html.indexOf('   function '+next+'(',a);html=html.slice(0,a)+baseline.resultOriginal[name]+html.slice(b);
 }
 return html.replace('   function stateCopy(',baseline.resultOriginal.emergencyPhone+'   function stateCopy(');
}
