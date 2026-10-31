import {restoreTechnicalDemo} from './technical-demo-boundaries.mjs';
import fs from 'node:fs';
const blocks=JSON.parse(fs.readFileSync(new URL('./fixtures/public-module-accents.json',import.meta.url),'utf8'));
export function restoreModuleAccents(text,file){
 text=restoreTechnicalDemo(text,file);
 if(blocks[file])text=text.replace(blocks[file],'');
 return file==='service-worker.js'?text.replace('quickstroke-pwa-v108','quickstroke-pwa-v107'):text;
}
