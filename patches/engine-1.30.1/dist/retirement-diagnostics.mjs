import {PARAMETERS} from './parameters.mjs';

// Expenditure accounting and paired co-movements, not a causal policy multiplier.
export function retirementPair(scenario,reference){
 const components={
  consumption:scenario.consumption-reference.consumption,
  government:scenario.government-reference.government,
  fixedInvestment:scenario.investment-reference.investment,
  inventories:scenario.inventoryChange-reference.inventoryChange,
  netExports:(scenario.exports-scenario.imports)-(reference.exports-reference.imports),
 };
 const realGDP=scenario.output-reference.output;
 const residual=realGDP-Object.values(components).reduce((a,b)=>a+b,0);
 if(Math.abs(residual)>1e-8*Math.max(1,scenario.output,reference.output))throw Error('Retirement comparison GDP components did not reconcile.');
 return {year:scenario.t,age:scenario.retirementAge-reference.retirementAge,realGDP,
  realGDPPercent:reference.output>0?100*realGDP/reference.output:null,
  labourForce:scenario.laborForce-reference.laborForce,
  benefits:scenario.publicPensionBenefits-reference.publicPensionBenefits,
  allocatedTax:scenario.publicPensionContributions-reference.publicPensionContributions,
  fundingGap:scenario.publicPensionGap-reference.publicPensionGap,
  publicDebtGDP:scenario.publicDebtGDP-reference.publicDebtGDP,
  components,residual};
}

export function retirementComparison(result,year){
 const differences=PARAMETERS.filter(d=>!d.design&&Math.abs(result.params[d.key]-result.reference[d.key])>1e-10).map(d=>d.key);
 const paths=result.paths??[],shocks=result.shocks??[];
 if(!differences.includes('retirementAge')&&!paths.some(x=>x.key==='retirementAge'))return null;
 const isolated=differences.every(k=>k==='retirementAge')&&paths.every(x=>x.key==='retirementAge')&&!shocks.length;
 const pairs=result.raw.scenario.map((r,i)=>retirementPair(r.rows[year],result.raw.baseline[i].rows[year]));
 return {isolated,pairs,interpretation:'Real-GDP components add exactly to the difference. Other values describe paired model outcomes, not empirically identified causes. A pension payment is a transfer, not GDP.'};
}

const n=x=>Number.isFinite(x)?x.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}):'Unavailable';
export function retirementComparisonHTML(result,year){
 const d=retirementComparison(result,year);if(!d)return '';
 const x=d.pairs[0],names={consumption:'Household consumption',government:'Government consumption',fixedInvestment:'Fixed investment',inventories:'Inventory change',netExports:'Net exports'};
 return `<h4>Retirement-age comparison · displayed seed · year ${year}</h4><p>${d.isolated?'Only the pension eligibility age differs in this paired experiment.':'Other settings or events also differ. These outcomes cannot be attributed to retirement age alone.'} Eligibility changes who can claim benefits and can change labour supply. Pension payments transfer income; they do not directly add to GDP. Spending, finance and firm responses can offset or reinforce the labour effect.</p><table><caption>Scenario minus reference · displayed seed</caption><tbody>${[['Eligibility age · years',x.age],['Labour force · opening = 100',x.labourForce],['Public old-age payments · nominal units',year?x.benefits:null],['Payments less allocated worker tax · nominal units',year?x.fundingGap:null],['Public debt / GDP · percentage points',x.publicDebtGDP],['Real GDP · % of reference',x.realGDPPercent]].map(([label,value])=>`<tr><th scope="row">${label}</th><td>${n(value)}</td></tr>`).join('')}</tbody></table><table><caption>Exact real-GDP difference · real model units</caption><tbody>${Object.entries(x.components).map(([k,v])=>`<tr><th scope="row">${names[k]}</th><td>${n(v)}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total real-GDP difference</th><td>${n(x.realGDP)}</td></tr></tfoot></table><p class="small muted">A higher GDP result does not establish that earlier retirement is beneficial. Check the labour force, retirement income and financing together, across seeds and response assumptions. The pension-age participation response is unestimated; household pension recipients are not linked to individual ages, and this is not a full lifetime pension-entitlement model.</p>`;
}
