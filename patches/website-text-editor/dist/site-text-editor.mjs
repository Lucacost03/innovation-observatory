import {PUBLISHED_TEXT} from './site-copy-data.mjs';
import {TEXT_FORMAT,TEXT_STORAGE,MAX_TEXT,MAX_FILE_BYTES,parseTextChanges,textDocument,effectiveText,setTextDraft,textHash} from './site-text-model.mjs';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const copyHTML=(key,text)=>`<span data-copy-key="${escape(key)}">${escape(text)}</span>`;

export function createSiteTextEditor(){
 const entries=new Map(),originals=new WeakMap(),publicCopy=new Map(parseTextChanges({format:TEXT_FORMAT,changes:PUBLISHED_TEXT}).map(r=>[r.key,r]));
 let drafts=new Map(),undo=[],active=false,selection=null,storageFailed=false,startupWarning='',previewOnly=false;
 try{const raw=localStorage.getItem(TEXT_STORAGE);if(raw)drafts=new Map(parseTextChanges(JSON.parse(raw)).map(r=>[r.key,r]));}catch{startupWarning='The saved draft could not be loaded. Import a downloaded text-changes file to recover it.';}
 const host=document.createElement('div');host.id='site-text-editor';
 host.innerHTML=`<div id="text-edit-toolbar" hidden aria-label="Website text editor"><div><strong>Your text draft</strong><span id="text-edit-count"></span><p>Click highlighted wording to edit it. Drafts stay in this browser. Download changes and attach the file in this chat to publish them for everyone.</p></div><div class="text-edit-actions"><button type="button" id="text-browse">Find text</button><button type="button" id="text-preview">Preview</button><button type="button" id="text-undo">Undo</button><button type="button" id="text-download">Download changes</button><button type="button" id="text-import">Import changes</button><button type="button" id="text-done">Done</button></div><p id="text-edit-message" role="status" aria-live="polite"></p><input type="file" id="text-import-file" accept=".json,application/json" hidden></div>
 <dialog id="text-wording-dialog" aria-labelledby="text-wording-title" aria-describedby="text-wording-note"><form id="text-wording-form"><div class="text-dialog-heading"><div><span class="text-editor-eyebrow" id="text-wording-section"></span><h2 id="text-wording-title">Edit this wording</h2></div><button type="button" data-text-close="text-wording-dialog" aria-label="Cancel text edit">×</button></div><p id="text-wording-note">Plain text only. This changes the wording shown on the page; model settings, data and calculated results are separate.</p><label for="text-wording-input">Your wording</label><textarea id="text-wording-input" maxlength="${MAX_TEXT}" rows="7" autofocus></textarea><details><summary>Published wording</summary><p id="text-wording-original"></p></details><p id="text-wording-error" role="alert"></p><div class="text-dialog-actions"><button type="button" id="text-restore-one">Restore published wording</button><button type="button" data-text-close="text-wording-dialog">Cancel</button><button type="submit" class="text-save">Save wording</button></div></form></dialog>
 <dialog id="text-catalog-dialog" aria-labelledby="text-catalog-title"><div class="text-dialog-heading"><h2 id="text-catalog-title">Find website text</h2><button type="button" data-text-close="text-catalog-dialog" aria-label="Close text list">×</button></div><p>Search headings, explanations and parameter labels. Open Evidence or Guide to include their wording. Calculated results and source-data tables are excluded.</p><label for="text-catalog-search">Search wording</label><input id="text-catalog-search" type="search" placeholder="For example: inflation or economy"><div class="text-catalog-tools"><label><input type="checkbox" id="text-catalog-edited"> Local edits only</label><button type="button" id="text-discard">Discard all local edits</button></div><div id="text-catalog-list"></div></dialog>
 <dialog id="text-import-dialog" aria-labelledby="text-import-title"><form id="text-import-form"><div class="text-dialog-heading"><h2 id="text-import-title">Import text changes</h2><button type="button" data-text-close="text-import-dialog" aria-label="Close text import">×</button></div><p>Restore a downloaded text draft. Imported edits merge with your local draft; the public website is unchanged.</p><button type="button" id="text-choose-file">Choose JSON file</button><label for="text-import-json">Or paste the text-changes JSON</label><textarea id="text-import-json" rows="6" maxlength="2097152" placeholder="Paste the contents of your downloaded text-changes file"></textarea><p id="text-import-error" role="alert"></p><div class="text-dialog-actions"><button type="button" data-text-close="text-import-dialog">Cancel</button><button type="submit" class="text-save">Import pasted changes</button></div></form></dialog>`;
 document.body.append(host);
 const $=s=>host.querySelector(s),toolbar=$('#text-edit-toolbar'),wording=$('#text-wording-dialog'),catalog=$('#text-catalog-dialog');
 const trigger=document.createElement('button');trigger.id='website-text-edit';trigger.type='button';trigger.className='button secondary';trigger.textContent='Edit website text';trigger.setAttribute('aria-pressed','false');trigger.setAttribute('aria-controls','text-edit-toolbar');
 const badge=document.createElement('span');badge.id='website-text-draft-badge';badge.hidden=true;
 const topbar=document.querySelector('.topbar-actions');topbar.append(badge,trigger);

 function message(text){$('#text-edit-message').textContent=text;}
 function save(){try{localStorage.setItem(TEXT_STORAGE,JSON.stringify(textDocument([...drafts.values()])));storageFailed=false;}catch{storageFailed=true;}refresh();}
 function checkpoint(){undo.push(new Map(drafts));if(undo.length>30)undo.shift();}
 function apply(entry){const resolved=effectiveText(entry,publicCopy,drafts);for(const node of entry.nodes){if(!node.isConnected){entry.nodes.delete(node);continue;}if(node.textContent!==resolved.text)node.textContent=resolved.text;node.dataset.copyEmpty=String(resolved.text==='');node.classList.toggle('text-local-change',drafts.has(entry.key)&&!resolved.conflict);}return resolved;}
 function refresh(){
  let conflicts=0;for(const entry of entries.values())if(apply(entry).conflict)conflicts++;
  const count=drafts.size;badge.hidden=!count;badge.textContent=`${count} local text edit${count===1?'':'s'}`;
  $('#text-edit-count').textContent=`${count} local edit${count===1?'':'s'}${conflicts?' · '+conflicts+' need review':''}`;
  $('#text-undo').disabled=!undo.length;$('#text-download').disabled=!count;$('#text-discard').disabled=!count;
  if(storageFailed)message('Browser storage is unavailable. Changes are only in this tab: download them before leaving.');
  else if(conflicts)message('Some saved wording no longer matches the page. Those edits are kept in your download but are not applied.');
  if(catalog.open)renderCatalog();
 }
 function register(node,section){
  const key=node.dataset.copyKey;if(!key)return;
  if(!originals.has(node))originals.set(node,node.textContent);
  const original=originals.get(node);if(!original.trim()||original.length>MAX_TEXT)return;
  let entry=entries.get(key);if(entry&&entry.original!==original)return; // Never move a draft to a different source passage.
  if(!entry){entry={key,original,section:node.dataset.copySection||section||'Website text',nodes:new Set()};entries.set(key,entry);}
  entry.nodes.add(node);apply(entry);
 }
 function scanRegistered(root,section){if(root.matches?.('[data-copy-key]'))register(root,section);for(const node of root.querySelectorAll('[data-copy-key]'))register(node,section);}
 function nodePath(node,root){const parts=[];for(let n=node;n&&n!==root;n=n.parentElement){let i=1;for(let s=n.previousElementSibling;s;s=s.previousElementSibling)if(s.tagName===n.tagName)i++;parts.unshift(n.tagName.toLowerCase()+i);}return parts.join('.');}
 function scanNarrative(root,scope){
  // Only prose without numeric observations is eligible in generated evidence/guide views.
  for(const block of root.querySelectorAll('h1,h2,h3,h4,p')){
   if(block.closest('table,svg,canvas,button,pre,code,[data-copy-key]'))continue;
   const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
   for(const textNode of nodes){const parent=textNode.parentElement;if(parent.closest('[data-copy-key],a,button,code,svg,table'))continue;
    const text=textNode.textContent.trim();if(text.length<3||/\d/.test(text)||!/[A-Za-z]/.test(text)||text.length>MAX_TEXT)continue;
    const index=[...parent.childNodes].indexOf(textNode),key=`${scope}.${nodePath(parent,root)}.n${index}.${textHash(text)}`;
    const span=document.createElement('span');span.dataset.copyKey=key;span.textContent=text;
    const raw=textNode.textContent,prefix=raw.slice(0,raw.indexOf(text)),suffix=raw.slice(raw.indexOf(text)+text.length);
    textNode.replaceWith(document.createTextNode(prefix),span,document.createTextNode(suffix));register(span,scope==='guide'?'Guide':'Evidence');
   }
  }
 }
 function scan(root,scope){if(scope==='guide'||scope==='evidence')scanNarrative(root,scope);scanRegistered(root,scope==='parameter'?'Parameter labels':'Experiment assumptions');refresh();}
 scanRegistered(document,'Website text');
 // Observe only regenerated text panels; charts and economic result nodes are untouched.
 for(const [selector,scope]of [['#guide-view','guide'],['#evidence-view','evidence'],['#parameter-controls','parameter'],['#scenario-title','scenario'],['#scenario-description','scenario']]){
  const root=document.querySelector(selector);if(!root)continue;let queued=false;
  const observer=new MutationObserver(records=>{
   // Ignore our own text replacement and annotation records to avoid an observer loop.
   const external=records.some(r=>!r.target.closest?.('[data-copy-key]')&&[...r.addedNodes].some(n=>n.nodeType===1&&(!n.matches?.('[data-copy-key]')||!originals.has(n))));
   if(external&&!queued){queued=true;queueMicrotask(()=>{queued=false;scan(root,scope);});}
  });observer.observe(root,{childList:true,subtree:true});scan(root,scope);
 }
 function mode(value){active=value;previewOnly=false;document.body.classList.toggle('text-editing',value);toolbar.hidden=!value;trigger.setAttribute('aria-pressed',String(value));$('#text-preview').textContent='Preview';refresh();if(value){message(startupWarning||'Click a highlighted passage, or use Find text. Draft changes are visible only in this browser.');startupWarning='';}}
 trigger.onclick=()=>mode(!active);$('#text-done').onclick=()=>mode(false);
 $('#text-preview').onclick=()=>{previewOnly=!previewOnly;document.body.classList.toggle('text-editing',!previewOnly);$('#text-preview').textContent=previewOnly?'Continue editing':'Preview';message(previewOnly?'Previewing your local draft. Choose Continue editing to select text again.':'Click highlighted wording to edit.');};
 function openEntry(key){const entry=entries.get(key);if(!entry)return;selection=entry;const resolved=apply(entry);$('#text-wording-section').textContent=entry.section;$('#text-wording-input').value=resolved.text;$('#text-wording-original').textContent=resolved.publicText;$('#text-wording-error').textContent='';if(catalog.open)catalog.close();wording.showModal();$('#text-wording-input').focus();}
 document.addEventListener('click',e=>{if(!active||previewOnly||e.target.closest('#site-text-editor,button,select,input,textarea,a'))return;const node=e.target.closest('[data-copy-key]');if(node){e.preventDefault();e.stopImmediatePropagation();openEntry(node.dataset.copyKey);}},true);
 for(const button of host.querySelectorAll('[data-text-close]'))button.onclick=()=>document.getElementById(button.dataset.textClose).close();
 $('#text-wording-form').onsubmit=e=>{e.preventDefault();if(!selection)return;try{const resolved=apply(selection);const next=setTextDraft(drafts,selection,$('#text-wording-input').value,resolved.publicText);checkpoint();drafts=next;save();wording.close();if(!storageFailed)message('Wording saved in this browser. Download changes to publish through this chat.');}catch(err){$('#text-wording-error').textContent=err.message;}};
 $('#text-restore-one').onclick=()=>{if(!selection)return;checkpoint();drafts.delete(selection.key);save();wording.close();if(!storageFailed)message('Published wording restored for this passage.');};
 $('#text-undo').onclick=()=>{if(!undo.length)return;drafts=undo.pop();save();if(!storageFailed)message('Last draft change undone.');};
 function renderCatalog(){
  const query=$('#text-catalog-search').value.toLowerCase(),edited=$('#text-catalog-edited').checked,list=$('#text-catalog-list');list.replaceChildren();
  let matches=[...entries.values()].filter(entry=>(!edited||drafts.has(entry.key))&&(entry.original+' '+effectiveText(entry,publicCopy,drafts).text+' '+entry.section).toLowerCase().includes(query));
  for(const entry of matches.slice(0,120)){const button=document.createElement('button');button.type='button';button.className='text-catalog-row';const section=document.createElement('small');section.textContent=entry.section+(drafts.has(entry.key)?' · local edit':'');const text=document.createElement('span');text.textContent=effectiveText(entry,publicCopy,drafts).text||'[Text removed]';button.append(section,text);button.onclick=()=>openEntry(entry.key);list.append(button);}
  const note=document.createElement('p');note.className='text-catalog-note';note.textContent=matches.length>120?`${matches.length} passages match. Showing the first 120; narrow your search.`:matches.length?`${matches.length} passage${matches.length===1?'':'s'} found.`:'No matching editable wording. Try another search or open another page section.';list.append(note);
  const unresolved=[...drafts.keys()].filter(key=>!entries.has(key));if(edited&&unresolved.length){const p=document.createElement('p');p.textContent=`${unresolved.length} saved edit(s) are not loaded in this view. They remain in your download. Open the original section or country to review them.`;list.append(p);}
 }
 $('#text-browse').onclick=()=>{renderCatalog();catalog.showModal();$('#text-catalog-search').focus();};$('#text-catalog-search').oninput=renderCatalog;$('#text-catalog-edited').onchange=renderCatalog;
 $('#text-discard').onclick=()=>{checkpoint();drafts=new Map();save();if(!storageFailed)message('All local wording restored. Undo is available until you leave this page.');};
 $('#text-download').onclick=()=>{const blob=new Blob([JSON.stringify(textDocument([...drafts.values()]),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='innovation-observatory-text-changes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);message('Text changes downloaded. Attach the JSON file in this chat to update the public website.');};
 function importDraft(raw){if(new Blob([raw]).size>MAX_FILE_BYTES)throw Error('Use a text-changes file smaller than 2 MB.');const incoming=parseTextChanges(JSON.parse(raw)),next=new Map(drafts);for(const record of incoming)next.set(record.key,record);parseTextChanges(textDocument([...next.values()]));checkpoint();drafts=next;save();$('#text-import-dialog').close();if(!storageFailed)message(`Imported ${incoming.length} wording changes into this browser. Unmatched passages are retained for review and export.`);}
 $('#text-import').onclick=()=>{$('#text-import-error').textContent='';$('#text-import-json').value='';$('#text-import-dialog').showModal();};
 $('#text-choose-file').onclick=()=>$('#text-import-file').click();
 $('#text-import-form').onsubmit=e=>{e.preventDefault();try{importDraft($('#text-import-json').value);}catch(err){$('#text-import-error').textContent='Import failed: '+err.message;}};
 $('#text-import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>MAX_FILE_BYTES)throw Error('Use a text-changes file smaller than 2 MB.');importDraft(await file.text());}catch(err){$('#text-import-error').textContent='Import failed: '+err.message;}finally{e.target.value='';}};
 refresh();
 return{refresh};
}
