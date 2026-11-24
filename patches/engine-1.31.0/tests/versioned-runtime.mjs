import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {pathToFileURL,fileURLToPath}from 'node:url';import {execFileSync}from 'node:child_process';
import {simulate}from '../dist/engine.mjs';import {MODEL_VERSION}from '../dist/parameters.mjs';
const root=new URL('../',import.meta.url),temp=fs.mkdtempSync(path.join(os.tmpdir(),'innovation-module-cache-'));
try{
 const dest=path.join(temp,'dist');fs.mkdirSync(dest);
 const copyModules=url=>{const folder=fileURLToPath(url);for(const name of fs.readdirSync(folder))if(name.endsWith('.mjs'))fs.copyFileSync(path.join(folder,name),path.join(dest,name));};
 // Load and cache the old graph before replacing the files with this release.
 // A fresh entry point alone must not reuse stale unversioned dependencies.
 copyModules(new URL('research/frozen_engine_v1_30_1/',root));
 const stale=await import(pathToFileURL(path.join(dest,'engine.mjs')).href);
 const ps=JSON.parse(fs.readFileSync(new URL('dist/data/profiles.json',root)));
 const p={...ps.find(x=>x.code==='ITA').params,profitTax:0,periods:4};
 assert(stale.simulate(p,2026,{snapshots:false}).rows[1].profitTaxPaid>0,'fixture reproduces the old ignored zero-tax control');
 copyModules(new URL('dist/',root));fs.copyFileSync(new URL('dist/index.html',root),path.join(dest,'index.html'));
 execFileSync('python3',[fileURLToPath(new URL('scripts/version_assets.py',root)),'--version','cache-integration-test','--directory',dest]);
 const fresh=await import(pathToFileURL(path.join(dest,'engine.mjs')).href+'?v=cache-integration-test');
 for(const code of ['ITA','USA','CHN']){
  const params={...ps.find(x=>x.code===code).params,profitTax:0,periods:4},expected=simulate(params,2026,{snapshots:false}),actual=fresh.simulate(params,2026,{snapshots:false});
  assert.equal(actual.modelVersion,MODEL_VERSION);assert.deepEqual(actual.rows,expected.rows,code+' fresh graph matches the tested model despite stale cached modules');
 }
 assert(fs.readFileSync(path.join(dest,'index.html'),'utf8').includes('src="./app.mjs?v=cache-integration-test"'));
 assert(fs.readFileSync(path.join(dest,'app.mjs'),'utf8').includes("new URL('./worker.mjs?v=cache-integration-test'"),'worker loads the same release');
 console.log('PASS: cached prior engine reproduced, current versioned graph gives exact ITA/USA/CHN outcomes, and main/worker URLs use the same release.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
