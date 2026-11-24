import {PARAMETERS,DEFAULTS} from './parameters.mjs';
export function inputInterpretation(definition,source){
 const note=source?.note??definition.help;
 if(definition.key==='profitTax'&&source)return note+' With source-budget coverage enabled, this setting rescales observed corporate-tax receipts relative to the baseline setting. It is not an observed national statutory tax rate; zero turns off represented business-income-tax receipts.';
 return definition.key==='initialParticipationRate'?note.replace('The model holds this participation share fixed within its changing working-age cohort.','This is the opening participation benchmark. Country age profiles and changing cohorts determine subsequent participation; pension-age responses remain scenario assumptions.'):note;
}
export const MECHANISM_SOURCES=[
 {title:'European Commission JRC (2020): technology gaps and firm dynamics',url:'https://publications.jrc.ec.europa.eu/repository/handle/JRC121430',supports:'International knowledge spillovers and entry/exit interact with technological catch-up. Does not identify this simulator’s hazard or adoption law.'},
 {title:'Eurostat: business demography',url:'https://ec.europa.eu/eurostat/en/web/business-demography',supports:'Enterprise birth/death counts and employment by size. Broad aggregate rates are not causal estimates of productivity-dependent firm failure.'},
 {title:'OECD (2015): frontier firms, diffusion and public policy',url:'https://www.oecd.org/en/publications/frontier-firms-technology-diffusion-and-public-policy_5jrql2q2jj7b-en.html',supports:'Uneven adoption, absorptive capacity and reallocation. Does not estimate this model’s diffusion or innovation coefficients.'},
 {title:'European Commission (2026): productivity dispersion and convergence',url:'https://economy-finance.ec.europa.eu/publications/catch-me-if-you-can-productivity-dispersion-and-convergence-european-industries_en',supports:'Observed catch-up patterns in 19 countries, 2005–2022. Labor productivity is not the model’s latent knowledge stock.'},
 {title:'Eurostat: GERD by expenditure type',url:'https://ec.europa.eu/eurostat/databrowser/product/page/RD_E_GERDCOST',supports:'Separates labor, other current and capital expenditure. Total GERD cannot be treated as pure wages.'}
];
export function buildParameterAudit(profile){return PARAMETERS.map(d=>{
 const s=profile.provenance?.[d.key],design=d.design||d.key==='initialTechnology',basis=s?.status??(design?'design':'assumed');
 let test='Accounting, bounds and seeded timing checks; no empirical coefficient validation.',need='Observed decision responses and agent distributions, plus independent dynamic validation.';
 if(design){test='Numerical design or normalization; not an estimated economic coefficient.';need='Convergence and sensitivity checks across numerical designs.';}
 else if(['diffusion','absorptiveCapacity','humanCapital','networkDegree','networkEvolution','adoptionLag','frontierAccess','frontierGap','innovationEfficiency','innovationStep','innovationDispersion','frontierGrowth','publicResearchReturn','foreignContact','foreignAdoption','foreignLeaderPremium'].includes(d.key)){test='Qualitative mechanism support only. Adoption sign and timing are tested; magnitude is unidentified.';need='Linked firm innovation, adoption, network, R&D and productivity panels; an identification design.';}
 else if(['consumptionIncome','consumptionWealth','wealthInequality','dividendShare','bankDividend'].includes(d.key)){test='Unestimated spending/distribution rule. Macro flow ratios do not identify marginal responses.';need='Household wealth/income and firm dividend data with estimated response functions.';}
 else if(s&&s.status!=='assumed'){test='Source observation or explicit proxy mapping checked. Its use in a dynamic decision rule is not validated.';need='Independent moment and response tests for the mapped mechanism; richer sector coverage.';}
 return{key:d.key,label:d.label,group:d.group,preset:profile.params[d.key]??DEFAULTS[d.key],unit:d.unit,inputBasis:basis,source:s?.dataset??'No matching estimate',interpretation:inputInterpretation(d,s),validation:test,requiredEvidence:need,causalCoefficientEstimated:false};
});}
