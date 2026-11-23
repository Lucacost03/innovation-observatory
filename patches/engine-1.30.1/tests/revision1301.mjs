import fs from 'node:fs';
import assert from 'node:assert/strict';
import {simulate} from '../dist/engine.mjs';
import {simulate as frozen} from '../research/frozen_engine_v1_30/engine.mjs';
import {MODEL_VERSION} from '../dist/parameters.mjs';
import {retirementPair} from '../dist/retirement-diagnostics.mjs';
const root=new URL('../',import.meta.url),profiles=JSON.parse(fs.readFileSync(new URL('dist/data/profiles.json',root)));
const seeds=[2026,9945,17864],focus=['ITA','DEU','FRA','EU27','USA','CHN'];
const close=(a,b,n)=>assert(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),n);
let paths=0,annualSteps=0,unchangedEconomicValues=0,maxResidual=0,maxGDPSplitResidual=0,maxFundingErrorBefore=0,maxFundingErrorAfter=0;
const cases=[],funding=[],sensitivity=[],stress=[];
function run(fn,p,seed,options={snapshots:false}){const r=fn(p,seed,options);paths++;annualSteps+=r.rows.length-1;return r;}
function check(r){for(let t=0;t<r.rows.length;t++){
 const x=r.rows[t];assert(Object.values(x).every(Number.isFinite),'finite');maxResidual=Math.max(maxResidual,x.relativeResidual,x.financeResidual);assert(x.relativeResidual<1e-8&&x.financeResidual<1e-8,'sector accounts');
 close(x.nominalOutput,x.nominalConsumption+x.nominalGovernment+x.grossInvestment+x.nominalExports-x.nominalImports,'expenditure GDP');
 close(x.nationalSaving-x.grossInvestment,x.currentAccount,'S-I=CA');
 if(t){const b=r.rows[t-1];close(x.netForeignAssets-b.netForeignAssets,x.currentAccount,'NFA transactions');close(x.publicPensionGap,x.publicPensionBenefits-x.publicPensionContributions,'funding difference');close(x.publicDebtStockChange,x.publicDeficit+x.publicDebtStockFlowAdjustment,'debt financing bridge');}
}}
function retain(control,scenario,meta){
 for(let t=0;t<4;t++)assert.deepEqual(scenario.rows[t],control.rows[t],'no reform anticipation');
 const years=[4,5,10,20,40,120].filter(t=>t<scenario.rows.length);
 return {...meta,years:years.map(t=>{const x=retirementPair(scenario.rows[t],control.rows[t]);maxGDPSplitResidual=Math.max(maxGDPSplitResidual,Math.abs(x.residual));return x;})};
}
for(const profile of profiles){
 for(const seed of seeds){
  const p={...profile.params,periods:40};let control;
  for(const delta of [0,-2,2]){
   const options={snapshots:false,paths:delta?[{key:'retirementAge',start:4,end:4,target:p.retirementAge+delta,mode:'step'}]:[]};
   const a=run(frozen,p,seed,options),b=run(simulate,p,seed,options);check(b);
   for(let t=0;t<b.rows.length;t++)for(const [k,v]of Object.entries(a.rows[t]))if(!['publicPensionContributions','publicPensionGap'].includes(k)){assert.equal(b.rows[t][k],v,profile.code+' unchanged economic path '+k);unchangedEconomicValues++;}
   for(let t=1;t<b.rows.length;t++){
    const expected=b.rows[t].wageWithholding*p.publicPensionContributionShare/100;
    maxFundingErrorBefore=Math.max(maxFundingErrorBefore,Math.abs(a.rows[t].publicPensionContributions-expected));
    maxFundingErrorAfter=Math.max(maxFundingErrorAfter,Math.abs(b.rows[t].publicPensionContributions-expected));
   }
   if(!delta){control=b;if(seed===seeds[0])funding.push({country:profile.code,year:1,benefits:b.rows[1].publicPensionBenefits,collectedWorkerTax:b.rows[1].wageWithholding,assumedAllocationPercent:p.publicPensionContributionShare,previousAllocatedTax:a.rows[1].publicPensionContributions,correctAllocatedTax:b.rows[1].publicPensionContributions,previousGap:a.rows[1].publicPensionGap,correctGap:b.rows[1].publicPensionGap});}
   else cases.push(retain(control,b,{country:profile.code,seed,delta,response:p.retirementParticipationResponse}));
  }
 }
 console.log('Checked retirement and unchanged economy: '+profile.code);
}
for(const country of focus){const base=profiles.find(x=>x.code===country).params;
 for(const response of [0,1]){const p={...base,periods:40,retirementParticipationResponse:response},c=run(simulate,p,seeds[0]);check(c);
  for(const delta of [-2,2]){const r=run(simulate,p,seeds[0],{snapshots:false,paths:[{key:'retirementAge',start:4,end:4,target:p.retirementAge+delta,mode:'step'}]});check(r);sensitivity.push(retain(c,r,{country,seed:seeds[0],delta,response}));}
 }
 const p={...base,periods:120},c=run(simulate,p,seeds[0]);check(c);
 for(const delta of [-2,2]){const r=run(simulate,p,seeds[0],{snapshots:false,paths:[{key:'retirementAge',start:4,end:4,target:p.retirementAge+delta,mode:'step'}]});check(r);stress.push({...retain(c,r,{country,seed:seeds[0],delta,response:p.retirementParticipationResponse}),maximumPublicDebtGDP:Math.max(...r.rows.map(x=>x.publicDebtGDP)),minimumRealGDP:Math.min(...r.rows.map(x=>x.output)),priceBoundYears:r.rows.filter(x=>x.priceBoundHit).length});}
}
const summary=profiles.map(p=>({country:p.code,name:p.name,comparisons:cases.filter(x=>x.country===p.code).map(x=>({seed:x.seed,ageChange:x.delta,firstYearGDPPercent:x.years[0].realGDPPercent,finalGDPPercent:x.years.at(-1).realGDPPercent,finalLabourForceChange:x.years.at(-1).labourForce,finalDebtGDPChange:x.years.at(-1).publicDebtGDP}))}));
const report={status:'PASS',modelVersion:MODEL_VERSION,executedAt:new Date().toISOString(),paths,annualSteps,unchangedEconomicValues,maxResidual,maxGDPSplitResidual,maxFundingErrorBefore,maxFundingErrorAfter,
 protocol:'All 30 presets, three common seeds, control and +/-2 pension-age years from year 4, 40-year horizon; each path paired exactly against frozen 1.30.0. Six focus economies also use participation-response assumptions 0 and 1 and 120-year stress paths. Every case is retained; no GDP-sign tuning or coefficient search. Accounting comparison, not an empirical forecast-accuracy test.',
 corrections:['Pension tax allocation and signed funding difference now use final collected worker taxes after fiscal reconciliation, without duplicate taxation or economic transactions.','Saved 1.30.0 parameter edits and schedules are retained.','Retirement comparisons expose exact real-GDP spending components and distinguish isolated age experiments from combined interventions.'],
 limitations:['No empirically estimated country-specific retirement-age participation response; 0/0.5/1 are illustrative sensitivity assumptions, not confidence bounds.','Eligibility is a representative age threshold, not a full country pension-entitlement schedule.','Pension payments are allocated among synthetic households without individual age-linked contribution histories.','The worker-tax allocation is an assumption, not an observed separate pension fund.','Deficit financing, consumption, hiring and firm innovation responses remain unestimated. Mixed GDP signs and extreme debt paths are not suppressed.','Three seeds do not establish robust empirical reform effects. Long-run paths are stress tests, not forecasts.','The correction improves reporting accuracy; economic paths and empirical GDP forecast errors are unchanged.'],
 sources:[{title:'OECD, Is it worth raising the normal retirement age? (2024)',url:'https://www.oecd.org/en/publications/is-it-worth-raising-the-normal-retirement-age_5f2a3b40-en.html'},{title:'ECB, Economic Bulletin 2/2018, population ageing and pension reforms',url:'https://www.ecb.europa.eu/press/economic-bulletin/html/eb201802.en.html'}],
 summary,funding,cases,sensitivity,stress};
fs.writeFileSync(new URL('dist/data/revision1301_validation.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,paths,annualSteps,unchangedEconomicValues,maxResidual,maxGDPSplitResidual,maxFundingErrorBefore,maxFundingErrorAfter}));
