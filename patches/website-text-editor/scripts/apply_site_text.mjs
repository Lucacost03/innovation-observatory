// Apply a user-exported wording file to public text, without altering model code.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {PUBLISHED_TEXT} from '../dist/site-copy-data.mjs';
import {MAX_FILE_BYTES,parseTextChanges} from '../dist/site-text-model.mjs';
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/apply_site_text.mjs /path/to/text-changes.json');
if(fs.statSync(file).size>MAX_FILE_BYTES)throw Error('The changes file exceeds 2 MB.');
const incoming=parseTextChanges(JSON.parse(fs.readFileSync(file,'utf8'))),merged=new Map(PUBLISHED_TEXT.map(r=>[r.key,r]));
for(const record of incoming)merged.set(record.key,record);
const records=[...merged.values()].sort((a,b)=>a.key.localeCompare(b.key));
const destination=fileURLToPath(new URL('../dist/site-copy-data.mjs',import.meta.url));
fs.writeFileSync(destination,'// Public wording overrides. Plain text; matched to the original source passage.\nexport const PUBLISHED_TEXT='+JSON.stringify(records,null,2)+';\n');
console.log(`Applied ${incoming.length} wording change(s) to ${path.basename(destination)}. Review in the website preview before publishing.`);
