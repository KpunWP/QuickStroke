import fs from 'node:fs';
const changes=JSON.parse(fs.readFileSync(new URL('./fixtures/technical-demo-patch.json',import.meta.url),'utf8'));
export function restoreTechnicalDemo(text,file){
 for(const op of [...(changes[file]||[])].reverse())text=text.replace(op.after,op.before);
 return text;
}
