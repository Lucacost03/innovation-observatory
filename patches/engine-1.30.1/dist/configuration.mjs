import {DEFAULTS,PARAMETERS,MODEL_VERSION,sanitize} from './parameters.mjs';
import {validateTimeline,validateShocks} from './engine.mjs';
import {isNumericInput} from './shocks.mjs';
export {MODEL_VERSION};
export const STORAGE_KEY='innovation-observatory-config-v2';
const compatibleReportingVersion=version=>version===MODEL_VERSION||version==='1.30.0';
const retiredPriceKeys=new Set(['inflationAnchor','priceDemandResponse','priceCostResponse']);

export function resetEconomyParameters(preset, previous) {
 const design=Object.fromEntries(PARAMETERS.filter(d=>d.design).map(d=>[d.key,previous[d.key]??preset[d.key]]));
 return sanitize({...preset,...design});
}

export const earlierSwitches={policyDynamics:0,currencyDynamics:0,tradeEnabled:0,financialMarket:0};

export function restoreLoanSpread(saved={}, preset={}) {
 if(saved.loanSpread!=null||saved.loanRate==null)return saved;
 const policyRate=saved.initialPolicyRate??preset.initialPolicyRate??DEFAULTS.initialPolicyRate;
 return {...saved,loanSpread:Number(saved.loanRate)-policyRate};
}

export function restoreMacroInputs(raw={},profile,version,paths=[]){
 const preset=profile.params,prior=profile.macroCalibrationPrior??{},out={...raw};
 if(!compatibleReportingVersion(version)){
  for(const key of ['governmentShare','initialGovernmentShare','investmentShare','exportDemand','importShare','frontierGrowth','rdBusiness']){
   const old=prior[key]??DEFAULTS[key];
   if(Number.isFinite(old)&&Number.isFinite(raw[key])&&(Math.abs(raw[key]-old)<1e-8||key==='rdBusiness'&&profile.code==='CHN'&&old>10&&raw[key]===10))out[key]=preset[key];
  }
  const frontierEdited=paths.some(x=>x.key==='frontierGrowth')||Number.isFinite(raw.frontierGrowth)&&Math.abs(raw.frontierGrowth-(prior.frontierGrowth??DEFAULTS.frontierGrowth))>1e-8;
  if(raw.domesticForecast==null)out.domesticForecast=frontierEdited?0:preset.domesticForecast;
 }
 for(const key of ['openingMacroCalibration','initialExportSales','initialInventoryChange','observedCurrentAccount','observedTFPGrowth'])out[key]=preset[key]??DEFAULTS[key];
 return restoreFiscalInputs(out,profile,version,raw);
}

export function restoreFiscalInputs(raw={},profile,version,original=raw){
 if(compatibleReportingVersion(version))return raw;
 const out={...raw};
 for(const [key,old]of Object.entries(profile.fiscalPriorDefaults??{}))if(Number.isFinite(old)&&Number.isFinite(original[key])&&Math.abs(original[key]-old)<1e-8)out[key]=profile.params[key];
 for(const [key,old]of Object.entries(profile.revision130PriorDefaults??{}))if(Number.isFinite(old)&&Number.isFinite(original[key])&&Math.abs(original[key]-old)<1e-8)out[key]=profile.params[key];
 for(const [key,old]of Object.entries(profile.revision129PriorDefaults??{}))if(Number.isFinite(old)&&Number.isFinite(original[key])&&Math.abs(original[key]-old)<1e-8)out[key]=profile.params[key];
 for(const [key,old]of Object.entries(profile.revision127PriorDefaults??{}))if(Number.isFinite(old)&&Number.isFinite(original[key])&&Math.abs(original[key]-old)<1e-8)out[key]=profile.params[key];
 for(const [key,old]of Object.entries(profile.revision126PriorDefaults??{}))if(Number.isFinite(old)&&Number.isFinite(original[key])&&Math.abs(original[key]-old)<1e-8)out[key]=profile.params[key];
 for(const key of ['tariffSettlement','tariffExternalShare','tariffCollectionShare','fiscalCapitalPath','ageParticipation','importCostFeedback','policyRateIncrement','policyRateRangeWidth','businessCapitalMarket','housingFinanceMix','ageCohorts','incomeAccountingAlignment','foreignGovBondMarket','foreignGovOpeningKnown','initialForeignGovDebt','initialForeignGovBonds','initialForeignGovOtherDebt','retirementAge','initialRetirementAge','postRetirementParticipation','retirementParticipationResponse','foreignGovDemandShare','foreignGovMarketSensitivity'])if(original[key]==null)out[key]=profile.params[key]??DEFAULTS[key];
 for(const key of ['fiscalCoverage','restrictedBenefitGDP'])if(original[key]==null)out[key]=profile.params[key]??DEFAULTS[key];
 return out;
}

export function restoreEducationQuality(raw={},preset={}){
 const anchor=preset.initialEducationQuality??1;
 const previousAnchor=Number.isFinite(raw.initialEducationQuality)&&raw.initialEducationQuality>0?raw.initialEducationQuality:1;
 const ratio=anchor/previousAnchor;
 return {...raw,initialEducationQuality:anchor,initialLearningScore:preset.initialLearningScore??DEFAULTS.initialLearningScore,
  publicEducationQuality:raw.publicEducationQuality==null?preset.publicEducationQuality:raw.publicEducationQuality*ratio,
  privateEducationQuality:raw.privateEducationQuality==null?preset.privateEducationQuality:raw.privateEducationQuality*ratio};
}
export function restoreEducationPaths(paths,raw={},preset={}){
 if(!Array.isArray(paths))return paths;
 const ratio=(preset.initialEducationQuality??1)/(Number.isFinite(raw.initialEducationQuality)&&raw.initialEducationQuality>0?raw.initialEducationQuality:1);
 return paths.map(path=>['publicEducationQuality','privateEducationQuality'].includes(path.key)&&isNumericInput(path.target)?{...path,target:Number(path.target)*ratio}:path);
}

export function restoreTimeline(paths, savedVersion) {
 const normalized=Array.isArray(paths)&&savedVersion!==MODEL_VERSION?paths.map(path=>path.key==='neutralPolicyRate'&&Number(path.target)<0?{...path,target:0}:path):paths;
 const input = Array.isArray(normalized)?normalized.filter(path=>path.key!=='tradeEnabled'):normalized??[];
 const retired = {retiredKoreaPaths:0, retiredPricePaths:0, retiredLoanPaths:0, retiredCreditPaths:0};
 if (savedVersion === MODEL_VERSION || !Array.isArray(input)) {
  return {...retired, paths:validateTimeline(input)};
 }
 const supported = input.filter(path => {
  if(path.key==='koreaGrowth')retired.retiredKoreaPaths++;
  else if(retiredPriceKeys.has(path.key))retired.retiredPricePaths++;
  else if(path.key==='loanRate')retired.retiredLoanPaths++;
  else if(path.key==='tradeEnabled')return false;
  else if(path.key==='publicCreditWeight')retired.retiredCreditPaths++;
  else return true;
  return false;
 });
 return {...retired, paths:validateTimeline(supported)};
}

export function restoreConfiguration(saved,profiles){
 if(!saved||!profiles.some(p=>p.code===saved.country))return null;
 const p=profiles.find(p=>p.code===saved.country),migrated=saved.modelVersion!==MODEL_VERSION;
 saved={...saved,paths:restoreEducationPaths(saved.paths,saved.params,p.params),params:restoreEducationQuality(restoreMacroInputs(saved.params,p,saved.modelVersion,saved.paths??[]),p.params),reference:restoreEducationQuality(restoreMacroInputs(saved.reference,p,saved.modelVersion,saved.paths??[]),p.params)};
 if(['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.8.0','1.9.0','1.10.0','1.11.0'].includes(saved.modelVersion)){
  const params=sanitize({...DEFAULTS,...p.params,foreignTechDispersion:0,priceDynamics:0,...earlierSwitches,...restoreLoanSpread(saved.params,p.params)});
  const reference=sanitize({...DEFAULTS,...p.params,foreignTechDispersion:0,priceDynamics:0,...earlierSwitches,...restoreLoanSpread(saved.reference,p.params)});
  const timeline=restoreTimeline(saved.paths,saved.modelVersion);
  return{migrated:true,rebuildPreset:false,retiredKoreaPaths:timeline.retiredKoreaPaths,retiredPricePaths:timeline.retiredPricePaths,retiredLoanPaths:timeline.retiredLoanPaths,retiredCreditPaths:timeline.retiredCreditPaths,
   employmentAdjusted:saved.params?.employmentRate>params.employmentRate||saved.reference?.employmentRate>reference.employmentRate,
   state:{...saved,country:p.code,params,reference,paths:timeline.paths,shocks:validateShocks(saved.shocks??[]),modelVersion:MODEL_VERSION}};
 }
 if(saved.modelVersion==='1.1.0'){
  const normalize=raw=>sanitize({...p.params,foreignTechDispersion:0,priceDynamics:0,...earlierSwitches,...restoreLoanSpread(raw,p.params),
   ...(raw?.fiscalAdjustment===.04?{fiscalAdjustment:0}:{}),...(raw?.publicResearchReturn===.15?{publicResearchReturn:0}:{}),
   rdLaborShare:p.params.rdLaborShare??DEFAULTS.rdLaborShare});
  const {paths,...retired}=restoreTimeline(saved.paths,saved.modelVersion);
  return{...retired,migrated:true,rebuildPreset:false,state:{...saved,country:p.code,params:normalize(saved.params),
   reference:normalize(saved.reference),paths,shocks:validateShocks(saved.shocks),modelVersion:MODEL_VERSION}};
 }

 if(migrated&&!['1.12.0','1.13.0','1.14.0','1.14.1','1.15.0','1.16.0','1.17.0','1.18.0','1.18.1','1.19.0','1.19.1','1.20.0','1.21.0','1.22.0','1.23.0','1.24.0','1.25.0','1.26.0','1.27.0','1.28.0','1.29.0','1.30.0'].includes(saved.modelVersion)){
  const design=Object.fromEntries(PARAMETERS.filter(d=>d.design&&d.key!=='burnIn').map(d=>[d.key,saved.params?.[d.key]??DEFAULTS[d.key]]));
  const params=sanitize({...DEFAULTS,...p.params,...design});
  return {migrated:true,rebuildPreset:true,state:{country:p.code,params,reference:{...params},referenceLabel:p.name+' · 2023 preset',paths:[],shocks:[],preset:'research',modelVersion:MODEL_VERSION}};
 }
 const state={country:p.code,params:sanitize({...p.params,...saved.params,foreignPoolId:p.params.foreignPoolId}),reference:sanitize({...p.params,...saved.reference,foreignPoolId:p.params.foreignPoolId}),referenceLabel:String(saved.referenceLabel??p.name+' · reference').slice(0,100),paths:restoreTimeline(saved.paths,saved.modelVersion).paths,shocks:validateShocks(saved.shocks),preset:saved.preset??'custom',modelVersion:MODEL_VERSION};
 let employmentDefinitionUpdated=false;
 if(migrated)for(const side of ['params','reference']){
  const old=p.employmentDefinitionPrior?.employmentRate;
  if(saved[side]?.initialParticipationRate==null){
   state[side].initialParticipationRate=p.params.initialParticipationRate;
   if(Number.isFinite(old)&&Math.abs(saved[side]?.employmentRate-old)<1e-8){state[side].employmentRate=p.params.employmentRate;employmentDefinitionUpdated=true;}
  }
 }
 let foreignProjectionPreserved=false;
 if(migrated){
  const growthKeys=['usGrowth','chinaGrowth','rowGrowth'];
  const customGrowth=state.paths.some(path=>growthKeys.includes(path.key))||['params','reference'].some(side=>growthKeys.some(key=>saved[side]?.[key]!=null&&Math.abs(saved[side][key]-p.params[key])>1e-8));
  if(customGrowth)for(const side of ['params','reference'])if(saved[side]?.foreignForecast==null){state[side].foreignForecast=0;foreignProjectionPreserved=true;}
 }
 let capitalInputsUpdated=0;
 if(migrated&&!['1.15.0','1.16.0','1.17.0','1.18.0','1.18.1','1.19.0','1.19.1','1.20.0','1.21.0','1.22.0','1.23.0','1.24.0','1.25.0','1.26.0','1.27.0','1.28.0','1.29.0','1.30.0'].includes(saved.modelVersion))for(const side of ['params','reference']){
  for(const key of ['foreignPortfolioWeight','financialIncomeTax','wealthTax']){
   if(saved[side]?.[key]===0&&p.params[key]>0){state[side][key]=p.params[key];capitalInputsUpdated++;}
  }
  const previous=p.capitalInputPriorDefaults?.incomeTax;
  if(Number.isFinite(previous)&&Math.abs(saved[side]?.incomeTax-previous)<1e-8){state[side].incomeTax=p.params.incomeTax;capitalInputsUpdated++;}
 }
 return {migrated,capitalInputsUpdated,foreignProjectionPreserved,employmentDefinitionUpdated,state};
}
export function inputStatus(definition,params,profile){
 const source=profile.provenance?.[definition.key],baseline=profile.params[definition.key]??definition.value;
 if(Math.abs(params[definition.key]-baseline)>1e-9)return {status:'edited',note:'Your value differs from this preset. '+(source?.note??definition.help)};
 return {status:source?.status??(definition.design?'design':'assumed'),note:source?.note??definition.help};
}
