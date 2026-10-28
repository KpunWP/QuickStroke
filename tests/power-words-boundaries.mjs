import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync(new URL('../docs/jssf-power-words-plan.json',import.meta.url),'utf8'));
export function restorePowerWords(text,file) {
  for(const op of [...(plan.source[file]||[])].reverse()) text=text.split(op.after).join(op.before);
  return text;
}
export function restorePowerLocale(pack,locale) {
  pack=JSON.parse(JSON.stringify(pack));
  delete pack.speech.publicUi;
  for(const row of plan.locale.filter(x=>x.locale===locale&&!x.key.startsWith('speech.publicUi.'))){
    const keys=row.key.split('.');const obj=keys.slice(0,-1).reduce((v,k)=>v[k],pack);
    if(row.old===null)delete obj[keys.at(-1)];else obj[keys.at(-1)]=row.old;
  }
  return pack;
}
