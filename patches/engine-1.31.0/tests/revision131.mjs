import fs from 'node:fs';import assert from 'node:assert/strict';
import {Economy,validateTimeline}from '../dist/engine.mjs';
import {Economy as PreviousEconomy}from '../research/frozen_engine_v1_30_1/engine.mjs';
import {MODEL_VERSION,sanitize}from '../dist/parameters.mjs';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const profiles=read('dist/data/profiles.json'),refs=read('dist/data/latest_fiscal_references.json').countries;
const gdp=read('research/source_snapshots/gdp_growth_2024_25.json'),extra=read('research/trade_bid_candidates/us_china_gdp_observations.json'),macro=read('dist/data/macro_external_benchmarks.json').countries;
const seeds=[2026,9945,17864,25783,33702],focus=['ITA','DEU','FRA','EU27','USA','CHN'];
const sum=a=>a.reduce((s,x)=>s+x,0),close=(a,b,n)=>assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),n);
function observedGrowth(p,y){const x=extra.observations.find(x=>x.country===p.code&&x.year===y);if(x)return x.realGDPGrowthPct;const s={freq:'A',unit:'CLV_PCH_PRE',na_item:'B1GQ',geo:p.geo,time:String(y)};if(gdp.id.some(k=>gdp.dimension[k].category.index[s[k]]==null))return null;return gdp.value[gdp.id.reduce((n,k,i)=>n*gdp.size[i]+gdp.dimension[k].category.index[s[k]],0)]??null;}
let paths=0,annualSteps=0,maxResidual=0,maxDebtBridge=0,openingValuesPreserved=0,maxTaxCashDifference=0,maxTaxCashRelativeResidual=0;
const scores=[],fiscalScores=[],payerCases=[],longRuns=[],interventions=[];
function run(Engine,p,seed,timeline=[]){
 const e=new Engine(p,seed),rows=[e.initialSnapshot()];timeline=validateTimeline(timeline);paths++;
 let refundToNonEarners=0,totalRefund=0,uncollected=0,maxWorkerBurden=0;
 for(let t=1;t<=p.periods;t++){
  const r=e.step(t,t,timeline);rows.push(r);annualSteps++;
  assert(Object.values(r).every(Number.isFinite),'finite row');maxResidual=Math.max(maxResidual,r.relativeResidual,r.financeResidual);assert(r.relativeResidual<1e-8&&r.financeResidual<1e-8,'sector ledgers');
  close(r.nationalSaving-r.grossInvestment,r.currentAccount,'S-I=CA');close(r.netForeignAssets-rows[t-1].netForeignAssets,r.currentAccount,'NFA transactions');
  close(r.nominalOutput,r.nominalConsumption+r.nominalGovernment+r.grossInvestment+r.nominalExports-r.nominalImports,'GDP');close(r.publicDebtStockChange,r.publicDeficit+r.publicDebtStockFlowAdjustment,'debt financing');
  close(r.privateDebt-rows[t-1].privateDebt,r.privateBorrowing-r.privatePrincipalRepaid-r.privatePrincipalExtinguished,'private debt financing');
  maxDebtBridge=Math.max(maxDebtBridge,Math.abs(r.publicDebtBridgeResidual)/Math.max(1,r.publicDebt,rows[t-1].publicDebt));
  const refund=Math.max(0,-r.fiscalHouseholdTaxAdjustment);totalRefund+=refund;
  if(Engine===PreviousEconomy){refundToNonEarners+=refund*sum(e.households.filter((h,i)=>e.payroll[i]<=1e-12).map(h=>h.ownership));}
  else{
   // The payment helper allocates both refunds and extra collection using this
   // independently checked gross payroll ledger, never ownership or deposits.
   close(sum(e.workerGrossPayroll),r.wages,'gross payroll recipients');
   const audit=e.workerTaxAudit,cashChanges=audit.closingCash.map((x,i)=>x-audit.openingCash[i]);
   const cashDifference=Math.abs(sum(cashChanges)-(audit.prepaid-audit.finalPaid));
   const cashScale=Math.max(1,sum(audit.openingCash.map(Math.abs)),sum(audit.closingCash.map(Math.abs)));
   // At extreme 120-year stock sizes, subtracting household cash loses cents
   // or units. Use an explicit floating-point bound on those cash stocks.
   assert(cashDifference<=32*Number.EPSILON*cashScale+1e-8*Math.max(1,Math.abs(audit.prepaid-audit.finalPaid)),'actual tax cash recipients');
   maxTaxCashDifference=Math.max(maxTaxCashDifference,cashDifference);maxTaxCashRelativeResidual=Math.max(maxTaxCashRelativeResidual,cashDifference/cashScale);
   const wrong=sum(cashChanges.filter((x,i)=>audit.grossPayroll[i]===0).map(x=>Math.abs(x)));
   close(wrong,0,'no wage-tax adjustment goes to a non-earner');
   refundToNonEarners+=sum(cashChanges.filter((x,i)=>audit.grossPayroll[i]===0&&x>0));
   uncollected+=r.fiscalWorkerTaxUncollected;maxWorkerBurden=Math.max(maxWorkerBurden,r.wages>1e-12?r.wageWithholding/r.wages:0);assert(r.wageWithholding<=r.wages+1e-8,'worker tax capped by represented payroll');
  }
 }
 return {rows,refundToNonEarners,totalRefund,uncollected,maxWorkerBurden};
}
for(const profile of profiles){
 for(let j=0;j<seeds.length;j++){
  const p={...profile.params,periods:j===0?120:12},seed=seeds[j],a=run(PreviousEconomy,p,seed),b=run(Economy,p,seed);
  for(const [key,value]of Object.entries(a.rows[0])){assert.equal(b.rows[0][key],value,'source opening '+key);openingValuesPreserved++;}
  for(let t=1;t<=2;t++){
   const ga=observedGrowth(profile,2024),gb=observedGrowth(profile,2025),observed=t===1?ga:ga!=null&&gb!=null?100*(Math.sqrt((1+ga/100)*(1+gb/100))-1):null;
   scores.push({country:profile.code,seed,horizon:t,gdpObserved:observed,gdpEarlier:100*((a.rows[t].output/100)**(1/t)-1),gdpCandidate:100*((b.rows[t].output/100)**(1/t)-1),caObserved:macro[profile.code].recentCurrentAccountGDP[String(2023+t)]??null,caEarlier:a.rows[t].currentAccountGDP,caCandidate:b.rows[t].currentAccountGDP});
  }
  const year=refs[profile.code].latest.year,t=year-2023;fiscalScores.push({country:profile.code,seed,year,observed:refs[profile.code].latest.deficitGDP,earlier:a.rows[t].publicDeficitGDP,candidate:b.rows[t].publicDeficitGDP});
  payerCases.push({country:profile.code,seed,years:p.periods,earlierRefund:a.totalRefund,candidateRefund:b.totalRefund,earlierRefundToNonEarners:a.refundToNonEarners,candidateRefundToNonEarners:b.refundToNonEarners,uncollected:b.uncollected,maxWorkerBurden:b.maxWorkerBurden,openingIncomeGini:p.initialIncomeGini,firstIncomeGiniEarlier:a.rows[1].incomeGini,firstIncomeGiniCandidate:b.rows[1].incomeGini});
  if(j===0)longRuns.push({country:profile.code,earlierFinalGDP:a.rows.at(-1).output,candidateFinalGDP:b.rows.at(-1).output,earlierFinalDebtGDP:a.rows.at(-1).publicDebtGDP,candidateFinalDebtGDP:b.rows.at(-1).publicDebtGDP,earlierMinimumGDP:Math.min(...a.rows.map(r=>r.output)),candidateMinimumGDP:Math.min(...b.rows.map(r=>r.output)),candidatePriceBoundYears:b.rows.filter(r=>r.priceBoundHit).length,candidateMaxDebtGDP:Math.max(...b.rows.map(r=>r.publicDebtGDP))});
 }
 console.log('Checked payroll settlement: '+profile.code);
}
for(const country of focus){const base=sanitize(profiles.find(x=>x.code===country).params);
 for(const seed of seeds.slice(0,3))for(const [label,key,target]of [['earlier-retirement','retirementAge',base.retirementAge-2],['worker-tax-cut','incomeTax',Math.max(0,base.incomeTax-10)],['worker-tax-increase','incomeTax',Math.min(80,base.incomeTax+10)],['business-tax-zero','profitTax',0],['business-tax-increase','profitTax',Math.min(50,base.profitTax+10)]]){
  const p={...base,periods:40},timeline=[{key,target,start:4,end:4,mode:'step'}],a=run(PreviousEconomy,p,seed,timeline),b=run(Economy,p,seed,timeline);
  interventions.push({country,seed,label,key,target,earlierFinalGDP:a.rows.at(-1).output,candidateFinalGDP:b.rows.at(-1).output,earlierFinalDebtGDP:a.rows.at(-1).publicDebtGDP,candidateFinalDebtGDP:b.rows.at(-1).publicDebtGDP,candidateRefundToNonEarners:b.refundToNonEarners,uncollected:b.uncollected});
 }
}
function error(rows,key,observed){const r=rows.filter(x=>x[observed]!=null);return {observations:new Set(r.map(x=>x.country+':'+(x.horizon??x.year))).size,seedPairs:r.length,MAE:sum(r.map(x=>Math.abs(x[key]-x[observed])))/r.length,RMSE:Math.sqrt(sum(r.map(x=>(x[key]-x[observed])**2))/r.length)};}
function score(filter){const s=scores.filter(filter),f=fiscalScores.filter(filter);return Object.fromEntries(['gdp','ca','deficit'].map(k=>[k,{earlier:error(k==='deficit'?f:s,k==='deficit'?'earlier':k+'Earlier',k==='deficit'?'observed':k+'Observed'),candidate:error(k==='deficit'?f:s,k==='deficit'?'candidate':k+'Candidate',k==='deficit'?'observed':k+'Observed')}]));}
const byCountry=Object.fromEntries(profiles.map(p=>[p.code,{name:p.name,score:score(x=>x.country===p.code)}]));
const report={status:'PASS',modelVersion:MODEL_VERSION,executedAt:new Date().toISOString(),paths,annualSteps,maxResidual,maxDebtBridge,openingValuesPreserved,maxTaxCashDifference,maxTaxCashRelativeResidual,
 protocol:'Paired frozen 1.30.1 and tax-settlement corrections. All30 presets, five seeds each: one120-year and four12-year pairs. Six economies have three-seed,40-year retirement, worker-tax and business-tax interventions. Same observed GDP/CA/fiscal cases on both sides; previously examined revised2024/25 observations and dated fiscal inputs make this a conditional retrospective diagnostic, not untouched holdout validation. No coefficient tuning or selection on GDP signs.',
 correction:'Refund represented payroll withholding to its actual payers; additional worker-tax requests use those same wage recipients and are limited by own cash and remaining gross payroll. Uncollected requests are reported rather than reassigned to unrelated asset holders. Source-year targets, rates and response coefficients are unchanged. The business-tax control correction is described separately.',
 businessTaxCorrection:'A zero stored fiscal reference previously made the business-tax control ineffective for EU presets. The positive existing registry default supplies that missing policy reference. Baseline observed receipts remain unchanged; zero/lower/higher settings now change the represented corporate-tax target. This reference is a calibration setting, not a claimed empirical statutory rate.',
 scoreCountries:score(x=>x.country!=='EU27'),scoreEU:score(x=>x.country==='EU27'),byCountry,
 payerSummary:{earlierRefundToNonEarners:sum(payerCases.map(x=>x.earlierRefundToNonEarners)),candidateRefundToNonEarners:sum(payerCases.map(x=>x.candidateRefundToNonEarners)),uncollected:sum(payerCases.map(x=>x.uncollected)),maximumWorkerBurden:Math.max(...payerCases.map(x=>x.maxWorkerBurden))},
 limitations:['The payroll counterparty correction has a structural accounting justification; macro forecasts and income-Gini predictions may improve or worsen. Every result is retained.','Household income tax and social-contribution source categories are broader than wages. Their worker/capital split and pooled wage mapping remain proxies, not a statutory tax microsimulation.','Aggregate fiscal coverage targets still follow the lagged nominal GDP budget base. No unverified tax elasticity, progressivity coefficient or pension-tax schedule is introduced.','Opening net-income Gini is used as a proxy for persistent gross earnings ranks; subsequent income-Gini drift is not validated using the opening-year target.','Synthetic households lack age-linked pension entitlements and actual survey tax records. Corporate/other fiscal coverage allocations and long-run finance remain simplified.','A tax request not collected within cash/payroll limits is forgone cash revenue, not a modeled tax receivable. Long-run debt extremes are not suppressed.'],
 payerCases,longRuns,interventions,scores,fiscalScores};
fs.writeFileSync(new URL('dist/data/revision131_validation.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,paths,annualSteps,maxResidual,maxDebtBridge,openingValuesPreserved,payerSummary:report.payerSummary,scoreCountries:report.scoreCountries},null,2));
