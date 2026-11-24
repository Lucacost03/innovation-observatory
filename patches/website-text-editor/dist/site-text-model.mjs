// Text drafts are separate from economic settings and never execute as HTML.
export const TEXT_FORMAT='innovation-observatory-text-v1';
export const TEXT_STORAGE='innovation-observatory-text-draft-v1';
export const MAX_TEXT=12000,MAX_CHANGES=2000,MAX_FILE_BYTES=2*1024*1024;
const keyPattern=/^(?:static|parameter|scenario|guide|evidence)\.[a-zA-Z0-9_.-]{1,180}$/;
export function parseTextChanges(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.format!==TEXT_FORMAT||!Array.isArray(value.changes))throw Error('Choose an Innovation Observatory text-changes file.');
 if(value.changes.length>MAX_CHANGES)throw Error('Too many text changes.');
 const changes=[],seen=new Set();
 for(const record of value.changes){
  if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.key!=='string'||!keyPattern.test(record.key)||seen.has(record.key))throw Error('Invalid or repeated text identifier.');
  if(typeof record.original!=='string'||typeof record.text!=='string'||!record.original.trim()||record.original.length>MAX_TEXT||record.text.length>MAX_TEXT||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(record.text))throw Error('Invalid text. Each passage can contain up to 12,000 characters.');
  changes.push({key:record.key,original:record.original,text:record.text,section:typeof record.section==='string'?record.section.slice(0,150):'Website text'});seen.add(record.key);
 }
 return changes;
}
export function textDocument(changes){return{format:TEXT_FORMAT,site:'Innovation Observatory',createdAt:new Date().toISOString(),changes:parseTextChanges({format:TEXT_FORMAT,changes})};}
export function effectiveText(entry,published,drafts){
 const publicRecord=published.get(entry.key),draft=drafts.get(entry.key);
 const publicText=publicRecord?.original===entry.original?publicRecord.text:entry.original;
 return {publicText,text:draft?.original===entry.original?draft.text:publicText,conflict:!!draft&&draft.original!==entry.original};
}
export function setTextDraft(drafts,entry,text,publicText){
 const next=new Map(drafts);
 if(text===publicText)next.delete(entry.key);
 else next.set(entry.key,{key:entry.key,original:entry.original,text,section:entry.section});
 return new Map(parseTextChanges(textDocument([...next.values()])).map(record=>[record.key,record]));
}
export function textHash(text){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return(hash>>>0).toString(36);}
