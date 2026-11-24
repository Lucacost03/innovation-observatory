import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TEXT_FORMAT,MAX_CHANGES,MAX_TEXT,parseTextChanges,textDocument,effectiveText,setTextDraft,textHash}from '../dist/site-text-model.mjs';
import {copyHTML}from '../dist/site-text-editor.mjs';
const entry={key:'static.copy.001',original:'Innovation, in motion',section:'Simulator'},record={...entry,text:'A new heading'},empty=new Map();
assert.deepEqual(parseTextChanges(textDocument([record])),[record]);
assert.equal(effectiveText(entry,empty,new Map([[entry.key,record]])).text,'A new heading');
assert.equal(effectiveText(entry,new Map([[entry.key,record]]),empty).text,'A new heading');
assert.equal(effectiveText(entry,empty,new Map([[entry.key,{...record,original:'Changed elsewhere'}]])).text,entry.original);
assert.equal(effectiveText(entry,empty,new Map([[entry.key,{...record,original:'Changed elsewhere'}]])).conflict,true);
assert.equal(effectiveText(entry,new Map([[entry.key,{...record,original:'Changed elsewhere'}]]),empty).text,entry.original);
let draft=setTextDraft(empty,entry,'New words',entry.original);assert.equal(draft.get(entry.key).text,'New words');
assert.equal(setTextDraft(draft,entry,entry.original,entry.original).size,0);
assert.equal(setTextDraft(draft,entry,'','Other published wording').get(entry.key).text,'');
assert.equal(setTextDraft(draft,entry,'Public words','Public words').size,0);
const literal='<img src=x onerror=alert(1)> & "quotes"\n中文 Italiano';
assert.equal(parseTextChanges(textDocument([{...record,text:literal}]))[0].text,literal);
assert(!copyHTML('parameter.incomeTax.label',literal).includes('<img'));
assert(copyHTML('parameter.incomeTax.label',literal).includes('&lt;img'));
assert(!copyHTML('static.abc" onclick="bad',literal).includes(' onclick="bad'));
assert.equal(textHash('Public wording'),textHash('Public wording'));
assert.notEqual(textHash('Public wording'),textHash('Other wording'));
for(const value of [null,[],{}, {format:'innovation-observatory-v1',changes:[]},{format:TEXT_FORMAT,changes:{}},
 {format:TEXT_FORMAT,changes:[record,record]},
 ...['__proto__','engine.incomeTax','static.a/../../bad','scenario.'+'x'.repeat(190)].map(key=>({format:TEXT_FORMAT,changes:[{...record,key}]})),
 ...[null,1,{},'x'.repeat(MAX_TEXT+1),'bad\u0000text'].map(text=>({format:TEXT_FORMAT,changes:[{...record,text}]})),
 {format:TEXT_FORMAT,changes:[{...record,original:''}]},
 {format:TEXT_FORMAT,changes:Array.from({length:MAX_CHANGES+1},(_,i)=>({...record,key:'static.'+i}))}
])assert.throws(()=>parseTextChanges(value));
const polluted=JSON.parse('{"format":"'+TEXT_FORMAT+'","changes":[{"key":"static.__proto__","original":"safe","text":"still plain text","__proto__":{"polluted":true}}]}');
assert.equal(parseTextChanges(polluted)[0].text,'still plain text');assert.equal({}.polluted,undefined);
// Fixed passages must not change the source's rendered words or element attributes.
const root=new URL('../',import.meta.url),html=fs.readFileSync(new URL('dist/index.html',root),'utf8');
const keys=[...html.matchAll(/data-copy-key="([^"]+)"/g)].map(m=>m[1]);assert(keys.length>70);assert.equal(new Set(keys).size,keys.length);
for(const key of keys)parseTextChanges(textDocument([{key,original:'Original',text:'Edited',section:'Simulator'}]));
const app=fs.readFileSync(new URL('dist/app.mjs',root),'utf8');assert(app.includes("copyHTML('parameter.'+d.key+'.label',d.label)"));assert(app.includes("copyHTML('scenario.'+state.preset+'.title',p.title)"));
const editor=fs.readFileSync(new URL('dist/site-text-editor.mjs',root),'utf8');assert(!editor.includes('eval('));assert(!editor.includes('fetch('));assert(!editor.includes('STORAGE_KEY'));
console.log('PASS: wording round trips, source conflicts, restoration, blank edits, multilingual/literal HTML, import limits, duplicate keys, prototype safety and separate text settings.');
