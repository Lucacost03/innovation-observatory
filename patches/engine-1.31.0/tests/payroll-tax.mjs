import assert from 'node:assert/strict';
import fs from 'node:fs';
import {settleWorkerTax}from '../dist/payroll-tax.mjs';
import {Economy,simulate}from '../dist/engine.mjs';
import {inputStatus,restoreConfiguration}from '../dist/configuration.mjs';
import {buildParameterAudit}from '../dist/audit.mjs';
import {PARAMETERS}from '../dist/parameters.mjs';
import {FISCAL_ENGINE}from '../dist/fiscal-data.mjs';
import {Economy as PreviousEconomy}from '../research/frozen_engine_v1_30_1/engine.mjs';
const close=(a,b,n)=>assert(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b)),n);
function fixture(payroll,cash,prepaid){return {p:{},e:{households:cash.map((cash,i)=>({cash,income:0,ownership:i?0.01:0.99})),workerGrossPayroll:payroll,gov:{cash:1000},ensureGov(amount){assert(this.gov.cash>=amount);}},flows:{wageWithholding:prepaid,fiscalUnpaidRevenue:0}};}
{
 const {e,p,flows}=fixture([0,100],[500,20],20),before=e.households.map(h=>h.cash);settleWorkerTax(e,p,flows,10);
 close(e.households[0].cash,before[0],'non-earner does not receive wage tax refund');close(e.households[1].cash-before[1],10,'payer receives own withholding refund');close(flows.wageWithholding,10,'final tax');
}
{
 const {e,p,flows}=fixture([10,90],[1,100],20);settleWorkerTax(e,p,flows,40);
 close(flows.fiscalWorkerExtraTax,19,'own liability and own liquidity');close(flows.fiscalWorkerTaxUncollected,1,'shortfall remains visible');close(e.households[1].cash,82,'shortfall is not reassigned to other households');
}
{
 const {e,p,flows}=fixture([10,90],[1000,1000],20);settleWorkerTax(e,p,flows,1000);
 close(flows.wageWithholding,100,'worker tax does not exceed gross payroll');close(flows.fiscalWorkerTaxUncollected,900,'unsupported target is not collected from assets');
}
{
 const {e,p,flows}=fixture([0,0],[100,100],0);settleWorkerTax(e,p,flows,10);
 close(flows.wageWithholding,0,'no payroll does not imply an asset levy');close(flows.fiscalWorkerTaxUncollected,10,'missing base disclosed');
 assert.throws(()=>settleWorkerTax(e,p,flows,-1));assert.throws(()=>settleWorkerTax(e,p,flows,NaN));
}
for(const share of [0,0.2,0.8,1])for(const tax of [0,0.2,0.8])for(const target of [0,5,20,50,100,200]){
 const gross=[100*share,100*(1-share)],{e,p,flows}=fixture(gross,[20,80],100*tax),before=e.households.map(h=>h.cash),gov=e.gov.cash;
 settleWorkerTax(e,p,flows,target);
 close(e.gov.cash-gov,flows.wageWithholding-100*tax,'cash government');close(e.households.reduce((s,h,i)=>s+h.cash-before[i],0),gov-e.gov.cash,'cash household');
 assert(e.households.every(h=>h.cash>=-1e-10));assert(flows.wageWithholding<=100+1e-9&&flows.wageWithholding>=-1e-9);
 gross.forEach((w,i)=>{if(!w)close(e.households[i].cash,before[i],'zero gross payroll invariant');if(target<100*tax)assert(e.households[i].cash-before[i]<=w*tax+1e-9,'refund at most own tax');});
}
const profiles=JSON.parse(fs.readFileSync(new URL('../dist/data/profiles.json',import.meta.url)));
for(const {code,params}of profiles){
 const a=new PreviousEconomy(params,2026),b=new Economy(params,2026);const opening=b.initialSnapshot();for(const [key,value]of Object.entries(a.initialSnapshot()))assert.equal(opening[key],value,code+' empirical opening unchanged '+key);
 const definition=PARAMETERS.find(x=>x.key==='initialParticipationRate'),profile=profiles.find(x=>x.code===code);
 assert.equal(inputStatus(definition,params,profile).note,buildParameterAudit(profile).find(x=>x.key===definition.key).interpretation,'audit and control help agree');
 for(const modelVersion of ['1.30.0','1.30.1']){const saved={modelVersion,country:code,params:{...params,incomeTax:12.345,importTariff:0,wealthTax:0},reference:params,paths:[{key:'incomeTax',target:10,start:4,end:4,mode:'step'}],shocks:[],preset:'custom'},restored=restoreConfiguration(saved,profiles);assert(!restored.rebuildPreset);for(const key of ['incomeTax','importTariff','wealthTax'])assert.equal(restored.state.params[key],saved.params[key],'authored input preserved');assert.deepEqual(restored.state.paths,saved.paths);}
 const row=b.step(1,1);close(b.workerGrossPayroll.reduce((s,x)=>s+x,0),row.wages,code+' actual wage recipients');close(row.publicPensionContributions,row.wageWithholding*params.publicPensionContributionShare/100,code+' pension memo uses final tax');
 const off=simulate({...params,fiscalCoverage:0,periods:4},2026,{snapshots:false});assert(off.rows.every(x=>x.fiscalWorkerTaxRefund===0&&x.fiscalWorkerExtraTax===0));
 const oldOff=new PreviousEconomy({...params,fiscalCoverage:0,periods:4},2026);
 for(let t=0;t<=4;t++){const row=t?oldOff.step(t,t):oldOff.initialSnapshot();for(const [key,value]of Object.entries(row))assert.equal(off.rows[t][key],value,code+' no change outside fiscal coverage '+key);}
 const zero=simulate({...params,incomeTax:0,periods:3},2026,{snapshots:false});assert(zero.rows.slice(1).every(x=>x.wageWithholding===0),'zero worker-tax control has no worker withholding');
 const noBusinessTax=simulate({...params,profitTax:0,periods:3},2026,{snapshots:false});assert(noBusinessTax.rows.slice(1).every(x=>x.profitTaxPaid===0),code+' zero business tax affects the fiscal bridge');
 for(const rate of [10,30]){const changed=new Economy({...params,profitTax:rate},2026).step(1,1),source=FISCAL_ENGINE[params.foreignPoolId],reference=source.basePolicy.profitTax>0?source.basePolicy.profitTax:20;
 close(changed.profitTaxPaid,source.opening.corporateTax*rate/reference,code+' lower/higher business tax reaches fiscal coverage');}
}
console.log('PASS: payer-specific refunds, zero-earner exclusion, no cross-household tax shortfall shifting, payroll/cash caps, missing-base disclosure, 72 boundary cases, all30 unchanged empirical openings and final pension allocations.');
