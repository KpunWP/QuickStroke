import {restoreModuleAccents} from './public-module-accent-boundaries.mjs';
// Exact presentation-only substitutions; retain all prior frozen engine checks.
import fs from 'node:fs';
const changes=JSON.parse(fs.readFileSync(new URL('./fixtures/compact-emergency-patch.json',import.meta.url),'utf8'));
export function restoreCompactEmergency(text,file) {
 text=restoreModuleAccents(text,file);
 for(const op of [...(changes[file]||[])].reverse())text=text.split(op.after).join(op.before);
 return text;
}
