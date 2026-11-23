import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Economy,simulate,runEnsemble} from '../dist/engine.mjs';
import {Society} from '../dist/society.mjs';
import {metricValue,sanitize} from '../dist/parameters.mjs';
import {restoreConfiguration} from '../dist/configuration.mjs';
import {retirementComparison,retirementComparisonHTML} from '../dist/retirement-diagnostics.mjs';
import {simulationFindings} from '../dist/findings.mjs';
const profiles=JSON.parse(fs.readFileSync(new URL('../dist/data/profiles.json',import.meta.url)));
const close=(a,b,n)=>assert(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b)),n);
for(const profile of profiles){
 const p=sanitize(profile.params),e=new Economy(p,2026),r=e.step(1,1);
 close(r.publicPensionContributions,r.wageWithholding*p.publicPensionContributionShare/100,profile.code+' final collected taxes');
 close(r.publicPensionGap,r.publicPensionBenefits-r.publicPensionContributions,profile.code+' funding allocation');
 assert(r.publicPensionContributions<=r.wageWithholding+1e-10);
 const opening=e.initialSnapshot();for(const k of ['publicPensionBenefits','publicPensionContributions','publicPensionGap'])assert.equal(metricValue(opening,k),null,'opening simulated annual flow is unavailable');
 const saved={country:profile.code,modelVersion:'1.30.0',params:{...p,importTariff:0,financialIncomeTax:0,wealthTax:0,foreignPortfolioWeight:0,retirementAge:58},reference:{...p},paths:[{key:'retirementAge',start:4,end:4,target:56,mode:'step'}],shocks:[],preset:'custom'};
 const restored=restoreConfiguration(saved,profiles);assert(!restored.rebuildPreset);
 for(const k of ['importTariff','financialIncomeTax','wealthTax','foreignPortfolioWeight','retirementAge'])assert.equal(restored.state.params[k],saved.params[k],profile.code+' explicit 1.30 input preserved');
 assert.deepEqual(restored.state.paths,saved.paths);
}
const p=profiles.find(x=>x.code==='USA').params,s=new Society(p);
for(const on of [0,1])for(const share of [0,60,100]){
 const f={publicPensionBenefits:on?6:0,wageWithholding:10};s.reconcilePublicPensionFunding({...p,pensionEnabled:on,publicPensionContributionShare:share},f);
 close(f.publicPensionContributions,on?10*share/100:0,'pension allocation boundaries');close(f.publicPensionGap,f.publicPensionBenefits-f.publicPensionContributions,'signed funding difference');
}
for(const coverage of [0,1]){
 const x=simulate({...p,periods:5,fiscalCoverage:coverage},2026,{snapshots:false});
 for(const r of x.rows.slice(1))close(r.publicPensionContributions,r.wageWithholding*p.publicPensionContributionShare/100,'coverage on/off');
}
const params={...p,periods:12,replications:3},payload={params,reference:params,paths:[{key:'retirementAge',start:4,end:4,target:p.retirementAge-2,mode:'step'}],shocks:[]};
const r=runEnsemble(payload),d=retirementComparison(r,12);
assert(d.isolated);assert(d.pairs.every(x=>Math.abs(x.residual)<1e-8));
assert(retirementComparison(r,3).pairs.every(x=>x.realGDP===0&&x.labourForce===0));
assert(retirementComparisonHTML(r,12).includes('Only the pension eligibility age differs'));
assert(simulationFindings(r).policy.some(x=>x.includes('healthy working lives')));
const combined={...r,paths:[...r.paths,{key:'rdBusiness',start:5,end:5,target:4,mode:'step'}]};
assert.equal(retirementComparison(combined,12).isolated,false);assert(simulationFindings(combined).findings.some(x=>x.includes('cannot be credited to retirement policy alone')));
assert.equal(retirementComparison({...r,paths:[]},12),null);
console.log('PASS: all 30 final pension-tax allocations, signed gaps, missing opening flows, saved 1.30 edits, funding boundaries and isolated/combined retirement diagnostics.');
