import {settleImportDuty}from './tariff-settlement.mjs';
import {governmentBalanceMetrics,publicDebtFlowMetrics}from './government-balance.mjs';
import {importedCostPressure}from './import-cost.mjs';
import {PRIVATE_DEBT_FLOWS,privateDebtFlows}from './private-debt.mjs';
import {settleBusinessCapital}from './capital-market.mjs';
import {inferFinalEffects} from './inference.mjs';
import {SOVEREIGN_FLOWS,initializeSovereignForeign,sovereignForeignTotal,foreignSovereignQuote,issueForeignSovereign,redeemForeignSovereign,sovereignForeignMetrics} from './sovereign-foreign.mjs';
import {defenseResearchPolicy} from './defense-policy.mjs';
import {FISCAL_FLOWS,fiscalContext,settleFiscalCoverage,openingFiscalMetrics} from './fiscal-coverage.mjs';
import {educationTransmission} from './education-transmission.mjs';
import {homeFrontierGrowth,settleOtherForeignIncome} from './macro-channels.mjs';
import {PARAMETERS,DEFAULTS,METRICS,MODEL_VERSION,sanitize,metricValue} from './parameters.mjs';
import {transition} from './demography.mjs';
import {foreignProviders,initializeForeign,learnForeign,foreignGrowthRates,foreignRowMetrics} from './foreign.mjs';
import {LABOR_FORCE,matchEmployment} from './labor.mjs';
import {advancePrices,spendingTurnover} from './prices.mjs';
import {advanceMonetary,initializeMonetary} from './monetary.mjs';
import {publicPurchases,bankPublicExposure,lendingRoom,savingBalances,redeemPublicBonds} from './fiscal.mjs';
import {tradeConditions,addImportPrices,clearGoodsMarket} from './trade.mjs';
import {HouseholdMarket,corporateDebt,totalBusinessDebt,fundExistingFirms,payHolders,payFirmOwners,repayBusinessDebt,marketHoldings,foreignCashYield,payForeignIncome,financialWealth,publicEquityValue} from './finance.mjs';
import {publicBudgetMetrics} from './public-budget.mjs';
import {incomeAccount} from './income-account.mjs';
import {CENTRAL_BANK_FLOWS,initializeCentralBank,purchaseAssets,settleCentralBankIncome,centralBankMetrics} from './asset-purchases.mjs';
import {Society,SOCIAL_FLOWS} from './society.mjs';
import {distributionStats} from './distribution.mjs';
import {householdMetrics,debtMetrics,giniWeights} from './distribution.mjs';
import {validateShocks,shockValues,isNumericInput} from './shocks.mjs';
export {validateShocks} from './shocks.mjs';
const sum=a=>a.reduce((s,x)=>s+x,0),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function uniform(seed,t,i,stream=0){let x=(seed^Math.imul(t+10007,0x9e3779b1)^Math.imul(i+17,0x85ebca6b)^Math.imul(stream+3,0xc2b2ae35))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return((x>>>0)+.5)/4294967296;}
const NO_SECTOR_FLOWS = {
 businessCapitalPurchases:0,businessCapitalReceipts:0,businessUnfundedInvestment:0,businessUnsoldCapitalOrders:0,businessCapitalPaymentResidual:0,householdDepositInterest:0, firmDepositInterest:0, financialIncomeTaxPaid:0, wealthTaxPaid:0, importTariffRevenue:0,tariffForeignDuty:0,tariffCollectionFees:0,tariffNetExternalTransfer:0,governmentTariffTax:0,
 financialMarketActive:0, marketBudget:0, marketPurchases:0, marketGovernmentFunding:0, ventureFunding:0, businessEquityIssued:0,
 corporateBondsIssued:0, corporateBondInterest:0, corporateBondRepayments:0, corporateBondWriteoffs:0,
 corporateBondRecoveries:0, ventureEquityRetired:0, businessEquityRetired:0,
 wageWithholding:0, profitTaxPaid:0, firmDividends:0, bankDividends:0,
 businessCreditIssued:0, businessLoanRepayments:0, exitLoanRepayments:0,
 liquidationDistributions:0, householdBondPurchases:0, bankBondPurchases:0,
 governmentInterestToHouseholds:0, governmentInterestToBank:0,
 governmentFirmDividends:0,governmentLiquidationProceeds:0,publicBondRedemptions:0,publicBondRedemptionsToBank:0,publicBondRedemptionsToHouseholds:0,
 debtRestructurings:0,financialExits:0,lateInterestFirms:0,debtServiceShortfall:0,
 cashSupport:0, unemploymentBenefits:0, foreignGainUSA:0, foreignGainCHN:0, foreignGainROW:0,foreignGainEUR:0,
 foreignContactsUSA:0, foreignContactsCHN:0, foreignContactsROW:0,foreignContactsEUR:0, foreignTailAdopters:0, foreignFromLowerMean:0
};
const normal=(s,t,i,k=0)=>Math.sqrt(-2*Math.log(uniform(s,t,i,k)))*Math.cos(2*Math.PI*uniform(s,t,i,k+1));
const weights=a=>{let z=sum(a);return a.map(x=>x/z);};
export function gini(values){let a=values.slice().sort((x,y)=>x-y),z=sum(a);return z<=1e-12?0:clamp(2*sum(a.map((x,i)=>(i+1)*x))/(a.length*z)-(a.length+1)/a.length,0,1);}
export function validateTimeline(paths=[]){if(!Array.isArray(paths)||paths.length>20)throw Error('Use up to 20 parameter paths.');return paths.map(x=>{const d=PARAMETERS.find(p=>p.key===x?.key&&p.dynamic);if(!d)throw Error('Only behavioral parameters can change over time.');if(![x.start,x.end,x.target].every(isNumericInput))throw Error('Complete every parameter target and year; use an explicit zero where intended.');let start=Number(x.start),end=Number(x.end),target=Number(x.target);if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>120||!Number.isFinite(target)||target<d.min||target>d.max||(d.integer&&!Number.isInteger(target))||!['step','ramp','pulse'].includes(x.mode))throw Error('Invalid parameter timeline for '+d.label);return{key:x.key,start,end,target,mode:x.mode};});}
export function effectiveParameters(base,t,paths){let p={...base};for(const x of paths){if(t<x.start)continue;if(x.mode==='pulse'&&t>x.end)continue;let w=x.mode==='ramp'?clamp((t-x.start+1)/(x.end-x.start+1),0,1):1;p[x.key]+=w*(x.target-p[x.key]);}for(const d of PARAMETERS)if(d.integer)p[d.key]=Math.round(p[d.key]);return p;}
// The model is a representative economy. Source-year stocks are scales;
// decision laws and synthetic distributions are not identified causal estimates.
const foreignTechnologyIndex=donors=>Math.exp(sum(Object.values(donors).map(Math.log))/Object.keys(donors).length);
export function adoptKnowledge(knowledge,target,rate){return knowledge+clamp(rate,0,1)*Math.max(0,target-knowledge);}
export class Economy {
 constructor(raw,seed){
  this.p=sanitize(raw);this.elapsedYears=0;const p=this.p;this.seed=seed;this.wage=p.laborShare/p.employmentRate;this.initialResearchPayroll=p.rdBusiness*p.rdLaborShare/100;
  this.market=null;this.society=new Society(p);this.centralBank=initializeCentralBank();
  const openingHousingServices=p.housingEnabled?p.actualRentGDP+p.imputedRentGDP:0,productiveCapital=100*p.capitalOutputRatio-this.society.housing0;
  this.openingStartupCapital=productiveCapital/p.firms;
  if(productiveCapital<=0)throw Error('Dwelling structures exceed total opening capital.');
  this.expectedBankLossRate=0;
  this.foreignSovereign=initializeSovereignForeign(p);this.sovereignIssued=0;this.foreignFundingQuote={share:0};this.initialForeignPublicInterest=sovereignForeignTotal(this)*p.bondRate/100;
  this.gov={cash:p.governmentDeposit};this.bank={equity:p.bankEquity,bonds:(p.initialPublicDebt-sovereignForeignTotal(this))*p.bankGovernmentShare/100,reserves:0,netForeignPosition:0,foreignAssets:p.initialGrossForeignPosition,foreignLiabilities:p.initialGrossForeignPosition};
  this.frontier=p.initialTechnology*p.frontierGap;this.foreign=initializeForeign(p);this.foreignOrigin={...this.foreign};this.foreignHistory=[{...this.foreign}];this.estates=[];this.events=[];this.totalEntries=0;this.totalExits=0;this.lastOutput=100;this.lastGDPPerCapita=100;this.lastTechnology=p.initialTechnology;
  this.initialRestrictedBenefits=fiscalContext(p)?p.restrictedBenefitGDP:0;
  const c=100-p.initialGovernmentShare-p.investmentShare-p.initialInventoryChange-openingHousingServices-this.initialRestrictedBenefits;
  if(c<0)throw Error('Opening public consumption plus fixed investment exceeds initial GDP. Reduce those two shares.');
  const initialImportShare=tradeConditions(100,1,1,p).importBudgetShare;
  this.initialExports=p.tradeEnabled?Math.min(p.openingMacroCalibration?p.initialExportSales:p.exportDemand,.9*c):0;
  this.initialConsumption=(c-this.initialExports)/(1-initialImportShare/((1+p.importTariff/100)*(1+p.consumptionTax/100)));
  this.initialImports=this.initialConsumption*initialImportShare/((1+p.importTariff/100)*(1+p.consumptionTax/100));
  this.initialCurrentAccount=p.openingMacroCalibration?this.initialExports-this.initialImports+p.otherForeignIncomeGDP+p.initialHouseholdForeignAssets*foreignCashYield(p)/100:0;
  this.initialVAT=this.initialConsumption-this.initialConsumption/(1+p.consumptionTax/100);
  this.initialTariff=this.initialImports*p.importTariff/100;
  this.initialDutySettlement=settleImportDuty(this.initialTariff,p);
  if(p.openingMacroCalibration)this.initialCurrentAccount-=this.initialDutySettlement.tariffNetExternalTransfer;
  this.initialDomesticConsumption=this.initialConsumption*(1-initialImportShare)/(1+p.consumptionTax/100);
  this.initialGoods=100-this.initialVAT-this.initialTariff-openingHousingServices;
  const priorConsumption=(c+openingHousingServices-this.initialExports)/(1-initialImportShare/((1+p.importTariff/100)*(1+p.consumptionTax/100))),priorImports=priorConsumption*initialImportShare/((1+p.importTariff/100)*(1+p.consumptionTax/100));
  const priorGoods=100-priorConsumption+priorConsumption/(1+p.consumptionTax/100)-priorImports*p.importTariff/100;
  this.moneyVelocityScale=this.initialGoods/priorGoods;this.initialHousingServices=openingHousingServices;
  this.openingConsumerPrice=1+p.consumptionTax/100;
  const openingPrices={producerPrice:1,consumerPrice:this.openingConsumerPrice};
  this.prices=advancePrices(openingPrices,this.openingConsumerPrice,{...p,priceDynamics:0},
    {money:p.householdWealth+p.firmLiquidity,velocity:p.initialMoneyVelocity,goods:this.initialGoods});
  this.prices.importConsumerPrice=this.openingConsumerPrice*(1+p.importTariff/100);
  this.prices.goodsConsumerPriceIndex=100;
  this.foreignPrice=1;this.importInputCostIndex=100;Object.assign(this.prices,{importInputCostIndex:100,importInputCostGrowth:0,importedCostPriceContribution:0});
  this.foreignDemand=1;
  this.homeProjection=100;this.lastTFP=100;this.lastTechnologyTFP=100;
  this.hasTraded=false;
  this.monetary=initializeMonetary(p);
  this.lastInflation=p.initialPolicyInflation;
  this.openingForeignTechnology=foreignTechnologyIndex(this.foreign);
  this.lastGoods=this.initialGoods;
  this.publicTrend=100;
  const cw=weights(Array.from({length:p.firms},(_,i)=>Math.exp(p.firmSizeDispersion*normal(seed,-1,i,10))));
  const aa=Array.from({length:p.firms},(_,i)=>Math.exp(p.heterogeneity*normal(seed,-1,i,12))),avg=sum(aa.map((a,i)=>a*cw[i]));
  this.firms=cw.map((share,i)=>({id:i,birthTime:0,initialWeight:share,foreignGain:0,foreignSource:null,foreignTarget:0,exitProbability:0,capital:productiveCapital*share,loan:productiveCapital*share*p.initialLeverage,
   cash:p.firmLiquidity*share,inventory:p.inventoryTarget*share,a:p.initialTechnology*aa[i]/avg,employment:p.employmentRate*share,
   hours:1,util:p.initialUtilization/100,share,sales:(100-p.investmentShare-this.initialVAT)*share,
   output:this.initialGoods*share,marketGDP:100*share,initialGDP:100*share,rd:this.initialResearchPayroll*share,researchHours:this.initialResearchPayroll*share/this.wage,ownKnowledgeGain:0,diffusionGain:0,learningGap:0,
   arrears:0,restructured:0,innovation:false,grant:0}));
  const initialBookEquity=sum(this.firms.map(f=>Math.max(0,f.capital+f.inventory+f.cash-totalBusinessDebt(f))));
  if(p.initialPublicEquity>initialBookEquity+1e-8)throw Error('Opening public equity exceeds the firms’ book equity. Increase capital/cash or reduce opening business debt.');
  const publicOwnership=initialBookEquity>0?p.initialPublicEquity/initialBookEquity:0;
  this.firms.forEach(f=>{f.publicOwnership=publicOwnership;});
  const wealthRanks=Array.from({length:p.households},(_,i)=>normal(seed,-1,i,14));
  const incomeRanks=wealthRanks.map((rank,i)=>.4*rank+Math.sqrt(.84)*normal(seed,-1,i,18));
  const hw=giniWeights(wealthRanks,p.initialWealthGini),iw=giniWeights(incomeRanks,p.initialIncomeGini);
  // The disposable-income moment is a proxy for persistent earnings ranks.
  // Transfers, unemployment and capital income can change the later Gini.
  const ew=iw;
  this.households=hw.map((w,i)=>({id:i,cash:p.householdWealth*w,bonds:(p.initialPublicDebt-sovereignForeignTotal(this))*(1-p.bankGovernmentShare/100)*w,income:p.initialIncome*iw[i],earningsWeight:ew[i]*p.households,ownership:w,employed:0,foreignAssets:p.initialHouseholdForeignAssets*w,foreignAssetCost:p.initialHouseholdForeignAssets*w}));
  // Existing loan stocks are matched against the observed deposits and equity.
  // They are not treated as a second initial cash endowment.
  this.society.initialize(this);
  this.bank.termFunding=p.housingEnabled?Math.min(this.society.mortgages(this.households),Math.max(0,this.loans()+this.bank.bonds+this.society.mortgages(this.households)-p.householdWealth-p.firmLiquidity-p.governmentDeposit-p.bankEquity)):0;
  this.households.forEach(h=>{h.bankTermClaims=this.bank.termFunding*h.ownership;});
  this.bank.reserves=p.householdWealth+p.firmLiquidity+p.governmentDeposit+p.bankEquity+this.bank.termFunding-this.loans()-this.bank.bonds-this.society.mortgages(this.households);
  if(this.bank.reserves< -1e-8)throw Error('Opening financial stocks are inconsistent: increase deposits/equity or reduce initial business loans and the bank share of public debt.');
  this.bank.reserves=Math.max(0,this.bank.reserves);this.endowment=this.bank.reserves;
  const initialProductionHours=Math.max(1e-6,p.employmentRate-this.initialResearchPayroll/this.wage);
  this.lp=this.initialGoods/initialProductionHours/p.initialTechnology;
  this.kp=this.initialGoods/(productiveCapital*p.initialUtilization/100*p.initialTechnology);
  this.tfpScale=this.initialGoods/(Math.pow(productiveCapital,p.tfpCapitalShare/100)*Math.pow(initialProductionHours,1-p.tfpCapitalShare/100));
  this.cohort=new Map(this.firms.map(f=>[f.id,{weight:f.initialWeight,a:f.a}]));
  this.techHistory=[new Map(this.firms.map(f=>[f.id,f.a]))];this.links=this.firms.map((f,i)=>{
   const set=new Set(),degree=Math.min(p.firms-1,p.networkDegree);
   for(let j=1;j<=degree;j++){let k=(i+(j%2?Math.ceil(j/2):-Math.ceil(j/2))+p.firms)%p.firms;
    if(uniform(seed,-2,i,j)<p.rewiring)k=Math.floor(uniform(seed,-3,i,j)*p.firms);
    let tries=0;while((k===i||set.has(k))&&tries++<p.firms)k=(k+1)%p.firms;if(k!==i)set.add(k);
   }return [...set];
  });this.check();
 }
 loans(){return sum(this.firms.map(f=>f.loan));}
 dormantCapital(){return sum(this.estates.map(e=>e.capital));}
 totalInventory(){return sum(this.firms.map(f=>f.inventory))+sum(this.estates.map(e=>e.inventory));}
 publicDebt(){return sovereignForeignTotal(this)+this.bank.bonds+sum(this.households.map(h=>h.bonds))+this.centralBank.bonds;}
 ensureGov(amount,p=this.p){
  const requestedGap=Math.max(0,amount-this.gov.cash);if(!requestedGap)return;
  const gap=requestedGap-issueForeignSovereign(this,requestedGap);
  const target=gap*(1-p.bankGovernmentShare/100);
  let householdPurchase=0;
  if(this.market){
   const issue=this.market.purchase('governmentBonds',target);
   if(issue){
    householdPurchase=issue.amount;
    this.households.forEach((h,i)=>{h.bonds+=issue.buyers[i];});
   }
  }else{
   const cash=sum(this.households.map(h=>h.cash));
   householdPurchase=Math.min(cash,target);
   if(cash>0)for(const h of this.households){const buy=householdPurchase*h.cash/cash;h.cash-=buy;h.bonds+=buy;}
  }
  this.gov.cash+=householdPurchase;const bankPurchase=gap-householdPurchase;this.bank.bonds+=bankPurchase;this.gov.cash+=bankPurchase;
 }
 payIncome(f,amount,p,allocation){
  const paid=Math.min(Math.max(0,amount),f.cash);f.cash-=paid;const tax=paid*p.incomeTax/100;this.gov.cash+=tax;
  this.households.forEach((h,i)=>{this.payroll[i]+=(paid-tax)*allocation[i];});return paid;
 }
 support(amount,p,shares=null){
  this.ensureGov(amount,p);this.gov.cash-=amount;this.households.forEach((h,i)=>{const x=amount*(shares?shares[i]:1/this.households.length);h.cash+=x;h.income+=x;});
 }
 check(realResidual=0,goodsOutput=1,marketResidual=0,gdp=1){
  const deposits=sum(this.households.map(h=>h.cash))+sum(this.firms.map(f=>f.cash))+this.gov.cash+this.society.pensionCash,loans=this.loans(),mortgages=this.society.mortgages(this.households),bankHousing=this.bank.housing*this.society.housingPrice;
  const external=this.bank.netForeignPosition;
  const bankResidual=this.bank.reserves+loans+mortgages+bankHousing+this.bank.bonds+external-deposits-this.bank.equity-this.bank.termFunding;
  // Domestic market securities are both household assets and firm liabilities
  // or ownership claims, so they cancel in the consolidated financial balance.
  const sectorResidual=sum(this.households.map(h=>h.cash+h.bonds+h.bankTermClaims-h.mortgage))+sum(this.firms.map(f=>f.cash-f.loan))+this.gov.cash+this.society.pensionCash-this.publicDebt()+this.bank.equity-bankHousing-this.endowment-external+sovereignForeignTotal(this)+this.centralBank.equity;
  const centralBankResidual=this.endowment+this.centralBank.bonds-this.bank.reserves-this.centralBank.equity;
  const scale=Math.max(1,Math.abs(deposits),loans,this.publicDebt(),Math.abs(this.bank.equity),Math.abs(external));
  if(new Set(this.firms.map(f=>f.id)).size!==this.firms.length)throw Error('Duplicate firm identity');
  for(const e of this.estates)for(const k of ['capital','inventory','claim'])if(!Number.isFinite(e[k])||e[k]<-1e-7)throw Error('Invalid liquidation estate');
  for(const f of this.firms)for(const k of ['cash','loan','capital','inventory','a','employment','hours','util'])if(!Number.isFinite(f[k])||f[k]< -1e-7)throw Error('Invalid firm '+k);
  for(const f of [...this.firms,...this.estates])for(const k of ['ventureEquity','businessEquity','corporateBonds']){
   const position=f[k];
   if(position&&(!Number.isFinite(position.balance)||position.balance<0||
      Math.abs(sum(position.holders)-position.balance)>1e-8*Math.max(1,position.balance)))
    throw Error('Market ownership ledger did not reconcile.');
  }
  for(const h of this.households)for(const k of ['cash','bonds','foreignAssets','foreignAssetCost','housing','mortgage','pensionUnits','pensionValue'])if(!Number.isFinite(h[k])||h[k]< -1e-7)throw Error('Invalid household '+k);
  if(!Number.isFinite(this.bank.equity)||!Number.isFinite(this.gov.cash)||this.gov.cash< -1e-7)throw Error('Invalid financial stock');
  const relativeResidual=Math.max(Math.abs(centralBankResidual)/scale,Math.abs(bankResidual)/scale,Math.abs(sectorResidual)/scale,Math.abs(realResidual)/Math.max(1,goodsOutput),Math.abs(marketResidual)/Math.max(1,gdp));
  if(relativeResidual>1e-8)throw Error('Accounting reconciliation failed.');
  return{centralBankResidual,bankResidual,sectorResidual,realResidual,marketResidual,relativeResidual};
 }
 initialSnapshot(){
  const p=this.p;
  const otherOpeningTaxes=p.incomeAccountingAlignment&&fiscalContext(p)?.calibration?fiscalContext(p).opening.productionTaxes-fiscalContext(p).calibration.consumptionTaxesGDP:0;
  const householdForeignAssets=sum(this.households.map(h=>h.foreignAssets));
  const row={...householdMetrics(this.households.map(h=>h.income),financialWealth(this.households,this.firms,1)),
   ...incomeAccount(this.initialGoods+this.initialHousingServices-otherOpeningTaxes,p.laborShare,this.initialVAT+this.initialTariff+otherOpeningTaxes,p.publicResearch*p.publicGrantShare/100*p.rdLaborShare/100,100),
   tfpLevel:100,technologyTFPLevel:100,technologyTFPGrowth:0,educationTFPMultiplier:1,governmentPublicEquity:publicEquityValue(this.firms),governmentEquityInLiquidation:0,treasuryCashTarget:p.governmentDeposit,
   ...debtMetrics(this.publicDebt(),this.loans(),marketHoldings(this.firms).householdCorporateBonds,100,this.society.mortgages(this.households)),
   netForeignAssets:householdForeignAssets-sovereignForeignTotal(this),foreignAssetsAtCost:householdForeignAssets+this.bank.foreignAssets,foreignLiabilities:this.bank.foreignLiabilities+sovereignForeignTotal(this),
   bankForeignAssets:this.bank.foreignAssets,bankForeignLiabilities:this.bank.foreignLiabilities,grossForeignRepayment:0,grossForeignResidual:0,realImportDuties:this.initialTariff,
   householdForeignAssetCost:householdForeignAssets,netForeignAssetChange:0,foreignAssetValuationBalance:0,netForeignAssetResidual:0,
   ...NO_SECTOR_FLOWS,...SOCIAL_FLOWS,...CENTRAL_BANK_FLOWS,...FISCAL_FLOWS,...SOVEREIGN_FLOWS,...PRIVATE_DEBT_FLOWS,...centralBankMetrics(this),actualHousingRent:p.housingEnabled?p.actualRentGDP:0,imputedHousingRent:p.housingEnabled?p.imputedRentGDP:0,housingServices:this.initialHousingServices,housingServicesReal:this.initialHousingServices,realGDPPerCapita:100,realGDPPerCapitaGrowth:0,...this.society.metrics(this,p),...this.wealthMetrics(),...marketHoldings(this.firms),financeResidual:0,...this.prices,...this.monetary,
   ...bankPublicExposure(this.monetary,this.expectedBankLossRate),inflation:p.initialInflation,
   importTariffRevenue:this.initialTariff,...this.initialDutySettlement,householdForeignAssets,foreignAssetIncome:0,foreignAssetPurchases:0,foreignAssetSurplusPurchases:0,
   foreignAssetValuation:0,foreignAssetYield:foreignCashYield(p),bankNetForeignPosition:0,
   ...tradeConditions(100,1,1,p),
   exports:this.initialExports,imports:this.initialImports,exportPrice:this.initialExports>0?1:0,goodsValuationPrice:1,nominalExports:this.initialExports,nominalImports:this.initialImports,netForeignPosition:householdForeignAssets-sovereignForeignTotal(this),externalSettlementResidual:0,
   householdGoods:this.initialDomesticConsumption+this.initialImports+this.initialRestrictedBenefits,
   nominalOutput:100,nominalConsumption:this.initialConsumption+this.initialHousingServices+this.initialRestrictedBenefits,nominalConsumptionGoods:this.initialDomesticConsumption,
   nominalConsumptionTax:this.initialVAT,nominalGovernment:p.initialGovernmentShare,nominalGDPResidual:0,
   publicBudgetBase:100,plannedPublicDemand:p.initialGovernmentShare,bankCreditCrowdedOut:0,
   householdSaving:0,firmSaving:0,bankSaving:0,publicSaving:0,privateSaving:0,privateNetLending:0,
   nationalSaving:p.investmentShare+p.initialInventoryChange+(this.initialCurrentAccount),grossInvestment:p.investmentShare+p.initialInventoryChange,currentAccount:this.initialCurrentAccount,
   openingMacroBenchmark:p.openingMacroCalibration,currentAccountGDP:this.initialCurrentAccount,otherForeignIncome:p.openingMacroCalibration?p.otherForeignIncomeGDP+this.initialForeignPublicInterest:0,bankForeignIncome:0,unpaidForeignIncome:0,homeTFPProjectionIndex:100,homeTFPGrowth:0,observedTFPGrowth:p.observedTFPGrowth,tfpGrowth:0,
   savingIdentityResidual:0,publicSavingResidual:0,
   privateMoney:p.householdWealth+p.firmLiquidity,realizedVelocity:this.initialGoods/(p.householdWealth+p.firmLiquidity),
   t:0,calendarYear:2023,publicDebtBridgeDefined:0,publicDebtStockChange:0,publicDebtCashAdjustment:0,publicDebtRecapitalizationAdjustment:0,publicDebtLiquidationAdjustment:0,publicDebtNoncashPensionAdjustment:0,publicDebtStockFlowAdjustment:0,publicDebtBridgeResidual:0,publicDebtRatioChange:0,publicDebtDeficitContribution:0,publicDebtOtherFlowsContribution:0,publicDebtGDPContribution:0,initialObservation:1,firmCount:this.firms.length,entries:0,exits:0,cumulativeEntries:0,cumulativeExits:0,entryAttempts:0,unfundedEntries:0,floorBlockedExits:0,capBlockedEntries:0,loanWriteoffs:0,loanRecoveries:0,startupFunding:0,capitalTransfers:0,inventoryTransfers:0,capitalResidual:0,dormantCapital:0,dormantInventory:0,foreignGain:0,foreignGainFixed:0,foreignAdopters:0,foreignUSA:0,foreignCHN:0,foreignROW:0,foreignEUR:0,exitsEmployment:0,output:100,goodsOutput:this.initialGoods,consumption:this.initialConsumption+this.initialHousingServices+this.initialRestrictedBenefits,consumptionGoods:this.initialDomesticConsumption,consumptionTax:this.initialVAT,
   government:p.initialGovernmentShare,investment:p.investmentShare,inventoryChange:p.initialInventoryChange,knowledge:p.initialTechnology,ownKnowledgeGain:0,diffusionGain:0,learningGapFixed:0,inventory:sum(this.firms.map(f=>f.inventory)),technology:p.initialTechnology,productivity:1,
   employmentPopulation:p.employmentRate*p.initialParticipationRate/100,unemploymentPopulation:(100-p.employmentRate)*p.initialParticipationRate/100,employment:p.employmentRate,unemployment:LABOR_FORCE-p.employmentRate,openingEmployment:p.employmentRate,employmentToUnemployment:0,hiresFromUnemployment:0,employmentResidual:0,effectiveHours:p.employmentRate,productionHours:p.employmentRate-this.initialResearchPayroll/this.wage,researchHours:this.initialResearchPayroll/this.wage,
   utilization:p.initialUtilization,capital:sum(this.firms.map(f=>f.capital)),businessInvestment:p.investmentShare*(1-(p.housingEnabled?p.residentialInvestmentShare/100:0)),residentialInvestment:p.housingEnabled?p.investmentShare*p.residentialInvestmentShare/100:0,loans:this.loans(),rd:this.initialResearchPayroll,rdNonLaborBenchmark:p.rdBusiness-this.initialResearchPayroll,publicResearch:p.publicResearch,publicRDGrants:p.publicResearch*p.publicGrantShare/100*p.rdLaborShare/100,
   publicResearchNonBusiness:p.publicResearch*(1-p.publicGrantShare/100),publicDebt:this.publicDebt(),bankPublicDebt:this.bank.bonds,householdPublicDebt:sum(this.households.map(h=>h.bonds)),
   bankEquity:this.bank.equity,bankReserves:this.bank.reserves,householdDeposits:p.householdWealth,firmDeposits:p.firmLiquidity,governmentDeposits:p.governmentDeposit,wages:p.laborShare,
   gini:gini(this.households.map(h=>h.cash)),defaults:0,recap:0,technologyGrowth:0,loanInterest:0,governmentInterest:0,researchPayrollResidual:0,laborResidual:0,...foreignRowMetrics(p,this.foreign,this.foreignOrigin),...this.check()};const opening={...row,...publicBudgetMetrics(row,p),...openingFiscalMetrics(p),...sovereignForeignMetrics(this),fiscalOtherProductionTaxes:otherOpeningTaxes,governmentInterestToForeign:p.openingMacroCalibration?this.initialForeignPublicInterest:0};return {...opening,...governmentBalanceMetrics(opening)};
 }
 step(noiseTime,t,paths=[],shocks=[]){
  const defensePolicy=defenseResearchPolicy(effectiveParameters(this.p,t,paths)),p=defensePolicy.params,shock=shockValues(t,shocks),fs=this.firms,hs=this.households,n=fs.length;
  const openingPublic={debt:this.publicDebt(),cash:this.gov.cash,gdp:this.lastNominalOutput??100};const calendarYear=2023+(++this.elapsedYears);
  const openingPrivateDebt=this.loans()+sum(this.firms.map(corporateDebt))+this.society.mortgages(this.households),openingPrivateGDP=this.lastNominalOutput??100;
  this.sovereignIssued=0;const openingForeignGovernmentDebt=sovereignForeignTotal(this);
  const flows={...NO_SECTOR_FLOWS,...SOCIAL_FLOWS,...CENTRAL_BANK_FLOWS,...FISCAL_FLOWS,...SOVEREIGN_FLOWS};
  const demographic=this.society.advance(p,this,flows),laborForce=demographic.laborForce,humanMultiplier=demographic.humanMultiplier;
  const educationTFPMultiplier=educationTransmission(humanMultiplier,p.educationTFPResponse??1);
  const openingHousingUnits=this.society.housingUnits,openingPensionCash=this.society.pensionCash,openingMortgages=this.society.mortgages(hs);
  hs.forEach(h=>{h.lastIncome=h.income;});
  const previousHeadlineCPI=this.prices.consumerPriceIndex;
  this.payroll=this.households.map(()=>0);
  const previousExchangePrice=100/this.monetary.currencyStrength;
  const openingForeignFace=sum(hs.map(h=>h.foreignAssets));
  const openingWealth=p.wealthTax ? financialWealth(hs,fs,previousExchangePrice).map((value,i)=>value-(hs[i].pensionValue??0)-(hs[i].publicPensionClaim??0)) : null;
  this.monetary=advanceMonetary(this.monetary,p,this.lastInflation,shock,{domestic:this.prices.producerPrice,foreign:this.foreignPrice});
  const monetary=this.monetary;
  this.foreignFundingQuote=foreignSovereignQuote(this,p,monetary,this.lastCurrentAccount??this.initialCurrentAccount);
  Object.assign(flows,{foreignGovDemandShare:100*this.foreignFundingQuote.share,foreignGovExpectedReturnGap:this.foreignFundingQuote.expectedReturnGap,foreignGovFundingPressure:this.foreignFundingQuote.fundingPressure});
  const governmentForeignInterest=openingForeignGovernmentDebt*monetary.publicDebtRate/100;
  purchaseAssets(this,p,monetary.policyInflationSignal,this.lastNominalOutput??100,flows);
  const openingCentralBankBonds=this.centralBank.bonds,openingPurchaseReserves=Math.max(0,this.bank.reserves-this.endowment);
  const exchangePrice=100/monetary.currencyStrength;
  const exposure=bankPublicExposure(monetary,this.expectedBankLossRate);
  const openingHouseholdDeposits=sum(hs.map(h=>h.cash));
  const openingFirmDeposits=sum(fs.map(f=>f.cash));
  const openingMoney=openingHouseholdDeposits+openingFirmDeposits;
  const openingClaims=marketHoldings(fs);
  const previousPrice=this.prices.producerPrice;
  const turnoverPrices=spendingTurnover(p,this.p,this.initialConsumption/100,monetary.policyRate,shock.demand),velocity=turnoverPrices.velocity*this.moneyVelocityScale,spendingMultiplier=turnoverPrices.spendingMultiplier;
  const nextForeignPrice=this.foreignPrice*(1+p.foreignPriceGrowth/100);
  const inputCosts=importedCostPressure(this.importInputCostIndex,monetary.currencyStrength,nextForeignPrice,p);
  this.importInputCostIndex=inputCosts.importInputCostIndex;
  if(p.importCostFeedback)monetary.currencyPriceContribution=inputCosts.importedCostPriceContribution;
  const domesticPrices={...advancePrices(this.prices,this.openingConsumerPrice,p,
    {money:openingMoney,velocity,goods:this.lastGoods,currencyPressure:monetary.currencyPriceContribution}),...inputCosts};
  const price=domesticPrices.producerPrice;
  this.foreignPrice=nextForeignPrice;
  this.foreignDemand*=1+p.foreignDemandGrowth/100;
  const relativeTechnology=this.lastTechnology/this.p.initialTechnology
   *this.openingForeignTechnology/foreignTechnologyIndex(this.foreign);
  const trade=tradeConditions(monetary.currencyStrength,price,this.foreignPrice,p,this.foreignDemand*shock.foreignDemand,relativeTechnology);
  const taxRate=p.consumptionTax/100;
  const basketShare=p.tradeEnabled?p.importShare/100:0;
  this.hasTraded ||= basketShare>0;
  this.prices=addImportPrices(domesticPrices,this.prices,trade.landedImportPrice*(1+taxRate),basketShare,this.hasTraded);
  this.society.updateRent(p,price);
  if(p.housingEnabled){const rentWeight=this.p.actualRentGDP/Math.max(1e-9,this.initialConsumption+this.p.actualRentGDP);this.prices.consumerPriceIndex=(1-rentWeight)*this.prices.consumerPriceIndex+rentWeight*100*this.society.rentIndex;this.prices.inflation=100*(this.prices.consumerPriceIndex/previousHeadlineCPI-1);}
  this.lastInflation=this.prices.inflation;
  const oldInventory=this.totalInventory(),oldTotalCapital=sum(fs.map(f=>f.capital))+this.dormantCapital(),openingBankBonds=this.bank.bonds,openingHouseholdBonds=hs.map(h=>h.bonds),previousTechnology=this.lastTechnology;
  const openingGovernmentCash=this.gov.cash;
  const openingForeignPosition=this.bank.netForeignPosition;
  const openingNetForeignAssets=openingForeignPosition+sum(hs.map(h=>h.foreignAssetCost))-openingForeignGovernmentDebt;
  for(const estate of this.estates)estate.capital*=1-p.depreciation/100;
  // Forecast cash spending from the purchasing power of prior income. The
  // settlement later limits actual purchases to cash received and held.
  const incomeRepricing=price/previousPrice;
  const plans=hs.map(h=>Math.max(0,spendingMultiplier*(p.consumptionIncome*h.income*incomeRepricing+p.consumptionWealth*h.cash)));
  this.market=p.financialMarket ? new HouseholdMarket(hs,plans,p) : null;
  flows.financialMarketActive=p.financialMarket;
  flows.marketBudget=this.market?.budget??0;
  const cPlan=sum(plans)*(1-trade.importBudgetShare)/this.prices.consumerPrice;
  const budget=publicPurchases(p,this.lastOutput,this.publicTrend,this.publicDebt()/price,shock.government);
  const gPlan=budget.plannedPublicDemand;
  this.publicTrend*=1+p.publicTrendGrowth/100;
  hs.forEach(h=>{h.income=0;h.employed=0;});
  const creditFinancialIncome=(h,gross,taxableShare=100)=>{
   const tax=gross*p.financialIncomeTax/100*taxableShare/100;
   h.cash+=gross-tax;h.income+=gross-tax;
   flows.financialIncomeTaxPaid+=tax;this.gov.cash+=tax;
  };
  hs.forEach(h=>{
   const interest=h.cash*monetary.householdDepositRate/100;
   flows.householdDepositInterest+=interest;
   creditFinancialIncome(h,interest,p.depositInterestTaxableShare);
  });
  fs.forEach(f=>{
   f.depositInterest=f.cash*monetary.firmDepositRate/100;
   f.cash+=f.depositInterest;flows.firmDepositInterest+=f.depositInterest;
  });
  flows.bankFundingInterest=this.bank.termFunding*Math.max(0,monetary.policyRate)/100;
  hs.forEach(h=>creditFinancialIncome(h,h.bankTermClaims*Math.max(0,monetary.policyRate)/100));
  this.bank.equity-=flows.householdDepositInterest+flows.firmDepositInterest+flows.bankFundingInterest;
  const foreignAssetYield=foreignCashYield(p);
  const foreignAssetIncome=payForeignIncome(hs,foreignAssetYield,exchangePrice,creditFinancialIncome);
  const bankForeignIncome=p.foreignSettlementInterest?this.bank.netForeignPosition*foreignAssetYield/100:0;
  this.bank.equity+=bankForeignIncome;
  const otherForeign=settleOtherForeignIncome(hs,(p.otherForeignIncomeGDP+(p.openingMacroCalibration?this.initialForeignPublicInterest:0))*(this.lastNominalOutput??100)/100);
  Object.assign(flows,otherForeign,{bankForeignIncome});
  this.bank.netForeignPosition+=foreignAssetIncome+bankForeignIncome+otherForeign.otherForeignIncome;
  if(openingWealth)hs.forEach((h,i)=>{
   const tax=Math.min(h.cash,openingWealth[i]*p.wealthTax/100);
   h.cash-=tax;h.income-=tax;this.gov.cash+=tax;flows.wealthTaxPaid+=tax;
  });
  const degree=Math.min(n-1,p.networkDegree);
  for(let i=0;i<n;i++){const set=new Set(this.links[i].slice(0,degree));for(let j=0;j<degree;j++){const old=[...set][j];if(old===undefined||uniform(this.seed,noiseTime,fs[i].id,100+j)<p.networkEvolution){if(old!==undefined)set.delete(old);let k=Math.floor(uniform(this.seed,noiseTime,fs[i].id,140+j)*n),tries=0;while((k===i||set.has(k))&&tries++<n)k=(k+1)%n;if(k!==i)set.add(k);}}this.links[i]=[...set];}
  const desiredWeights=weights(fs.map(f=>Math.pow(Math.max(1e-12,f.capital),p.capacityCompetition)*Math.exp(clamp(p.marketSelection*Math.log(f.a),-30,30))));
  fs.forEach((f,i)=>{f.share=(1-p.shareAdjustment)*f.share+p.shareAdjustment*desiredWeights[i];f.innovation=false;f.oldInventory=f.inventory;f.oldCapital=f.capital;f.previousGDP=f.marketGDP;f.grant=0;f.openingTechnology=f.a;f.forcedExit=false;f.exitProbability=0;f.foreignGain=0;f.foreignSource=null;f.foreignTarget=0;});
  const businessInvestmentShare=p.investmentShare*(1-(p.housingEnabled?p.residentialInvestmentShare/100:0));
  const housingInvestmentPlan=this.society.constructionTarget(this,p,this.society.mortgageQuote(p,monetary.policyRate));
  const desiredInvest=fs.map(f=>Math.max(0,businessInvestmentShare/100*f.marketGDP*(1+p.accelerator*(f.util-this.p.initialUtilization/100))*monetary.investmentRateMultiplier));
  const desiredRD=fs.map(f=>p.rdBusiness/100*p.rdLaborShare/100*f.marketGDP*price);
  const restrictedPlan=fiscalContext(p)?p.restrictedBenefitGDP/100*(this.lastNominalOutput??100)/price:0;
  const marketDemand=cPlan+gPlan+restrictedPlan+trade.exportOrders;
  const expected=marketDemand+sum(desiredInvest)+housingInvestmentPlan;
  this.wage=Math.max(1e-9,p.laborShare/this.p.employmentRate*Math.pow(Math.max(1e-9,this.lastTechnology/this.p.initialTechnology*humanMultiplier),p.wageAdjustment))*price;
  const openingJobs = fs.map(f => f.employment);
  const hoursNeeded = fs.map((f,i)=>{
   f.target=Math.max(0,expected*f.share+p.inventoryTarget/100*f.sales-f.inventory);
   const ut=clamp(f.target/Math.max(1e-9,this.kp*f.capital*f.a),p.minimumUtilization/100,1);f.util=clamp(f.util+p.utilizationAdjustment*(ut-f.util),p.minimumUtilization/100,1);
   return f.target/(this.lp*f.a*humanMultiplier)+desiredRD[i]/this.wage;
  });
  const desiredJobs = fs.map((f, i) => {
   const target = clamp(hoursNeeded[i], 0, laborForce) * (1 + p.laborFriction * normal(this.seed, noiseTime, f.id, 20));
   return Math.max(0, f.employment + p.laborAdjustment * (target - f.employment));
  });
  const labor = matchEmployment(openingJobs, desiredJobs, p.employmentSeparation, p.jobFindingRate,laborForce);
  fs.forEach((f, i) => {
   const jobs = labor.allocations[i];
   f.employment = jobs.retained + jobs.transferred + jobs.hired;
   const hoursTarget = clamp(hoursNeeded[i] / Math.max(1e-9, f.employment), p.minimumHours / 100, p.maximumHours / 100);
   f.hours = clamp(f.hours + p.hoursAdjustment * (hoursTarget - f.hours), p.minimumHours / 100, p.maximumHours / 100);
  });
  // Grants finance the already-planned business research payroll. They do not
  // generate a second research wage payment or a second innovation dose.
  flows.defenseResearchPlanChange=defensePolicy.change/100*this.lastOutput*price;
  const publicBudget=p.publicResearch/100*this.lastOutput*price,grantPlan=publicBudget*p.publicGrantShare/100*p.rdLaborShare/100;
  let publicGrants=0;
  fs.forEach((f,i)=>{f.grant=Math.min(desiredRD[i],grantPlan*f.share);this.ensureGov(f.grant,p);this.gov.cash-=f.grant;f.cash+=f.grant;publicGrants+=f.grant;});
  const loanNeeds=fs.map((f,i)=>Math.max(0,this.wage*f.employment*f.hours+(p.businessCapitalMarket?desiredInvest[i]*price:0)+p.liquidityBuffer/100*f.sales*price-f.cash));
  if(this.market)fundExistingFirms(this.market,fs,loanNeeds,p,price,flows);
  const eligible=fs.map((f,i)=>Math.min(loanNeeds[i],Math.max(0,p.maxLeverage*f.capital*price-totalBusinessDebt(f)))*clamp(p.creditAvailability*shock.credit,0,1));
  const openingLoans=this.loans();
  const capacity=lendingRoom(this.bank.equity,openingLoans+this.society.mortgages(hs)*p.mortgageRiskWeight,this.bank.bonds,p.capitalRequirement,exposure.publicCreditWeight),eligibleTotal=sum(eligible);
  const uncrowded=lendingRoom(this.bank.equity,openingLoans+this.society.mortgages(hs)*p.mortgageRiskWeight,0,p.capitalRequirement,exposure.publicCreditWeight);
  const bankCreditCrowdedOut=Math.min(eligibleTotal,uncrowded)-Math.min(eligibleTotal,capacity);
  const ration=eligibleTotal?Math.min(1,capacity/eligibleTotal):0;
  fs.forEach((f,i)=>{const lend=eligible[i]*ration;f.cash+=lend;f.loan+=lend;flows.businessCreditIssued+=lend;const hours=f.employment*f.hours,afford=Math.min(hours,f.cash/this.wage);if(afford<hours)f.employment*=hours?afford/hours:0;});
  let employedIncumbents=0, hiresFromUnemployment=0;
  fs.forEach((f, i) => {
   const jobs = labor.allocations[i];
   // Fund continuing jobs before adding new workers if payroll credit is short.
   const incumbents = Math.min(f.employment, jobs.retained + jobs.transferred);
   employedIncumbents += incumbents;
   hiresFromUnemployment += f.employment - incumbents;
  });
  const employment = sum(fs.map(f => f.employment));
  const unemployment = laborForce - employment;
  const employmentToUnemployment = labor.openingEmployment - employedIncumbents;
  const employmentResidual = employment - (labor.openingEmployment - employmentToUnemployment + hiresFromUnemployment);
  if (unemployment <= 0 || Math.abs(employmentResidual) > 1e-8 || hiresFromUnemployment > labor.searchCapacity + 1e-8)
   throw Error('Labor market stocks and flows did not reconcile.');
  const householdLabor = laborForce / hs.length;
  const order=hs.map((_,i)=>i).sort((a,b)=>uniform(this.seed,noiseTime,a,22)-uniform(this.seed,noiseTime,b,22));let workerIndex=0,workerRemaining=householdLabor;
  let wages=0,investment=0,goodsOutput=0,researchHours=0,productionHours=0,rd=0;
  fs.forEach((f,i)=>{
   const allocation=new Array(hs.length).fill(0);let jobs=f.employment;
   while(jobs>1e-10&&workerIndex<order.length){const j=order[workerIndex],taken=Math.min(jobs,workerRemaining);allocation[j]+=taken;hs[j].employed+=taken;jobs-=taken;workerRemaining-=taken;if(workerRemaining<1e-10){workerIndex++;workerRemaining=householdLabor;}}
   if(f.employment>1e-10)for(let j=0;j<allocation.length;j++)allocation[j]/=f.employment;
   const fundedHours=f.employment*f.hours;f.researchHours=Math.min(fundedHours,desiredRD[i]/this.wage);f.productionHours=Math.max(0,fundedHours-f.researchHours);f.rd=f.researchHours*this.wage;
   f.wages=this.payIncome(f,fundedHours*this.wage,p,allocation);wages+=f.wages;rd+=f.rd;researchHours+=f.researchHours;productionHours+=f.productionHours;
   const lc=this.lp*f.productionHours*f.a*humanMultiplier*shock.supply,kc=this.kp*f.capital*f.util*f.a*shock.supply*clamp(1+p.supplyVolatility*normal(this.seed,noiseTime,fs[i].id,24),.25,1.75);
   f.output=Math.max(0,Math.min(lc,kc,f.target));goodsOutput+=f.output;
   const salesNeed=trade.exportOrders>0 ? Math.max(0,marketDemand*f.share-f.inventory) : 0;
   const needs=desiredInvest[i]+salesNeed;
   const investmentSupply=needs>f.output&&salesNeed>0 ? f.output*desiredInvest[i]/needs : f.output;
   const supplied=Math.min(investmentSupply,desiredInvest[i]);
   f.capitalSupply=p.businessCapitalMarket?supplied:0;f.capitalSold=p.businessCapitalMarket?0:supplied;
   f.investment=p.businessCapitalMarket?0:supplied;investment+=f.investment;
   f.capital=(1-p.depreciation/100)*f.capital+f.investment;f.inventory+=f.output-f.investment;
  });
  if(p.businessCapitalMarket){const market=settleBusinessCapital(fs,desiredInvest,price,p.liquidityBuffer);investment=market.quantity;const {quantity,...entries}=market;Object.assign(flows,entries);}
  // A fixed funded wage bill is shared by hours and persistent earnings ranks.
  // This changes distribution, not aggregate labor input or the wage bill.
  const netPayroll=sum(this.payroll),earnings=hs.map((h,i)=>this.payroll[i]*h.earningsWeight),earningsTotal=sum(earnings);
  this.workerGrossPayroll=earnings.map(x=>earningsTotal>0?wages*x/earningsTotal:0);
  hs.forEach((h,i)=>{const paid=earningsTotal>0?netPayroll*earnings[i]/earningsTotal:0;h.cash+=paid;h.income+=paid;});
  const unemploymentShares=hs.map(h=>Math.max(0,householdLabor-h.employed));
  const householdUnemployment=sum(unemploymentShares);
  if(Math.abs(householdUnemployment-unemployment)>1e-7)throw Error('Household and firm employment did not reconcile.');
  flows.wageWithholding=wages*p.incomeTax/100;
  const baseSupport=p.incomeSupport/100*this.lastOutput*price;
  const otherSupport=this.society.payPublicPensions(this,p,flows,wages,price,baseSupport);
  flows.cashSupport=otherSupport+flows.publicPensionBenefits;this.support(otherSupport,p);
  if(unemployment>1e-9){
   flows.unemploymentBenefits=p.unemploymentReplacement/100*this.wage*unemployment;
   this.support(flows.unemploymentBenefits,p,unemploymentShares.map(x=>x/householdUnemployment));
  }
  const publicNonBusiness=publicBudget*(1-p.publicGrantShare/100);this.support(publicNonBusiness,p);
  // Households use current cash for their purchases. Public debt finances the
  // executed orders after households pay and consumption taxes are received.
  const quote=this.society.mortgageQuote(p,monetary.policyRate),housingP={...p,creditAvailability:clamp(p.creditAvailability*shock.credit,0,1)};
  this.society.settleHousingServices(this,p,flows,creditFinancialIncome);
  this.society.settleMortgages(this,p,flows,quote);
  const housingOrders=this.society.housingOrders(this,housingP,quote,exposure,flows,plans),housingPlan=sum(housingOrders.map(o=>o.budget))/price;
  const budgets=hs.map((h,i)=>Math.min(Math.max(0,h.cash-housingOrders[i].budget),plans[i])),nominalBudget=sum(budgets);
  const importedSpending=nominalBudget*trade.importBudgetShare;
  const importDuty=p.importTariff/100;
  const nominalImports=importedSpending/((1+taxRate)*(1+importDuty)),imports=nominalImports/trade.importPrice;
  flows.importTariffRevenue=nominalImports*importDuty;Object.assign(flows,settleImportDuty(flows.importTariffRevenue,p));
  const actualCPlan=(nominalBudget-importedSpending)/this.prices.consumerPrice;
  const {domesticSales:sales,exportSales,exportReceipts}=clearGoodsMarket(fs,actualCPlan+gPlan+housingPlan+restrictedPlan,price,trade);
  const totalSales=sum(sales),domesticDemand=actualCPlan+gPlan+housingPlan+restrictedPlan,cRatio=domesticDemand>0?actualCPlan/domesticDemand:0;
  const consumptionGoods=totalSales*cRatio,government=domesticDemand>0?totalSales*gPlan/domesticDemand:0;
  flows.restrictedBenefitQuantity=domesticDemand>0?totalSales*restrictedPlan/domesticDemand:0;flows.publicRestrictedBenefits=price*flows.restrictedBenefitQuantity;
  this.society.settleConstruction(this,housingOrders,domesticDemand>0?totalSales/domesticDemand:0,price,flows);
  const exports=sum(exportSales),nominalExports=sum(exportReceipts);
  const exportPrice=exports>0?nominalExports/exports:0;
  const dispositions=totalSales+exports+investment;
  const goodsValuationPrice=dispositions>0 ? (price*(totalSales+investment)+nominalExports)/dispositions : price;
  const domesticVAT=consumptionGoods*p.consumptionTax/100;
  const baseVAT=this.p.consumptionTax/100,baseDuty=this.p.importTariff/100;
  const vat=consumptionGoods*baseVAT+imports*(1+baseDuty)*baseVAT;
  const realImportDuties=imports*baseDuty,householdGoods=consumptionGoods+imports+flows.restrictedBenefitQuantity,consumption=householdGoods+vat+realImportDuties+flows.housingServicesReal;
  const cashGoodsConsumption=price*(consumptionGoods+domesticVAT)+importedSpending,nominalGoodsConsumption=cashGoodsConsumption+flows.publicRestrictedBenefits,nominalConsumption=nominalGoodsConsumption+flows.housingServices,nominalConsumptionGoods=price*consumptionGoods;
  const nominalConsumptionTax=price*domesticVAT+importedSpending-nominalImports-flows.importTariffRevenue,nominalGovernment=price*government;
  if(nominalBudget>0)hs.forEach((h,i)=>h.cash-=budgets[i]*cashGoodsConsumption/nominalBudget);
  this.gov.cash+=nominalConsumptionTax+flows.importTariffRevenue-flows.tariffNetExternalTransfer;
  this.ensureGov(nominalGovernment+flows.publicRestrictedBenefits,p);
  this.gov.cash-=nominalGovernment+flows.publicRestrictedBenefits;
  fs.forEach((f,i)=>{
   f.sales=sales[i]+exportSales[i]+(p.businessCapitalMarket?f.capitalSold:0);
   f.cash+=price*sales[i]+exportReceipts[i];
   f.marketGDP=f.output+sales[i]*cRatio*p.consumptionTax/100;
  });
  // Trade settles through a net external position denominated in model
  // currency. The corresponding flows also credit or debit domestic deposits.
  const netTrade=nominalExports-nominalImports;
  const currentAccount=netTrade+foreignAssetIncome+bankForeignIncome+otherForeign.otherForeignIncome-governmentForeignInterest-flows.tariffNetExternalTransfer;
  this.bank.netForeignPosition+=netTrade-flows.tariffNetExternalTransfer;
  let interestReceived=flows.mortgageInterest+flows.bankRentalIncome+bankForeignIncome,loanInterest=0,defaults=0,legacyWriteoffs=0;const lagged=this.techHistory[Math.max(0,this.techHistory.length-1-p.adoptionLag)],newA=[];
  const donorHistory=this.foreignHistory[Math.max(0,this.foreignHistory.length-1-p.adoptionLag)];
  fs.forEach((f,i)=>{
   const scale=Math.max(f.previousGDP,f.initialGDP,1e-9)*price,prob=1-Math.exp(-p.innovationEfficiency*f.rd/scale*p.humanCapital*educationTFPMultiplier);let a=f.a;
   f.innovationProbability=prob;const previousKnowledge=a;if(uniform(this.seed,noiseTime,fs[i].id,30)<prob){a*=1+p.innovationStep/100*(1-p.innovationDispersion/100+2*p.innovationDispersion/100*uniform(this.seed,noiseTime,fs[i].id,31));f.innovation=true;}
   const knownPeers=this.links[i].map(j=>lagged.get(fs[j].id)).filter(Number.isFinite);
   const neighbor=knownPeers.length?sum(knownPeers)/knownPeers.length:a;
   const target=(1-p.frontierAccess)*Math.max(a,neighbor)+p.frontierAccess*Math.max(a,this.frontier);f.ownKnowledgeGain=a-previousKnowledge;f.learningGap=Math.max(0,target-a);const afterLearning=adoptKnowledge(a,target,p.diffusion*p.absorptiveCapacity*p.humanCapital*educationTFPMultiplier);f.diffusionGain=afterLearning-a;
   const foreign=learnForeign(afterLearning,donorHistory,{...p,humanCapital:p.humanCapital*educationTFPMultiplier},this.seed,noiseTime,f.id,uniform,monetary.effectiveForeignContact);
   if(foreign.contact)flows[`foreignContacts${foreign.contact}`]++;
   if(foreign.tail)flows.foreignTailAdopters++;
   if(foreign.source&&foreign.benchmark/p.foreignLeaderPremium<previousTechnology)flows.foreignFromLowerMean++;
   f.foreignGain=foreign.gain;f.foreignSource=foreign.source;f.foreignTarget=foreign.target;a=foreign.a;newA.push(a);
   const debt=totalBusinessDebt(f),due=debt*monetary.effectiveLoanRate/100,interest=Math.min(f.cash,due);
   const corporateInterest=debt>0 ? interest*(corporateDebt(f)/debt) : 0;
   const bankInterest=interest-corporateInterest;
   f.cash-=interest;
   this.bank.equity+=bankInterest;interestReceived+=bankInterest;loanInterest+=bankInterest;
   payHolders(hs,f.corporateBonds,corporateInterest,creditFinancialIncome);
   flows.corporateBondInterest+=corporateInterest;
   f.arrears=interest<due-1e-8?f.arrears+1:0;
   flows.debtServiceShortfall+=Math.max(0,due-interest);
   flows.lateInterestFirms+=Number(interest<due-1e-8);
   const profit=Math.max(0,price*(sales[i]+(p.businessCapitalMarket?f.capitalSold:f.investment))+exportReceipts[i]+goodsValuationPrice*(f.inventory-f.oldInventory)+f.grant+f.depositInterest-f.wages-interest-p.depreciation/100*f.oldCapital*price);
   const tax=Math.min(f.cash,profit*p.profitTax/100);f.cash-=tax;this.gov.cash+=tax;flows.profitTaxPaid+=tax;
   const cashBuffer=p.liquidityBuffer/100*f.sales*price;
   const dividend=Math.min(Math.max(0,f.cash-cashBuffer),Math.max(0,profit-tax)*p.dividendShare/100);f.cash-=dividend;
   let pensionDividend=0;const publicDividend=payFirmOwners(hs,f,dividend,creditFinancialIncome,paid=>{this.gov.cash+=paid;},paid=>{this.society.pensionCash+=paid;flows.pensionDividends+=paid;pensionDividend+=paid;});
   flows.firmDividends+=dividend-publicDividend-pensionDividend;flows.governmentFirmDividends+=publicDividend;
   const repay=repayBusinessDebt(hs,f,Math.min(debt*p.repaymentRate/100,Math.max(0,f.cash-cashBuffer)));
   flows.businessLoanRepayments+=repay.bank;
   flows.corporateBondRepayments+=repay.corporate;
   if(f.arrears>=p.defaultAfter){
    defaults++;
    if(p.firmDynamics)f.forcedExit=true;
    else{
     const recovery=repayBusinessDebt(hs,f,Math.min(f.cash,totalBusinessDebt(f)*p.recoveryRate/100));
     flows.businessLoanRepayments+=recovery.bank;
     flows.corporateBondRepayments+=recovery.corporate;
     flows.corporateBondWriteoffs+=corporateDebt(f);
     legacyWriteoffs+=f.loan;this.bank.equity-=f.loan;
     f.loan=0;f.corporateBonds=undefined;f.arrears=0;f.restructured++;
     flows.debtRestructurings++;
     this.events.push({type:'restructuring',id:f.id,t,numericalFloor:false});
    }
   }
  });
  fs.forEach((f,i)=>{f.a=newA[i];if(this.cohort.has(f.id))this.cohort.get(f.id).a=f.a;});
  const foreignRates=foreignGrowthRates(p,this.foreignHistory.length,shock);
  for(const source of foreignProviders(p))this.foreign[source.code]*=1+foreignRates[source.code].applied/100;
  this.foreignHistory.push({...this.foreign});
  const homeTFPGrowth=homeFrontierGrowth(p,this.foreignHistory.length-1);
  this.homeProjection*=1+homeTFPGrowth/100;
  this.frontier=Math.max(...newA,this.frontier*(1+homeTFPGrowth/100+p.publicResearchReturn*publicNonBusiness/(Math.max(this.lastOutput,1e-9)*price)));
  // Only opening government claims earn the full annual-period interest.
  const bankInterest=openingBankBonds*monetary.publicDebtRate/100,hhInterest=openingHouseholdBonds.map(b=>b*monetary.publicDebtRate/100),governmentInterest=bankInterest+sum(hhInterest);
  this.ensureGov(governmentInterest+governmentForeignInterest,p);this.gov.cash-=governmentInterest+governmentForeignInterest;
  this.bank.netForeignPosition-=governmentForeignInterest;flows.governmentInterestToForeign=governmentForeignInterest;this.bank.equity+=bankInterest;interestReceived+=bankInterest;
  flows.governmentInterestToBank=bankInterest;
  flows.governmentInterestToHouseholds=governmentInterest-bankInterest;
  hs.forEach((h,i)=>creditFinancialIncome(h,hhInterest[i]));
  interestReceived+=settleCentralBankIncome(this,p,flows,openingCentralBankBonds,openingPurchaseReserves);
  const {events: _turnoverEvents,...turnover}=transition(this,p,noiseTime,t,uniform,price);
  turnover.debtRestructurings+=flows.debtRestructurings;
  for(const key of ['corporateBondRepayments','corporateBondWriteoffs'])turnover[key]+=flows[key];
  Object.assign(flows,turnover);
  this.techHistory.push(new Map(this.firms.map(f=>[f.id,f.a])));
    this.society.tradeExistingHousing(this,housingP,quote,exposure,flows);
  this.society.closePensions(this,p,flows,wages,price,openingPensionCash);
  const requiredEquity=p.capitalRequirement/100*(this.loans()+this.society.mortgages(hs)*p.mortgageRiskWeight+exposure.publicCreditWeight*this.bank.bonds);
  const bankDividend=Math.min(Math.max(0,this.bank.equity-requiredEquity),Math.max(0,interestReceived-flows.householdDepositInterest-flows.firmDepositInterest-flows.bankFundingInterest)*p.bankDividend/100);
  this.bank.equity-=bankDividend;flows.bankDividends=bankDividend;hs.forEach(h=>creditFinancialIncome(h,bankDividend*h.ownership));
  settleFiscalCoverage(this,p,flows,this.lastNominalOutput??100,monetary,calendarYear);
  this.society.reconcilePublicPensionFunding(p,flows);
  let recap=0;if(p.bankBackstop&&this.bank.equity<0){recap=-this.bank.equity+this.p.bankEquity*p.recapitalizationTarget/100;this.ensureGov(recap,p);this.gov.cash-=recap;this.bank.equity+=recap;}
  flows.foreignGovBondPurchases=this.sovereignIssued;
  flows.bankBondPurchases=this.bank.bonds-openingBankBonds;
  flows.householdBondPurchases=sum(hs.map(h=>h.bonds))-sum(openingHouseholdBonds);
  flows.marketGovernmentFunding=this.market ? flows.householdBondPurchases : 0;
  const {foreignAssetPurchases,foreignAssetSurplusPurchases}=this.market&&p.foreignPortfolioWeight>0
   ? this.market.closeForeignOrders(currentAccount,exchangePrice) : {foreignAssetPurchases:0,foreignAssetSurplusPurchases:0};
  flows.marketPurchases=flows.ventureFunding+flows.businessEquityIssued+flows.corporateBondsIssued+flows.marketGovernmentFunding+foreignAssetPurchases;
  this.bank.netForeignPosition-=foreignAssetPurchases;
  const treasuryCashTarget=this.p.governmentDeposit/100*this.lastOutput*price;
  const totalBeforeRedemption=this.publicDebt(),foreignBeforeRedemption=sovereignForeignTotal(this),excess=Math.max(0,this.gov.cash-treasuryCashTarget),foreignRedemption=totalBeforeRedemption>0?Math.min(excess,totalBeforeRedemption)*foreignBeforeRedemption/totalBeforeRedemption:0;
  const foreignRedeemed=redeemForeignSovereign(this,foreignRedemption);
  Object.assign(flows,redeemPublicBonds(this.gov,this.bank,hs,treasuryCashTarget,this.centralBank));
  flows.publicBondRedemptions+=foreignRedeemed.total;flows.publicBondRedemptionsToForeign=foreignRedeemed.bonds;flows.foreignGovOtherDebtRedemptions=foreignRedeemed.other+foreignRedeemed.unallocated;
  const openingHouseholdForeignAssets=openingForeignFace*previousExchangePrice;
  const householdForeignAssets=exchangePrice*sum(hs.map(h=>h.foreignAssets));
  const foreignAssetValuation=openingForeignFace*(exchangePrice-previousExchangePrice);
  const netForeignPosition=this.bank.netForeignPosition+householdForeignAssets-sovereignForeignTotal(this);
  // Acquisition-cost external assets and liabilities settle independently of
  // currency revaluation. Their net annual change must equal the current account.
  const householdForeignAssetCost=sum(hs.map(h=>h.foreignAssetCost));
  const settlementChange=this.bank.netForeignPosition-openingForeignPosition;
  this.bank.foreignAssets+=Math.max(0,settlementChange);
  this.bank.foreignLiabilities+=Math.max(0,-settlementChange);
  // Repay a share of offsetting short-term positions while rolling over the
  // opening two-way settlement relationships. No domestic deposit is created.
  const matchedExcess=Math.min(this.bank.foreignAssets-this.p.initialGrossForeignPosition,
    this.bank.foreignLiabilities-this.p.initialGrossForeignPosition);
  const grossForeignRepayment=.25*Math.max(0,matchedExcess);
  this.bank.foreignAssets-=grossForeignRepayment;this.bank.foreignLiabilities-=grossForeignRepayment;
  const grossForeignResidual=this.bank.foreignAssets-this.bank.foreignLiabilities-this.bank.netForeignPosition;
  if(Math.abs(grossForeignResidual)>1e-8*Math.max(1,this.bank.foreignAssets,this.bank.foreignLiabilities))throw Error('Gross foreign accounts did not reconcile.');
  const foreignAssetsAtCost=householdForeignAssetCost+this.bank.foreignAssets;
  const foreignLiabilities=this.bank.foreignLiabilities+sovereignForeignTotal(this);
  const netForeignAssets=foreignAssetsAtCost-foreignLiabilities;
  const netForeignAssetChange=netForeignAssets-openingNetForeignAssets;
  const netForeignAssetResidual=netForeignAssetChange-currentAccount;
  const foreignAssetValuationBalance=netForeignPosition-netForeignAssets;
  if(Math.abs(netForeignAssetResidual)>1e-8*Math.max(1,Math.abs(netForeignAssets),Math.abs(openingNetForeignAssets),Math.abs(currentAccount)))
   throw Error('Net foreign asset transactions must equal the current account.');
  this.society.closeEducation(p,flows,nominalGovernment,nominalGoodsConsumption,price,this.p.initialGovernmentShare,this.initialConsumption);
  this.society.closeHousing(this,p,flows,quote,price);
  if(p.housingEnabled&&Math.abs(this.society.housingUnits-openingHousingUnits-flows.housingConstruction+flows.housingDepreciation)>1e-7)throw Error('Dwelling stock did not reconcile.');
  const output=goodsOutput+flows.housingServicesReal+vat+realImportDuties,inventoryChange=this.totalInventory()-oldInventory;
  const productionValue=goodsValuationPrice*goodsOutput+flows.housingServices;
  const grossInvestment=price*investment+flows.nominalHousingConstruction+goodsValuationPrice*inventoryChange;
  const nominalOutput=productionValue+nominalConsumptionTax+flows.importTariffRevenue;
  const savings=savingBalances({flows,householdIncome:sum(hs.map(h=>h.income))+flows.imputedHousingRent+flows.publicRestrictedBenefits,nominalConsumption,nominalGovernment,
    productionValue:productionValue-flows.housingServices,vat:nominalConsumptionTax,wages,businessInterest:loanInterest,publicGrants,publicNonBusiness,
    grossInvestment,currentAccount,
    publicSavingCheck:this.gov.cash-openingGovernmentCash-flows.bankBondPurchases-flows.householdBondPurchases+flows.publicBondRedemptions+recap-flows.governmentLiquidationProceeds-flows.foreignGovBondPurchases+flows.fiscalCapitalExpenditure-flows.fiscalCapitalRevenue-flows.fiscalNoncashPensionInterest});
  const income=incomeAccount(productionValue-flows.fiscalOtherProductionTaxes,wages,nominalConsumptionTax+flows.importTariffRevenue+flows.fiscalOtherProductionTaxes,publicGrants,nominalOutput);
  const externalSettlementResidual=netForeignPosition-openingForeignPosition-openingHouseholdForeignAssets+openingForeignGovernmentDebt-currentAccount-foreignAssetValuation;
  if(Math.abs(externalSettlementResidual)>1e-8*Math.max(1,Math.abs(this.bank.netForeignPosition),householdForeignAssets,nominalExports,nominalImports))
   throw Error('External payments did not reconcile.');
  const nominalGDPResidual=nominalOutput-nominalConsumption-nominalGovernment-grossInvestment-netTrade;
  if(Math.abs(nominalGDPResidual)>1e-8*Math.max(1,nominalOutput))throw Error('Nominal GDP reconciliation failed.');
  const realResidual=goodsOutput-consumptionGoods-flows.restrictedBenefitQuantity-government-investment-flows.housingConstruction-inventoryChange-exports;
  const marketResidual=output-consumption-government-investment-flows.housingConstruction-inventoryChange-exports+imports;
  const effectiveHours=sum(fs.map(f=>f.employment*f.hours)),laborResidual=effectiveHours-productionHours-researchHours,researchPayrollResidual=wages-this.wage*productionHours-rd;
  if(Math.abs(laborResidual)>1e-7||Math.abs(researchPayrollResidual)>1e-7*Math.max(1,wages))throw Error('Research labor/payroll reconciliation failed.');
  const active=this.firms,capital=sum(active.map(f=>f.capital)),openingCapital=sum(fs.map(f=>f.oldCapital));
  const capitalResidual=capital+this.dormantCapital()-oldTotalCapital-investment+p.depreciation/100*oldTotalCapital;
  if(Math.abs(capitalResidual)>1e-7*Math.max(1,oldTotalCapital))throw Error('Capital stock/transfer reconciliation failed.');
  const checks=this.check(realResidual,goodsOutput,marketResidual,output);
  const alpha=this.p.tfpCapitalShare/100,rawTfp=goodsOutput/Math.max(1e-12,Math.pow(openingCapital,alpha)*Math.pow(Math.max(productionHours,1e-9),1-alpha));
  const tfpGrowth=100*(100*rawTfp/this.tfpScale/this.lastTFP-1);this.lastTFP=100*rawTfp/this.tfpScale;
  const tech=sum(active.map(f=>f.a*f.capital))/Math.max(1e-12,capital);
  const realGDPPerCapitaGrowth=100*((output/(this.society.population/100))/this.lastGDPPerCapita-1);this.lastGDPPerCapita=output/(this.society.population/100);
  const technologyTFPLevel=100*tech/this.p.initialTechnology,technologyTFPGrowth=100*(technologyTFPLevel/this.lastTechnologyTFP-1);this.lastTechnologyTFP=technologyTFPLevel;this.lastTechnology=tech;this.lastOutput=output;this.lastNominalOutput=nominalOutput;
  this.lastGoods=goodsOutput;this.lastCurrentAccount=currentAccount;this.lastCompletedInflation=this.prices.inflation;
  const openingWeightTotal=sum(fs.map(f=>f.oldCapital));
  const foreignGain=sum(fs.map(f=>f.foreignGain*f.oldCapital))/Math.max(1e-12,openingWeightTotal);
  const foreignAdopters=fs.filter(f=>f.foreignGain>0).length;
  for(const {code} of foreignProviders(p)){
   const gain=sum(fs.filter(f=>f.foreignSource===code).map(f=>f.foreignGain*f.oldCapital));
   flows[`foreignGain${code}`]=gain/Math.max(1e-12,openingWeightTotal);
  }
  const householdDeposits=sum(hs.map(h=>h.cash)),firmDeposits=sum(active.map(f=>f.cash));
  const privateMoney=householdDeposits+firmDeposits;
  const holdings=marketHoldings(active);
  const debtAccount=privateDebtFlows(openingPrivateDebt,this.loans()+holdings.householdCorporateBonds+this.society.mortgages(hs),openingPrivateGDP,nominalOutput,{...flows,loanWriteoffs:flows.loanWriteoffs+legacyWriteoffs});
  // Check the deposits and active securities against independent cash flows.
  const marketFinancing=turnover.startupFunding+flows.businessEquityIssued+flows.corporateBondsIssued;
  const corporateCashToHouseholds=flows.corporateBondRepayments+flows.corporateBondRecoveries;
  const householdDepositChange=savings.householdSaving-flows.pensionAccruedIncome+turnover.liquidationDistributions+corporateCashToHouseholds
   -marketFinancing-flows.householdBondPurchases+flows.publicBondRedemptionsToHouseholds-foreignAssetPurchases
   +flows.mortgageOriginations-flows.mortgageRepayments-flows.nominalHousingConstruction-flows.bankHousingSales
   -flows.pensionContributions+flows.pensionWithdrawals-flows.pensionEquitySales;
  const firmDepositChange=flows.publicRestrictedBenefits+flows.fiscalCurrentCoverageExpense+flows.fiscalCapitalExpenditure-flows.fiscalCapitalRevenue-flows.fiscalOtherProductionTaxes+nominalConsumptionGoods+nominalGovernment+flows.nominalHousingConstruction+nominalExports+publicGrants+flows.firmDepositInterest+flows.businessCreditIssued+marketFinancing
   -wages-flows.firmDividends-flows.governmentFirmDividends-flows.pensionDividends-flows.profitTaxPaid-loanInterest-flows.corporateBondInterest-flows.businessLoanRepayments
   -turnover.exitLoanRepayments-turnover.loanRecoveries-turnover.liquidationDistributions-turnover.governmentLiquidationProceeds-turnover.pensionLiquidationProceeds-corporateCashToHouseholds;
  const financeResidual=Math.max(
   Math.abs(householdDeposits-openingHouseholdDeposits-householdDepositChange)/Math.max(1,householdDeposits,openingHouseholdDeposits),
   Math.abs(firmDeposits-openingFirmDeposits-firmDepositChange)/Math.max(1,firmDeposits,openingFirmDeposits),
   Math.abs(holdings.householdCorporateBonds-openingClaims.householdCorporateBonds-flows.corporateBondsIssued
    +flows.corporateBondRepayments+flows.corporateBondWriteoffs)/Math.max(1,holdings.householdCorporateBonds,openingClaims.householdCorporateBonds),
   Math.abs(holdings.householdVentureEquity-openingClaims.householdVentureEquity-flows.ventureFunding
    +flows.ventureEquityRetired)/Math.max(1,holdings.householdVentureEquity,openingClaims.householdVentureEquity),
   Math.abs(holdings.householdBusinessEquity-openingClaims.householdBusinessEquity-flows.businessEquityIssued
    +flows.businessEquityRetired)/Math.max(1,holdings.householdBusinessEquity,openingClaims.householdBusinessEquity),
   Math.abs(householdForeignAssets-openingHouseholdForeignAssets-foreignAssetPurchases-foreignAssetValuation)
    /Math.max(1,householdForeignAssets,openingHouseholdForeignAssets),
   Math.max(0,flows.marketPurchases-flows.marketBudget)/Math.max(1,flows.marketBudget),
  );
  if(financeResidual>1e-8)throw Error('Household investment market did not reconcile.');
  const bankCreditLoss=turnover.loanWriteoffs+legacyWriteoffs-turnover.loanRecoveries;
  const lossRate=clamp(100*bankCreditLoss/Math.max(1e-9,openingLoans+flows.businessCreditIssued),0,20);
  this.expectedBankLossRate+=.25*(lossRate-this.expectedBankLossRate);
  const realizedVelocity=price*goodsOutput/Math.max(1e-9,(openingMoney+privateMoney)/2);
  const row={...householdMetrics(hs.map(h=>h.income),financialWealth(hs,active,exchangePrice)),
   ...income,...this.society.metrics(this,p,price),employmentPopulation:(this.society.ageCohorts?.participationRate??p.initialParticipationRate)*employment/laborForce,unemploymentPopulation:(this.society.ageCohorts?.participationRate??p.initialParticipationRate)*unemployment/laborForce,realGDPPerCapita:output/(this.society.population/100),realGDPPerCapitaGrowth,...this.wealthMetrics(),businessInvestment:investment,residentialInvestment:flows.housingConstruction,employmentUnits:employment,unemploymentUnits:unemployment,
    tfpLevel:100*rawTfp/this.tfpScale,tfpGrowth,technologyTFPLevel,technologyTFPGrowth,currentAccountGDP:100*currentAccount/Math.max(1e-9,nominalOutput),homeTFPGrowth,homeTFPProjectionIndex:this.homeProjection,observedTFPGrowth:p.observedTFPGrowth,educationTFPMultiplier,governmentPublicEquity:publicEquityValue(active,price),governmentEquityInLiquidation:publicEquityValue(this.estates,price),
   ...debtMetrics(this.publicDebt(),this.loans(),holdings.householdCorporateBonds,nominalOutput,this.society.mortgages(hs)),...debtAccount,
   netForeignAssets,netForeignAssetChange,foreignAssetsAtCost,foreignLiabilities,householdForeignAssetCost,foreignAssetValuationBalance,netForeignAssetResidual,
   bankForeignAssets:this.bank.foreignAssets,bankForeignLiabilities:this.bank.foreignLiabilities,grossForeignRepayment,grossForeignResidual,realImportDuties,
   ...flows,...sovereignForeignMetrics(this),...centralBankMetrics(this),...holdings,financeResidual,...this.prices,...monetary,...exposure,...budget,...savings,...trade,bankCreditCrowdedOut,privateMoney,realizedVelocity,
   exports,imports,exportPrice,goodsValuationPrice,nominalExports,nominalImports,householdGoods,netForeignPosition,bankNetForeignPosition:this.bank.netForeignPosition,externalSettlementResidual,
   householdForeignAssets,foreignAssetIncome,foreignAssetPurchases,foreignAssetSurplusPurchases,foreignAssetValuation,foreignAssetYield,
   nominalOutput,nominalConsumption,nominalConsumptionGoods,nominalConsumptionTax,nominalGovernment,nominalGDPResidual,
   t,calendarYear,initialObservation:0,firmCount:active.length,cumulativeEntries:this.totalEntries,cumulativeExits:this.totalExits,dormantCapital:this.dormantCapital(),dormantInventory:sum(this.estates.map(e=>e.inventory)),capitalResidual,foreignGain,foreignGainFixed:sum(fs.map(f=>f.initialWeight*f.foreignGain)),foreignAdopters,foreignUSA:fs.filter(f=>f.foreignSource==='USA').length,foreignCHN:fs.filter(f=>f.foreignSource==='CHN').length,foreignROW:fs.filter(f=>f.foreignSource==='ROW').length,foreignEUR:fs.filter(f=>f.foreignSource==='EUR').length,loanWriteoffs:turnover.loanWriteoffs+legacyWriteoffs,output,goodsOutput,consumption,consumptionGoods,consumptionTax:vat,government,investment:investment+flows.housingConstruction,inventoryChange,inventory:this.totalInventory(),
   technology:tech,knowledge:sum([...this.cohort.values()].map(f=>f.weight*f.a)),ownKnowledgeGain:sum(fs.map(f=>f.initialWeight*f.ownKnowledgeGain)),diffusionGain:sum(fs.map(f=>f.initialWeight*f.diffusionGain)),learningGapFixed:sum(fs.map(f=>f.initialWeight*f.learningGap)),productivity:rawTfp/this.tfpScale,employment:100*employment/laborForce,unemployment:100*unemployment/laborForce,openingEmployment:labor.openingEmployment,employmentToUnemployment,hiresFromUnemployment,employmentResidual,effectiveHours,productionHours,researchHours,
   utilization:100*sum(active.map(f=>f.util*f.capital))/Math.max(1e-9,capital),capital,loans:this.loans(),rd,rdNonLaborBenchmark:sum(fs.map(f=>p.rdBusiness/100*(1-p.rdLaborShare/100)*f.previousGDP*price)),publicResearch:publicGrants+publicNonBusiness,publicRDGrants:publicGrants,publicResearchNonBusiness:publicNonBusiness,
   publicDebt:this.publicDebt(),bankPublicDebt:this.bank.bonds,householdPublicDebt:sum(hs.map(h=>h.bonds)),bankEquity:this.bank.equity,bankReserves:this.bank.reserves,householdDeposits,firmDeposits,governmentDeposits:this.gov.cash,
   wages,gini:gini(hs.map(h=>h.cash)),defaults,recap,technologyGrowth:100*Math.log(tech/previousTechnology),loanInterest,governmentInterest:governmentInterest+flows.governmentInterestToCentralBank+governmentForeignInterest,researchPayrollResidual,laborResidual,...foreignRowMetrics(p,this.foreign,this.foreignOrigin,this.foreignHistory.length-1,foreignRates),...checks};
  Object.assign(row,publicBudgetMetrics(row,p));
  Object.assign(row,governmentBalanceMetrics(row));
  Object.assign(row,publicDebtFlowMetrics(row,openingPublic));
  if(!Object.values(row).every(Number.isFinite))throw Error('Non-finite output fields: '+Object.entries(row).filter(([,value])=>!Number.isFinite(value)).map(([key])=>key).join(', '));return row;
 }
 wealthMetrics(){const values=financialWealth(this.households,this.firms,100/this.monetary.currencyStrength).map((v,i)=>v+this.households[i].housing*this.society.housingPrice-this.households[i].mortgage),stats=distributionStats(values);return{netWealthGini:stats.gini??0,netWealthGiniDefined:Number(stats.giniDefined),householdNetWealth:stats.total};}
 householdSnapshot(){const wealth=financialWealth(this.households,this.firms,100/this.monetary.currencyStrength);return {income:this.households.map(h=>h.income),wealth,netWealth:wealth.map((v,i)=>v+this.households[i].housing*this.society.housingPrice-this.households[i].mortgage),housing:this.households.map(h=>h.housing*this.society.housingPrice),mortgages:this.households.map(h=>h.mortgage),pensions:this.households.map(h=>h.pensionValue)};}
 snapshot(){return this.firms.map(f=>({id:f.id,birthTime:f.birthTime,exitProbability:f.exitProbability,foreignGain:f.foreignGain,foreignSource:f.foreignSource,foreignTarget:f.foreignTarget,a:f.a,initialWeight:f.initialWeight,ownKnowledgeGain:f.ownKnowledgeGain,diffusionGain:f.diffusionGain,learningGap:f.learningGap,capital:f.capital,capitalInvestment:f.investment??0,capitalSales:f.capitalSold??0,output:f.output,employment:f.employment,loan:f.loan,cash:f.cash,rd:f.rd,researchHours:f.researchHours,share:f.share,innovation:f.innovation,restructured:f.restructured}));}
}
export function simulate(params,seed,{paths=[],shocks=[],snapshots=false}={}){
 const p=sanitize(params),pp=validateTimeline(paths),ss=validateShocks(shocks),e=new Economy(p,seed),rows=[],agents=[],networks=[],householdDistributions=[];let initial=e.initialSnapshot();
 for(let t=0;t<p.burnIn;t++)initial=e.step(t,-p.burnIn+t,[],[]);
 rows.push({...initial,t:0});if(snapshots){agents.push(e.snapshot());networks.push(e.links.map(a=>a.slice()));householdDistributions.push(e.householdSnapshot());}
 for(let t=1;t<=p.periods;t++){const row=e.step(p.burnIn+t,t,pp,ss);row.realGDPPerCapitaGrowth=100*(row.realGDPPerCapita/rows.at(-1).realGDPPerCapita-1);rows.push(row);if(snapshots){agents.push(e.snapshot());networks.push(e.links.map(a=>a.slice()));householdDistributions.push(e.householdSnapshot());}}
 return{rows,agents,networks,householdDistributions,events:e.events,foreignHistory:e.foreignHistory,links:snapshots?e.links:[],params:p,seed,modelVersion:MODEL_VERSION,stepYears:1};
}
export function quantile(values,q){let a=values.slice().sort((x,y)=>x-y),x=(a.length-1)*q,l=Math.floor(x);return a[l]+(a[Math.ceil(x)]-a[l])*(x-l);}
export function summarize(runs){return runs[0].rows.map((_,t)=>{let r={t};for(let key of Object.keys(METRICS)){const a=runs.map(x=>metricValue(x.rows[t],key)).filter(Number.isFinite);r[key]=a.length
 ? {median:quantile(a,.5),mean:sum(a)/a.length,low:quantile(a,.025),high:quantile(a,.975)}
 : {median:null,mean:null,low:null,high:null};}return r;});}
export function runEnsemble(payload,progress=()=>{}){const p=sanitize(payload.params),reference=sanitize(payload.reference??DEFAULTS);for(const d of PARAMETERS.filter(d=>d.design))reference[d.key]=p[d.key];let paths=validateTimeline(payload.paths??[]),shocks=validateShocks(payload.shocks??[]),base=[],scenario=[];for(let i=0;i<p.replications;i++){let seed=p.seed+i*7919;base.push(simulate(reference,seed,{snapshots:i===0}));scenario.push(simulate(p,seed,{paths,shocks,snapshots:i===0}));progress((i+1)/p.replications);}let residuals={maxBank:0,maxReal:0,maxSector:0,maxRelative:0,maxMarket:0,maxFinance:0,maxLabor:0,maxPayroll:0};for(const r of [...base,...scenario])for(const x of r.rows){residuals.maxBank=Math.max(residuals.maxBank,Math.abs(x.bankResidual));residuals.maxReal=Math.max(residuals.maxReal,Math.abs(x.realResidual));residuals.maxSector=Math.max(residuals.maxSector,Math.abs(x.sectorResidual));residuals.maxRelative=Math.max(residuals.maxRelative,x.relativeResidual);residuals.maxMarket=Math.max(residuals.maxMarket,Math.abs(x.marketResidual));residuals.maxFinance=Math.max(residuals.maxFinance,x.financeResidual);residuals.maxLabor=Math.max(residuals.maxLabor,Math.abs(x.laborResidual));residuals.maxPayroll=Math.max(residuals.maxPayroll,Math.abs(x.researchPayrollResidual));}let paired=base.map((b,i)=>{let s=scenario[i].rows[p.periods],r=b.rows[p.periods];return{seed:b.seed,output:100*(s.output/Math.max(1e-9,r.output)-1),technology:100*(s.technology/r.technology-1),knowledge:100*(s.knowledge/r.knowledge-1),realGDPPerCapitaGrowth:s.realGDPPerCapitaGrowth-r.realGDPPerCapitaGrowth,employmentPopulation:s.employmentPopulation-r.employmentPopulation,employment:s.employment-r.employment,loans:s.loans-r.loans};});const diagnostics=diagnoseComparison(p,reference,paths,shocks,base,scenario);return{diagnostics,modelVersion:MODEL_VERSION,stepYears:1,baseline:summarize(base),scenario:summarize(scenario),first:{baseline:base[0],scenario:scenario[0]},paired,inference:inferFinalEffects(paired),residuals,params:p,reference,paths,shocks,raw:{baseline:base.map(r=>({seed:r.seed,rows:r.rows})),scenario:scenario.map(r=>({seed:r.seed,rows:r.rows}))},completedAt:new Date().toISOString(),simulations:p.replications*2};}

export function comparisonSettings(params,reference,paths=[],shocks=[]){
 const differences=PARAMETERS.filter(d=>!d.design&&Math.abs(params[d.key]-reference[d.key])>1e-10).map(d=>({key:d.key,label:d.label,reference:reference[d.key],scenario:params[d.key],unit:d.unit}));
 const rates=Array.from({length:params.periods},(_,i)=>{const t=i+1,p=effectiveParameters(params,t,paths);return{t,reference:clamp(reference.diffusion*reference.absorptiveCapacity*reference.humanCapital,0,1),scenario:clamp(p.diffusion*p.absorptiveCapacity*p.humanCapital,0,1)};});
 const higher=rates.filter(x=>x.scenario>x.reference+1e-12).length,lower=rates.filter(x=>x.scenario<x.reference-1e-12).length;
 const otherPaths=paths.filter(x=>!['diffusion','absorptiveCapacity'].includes(x.key)),otherDifferences=differences.filter(x=>!['diffusion','absorptiveCapacity'].includes(x.key));
 return{differences,rates,higherSteps:higher,lowerSteps:lower,adoptionDirection:lower&&higher?'mixed':lower?'lower':higher?'higher':'unchanged',isolatedAdoptionComparison:!otherPaths.length&&!otherDifferences.length&&!shocks.length,otherPathCount:otherPaths.length,shockCount:shocks.length};
}
export function decomposeTechnology(referenceFirms,scenarioFirms){
 const kb=sum(referenceFirms.map(f=>f.capital)),ks=sum(scenarioFirms.map(f=>f.capital));
 const base=sum(referenceFirms.map(f=>f.a*f.capital))/Math.max(1e-12,kb);
 const reference=new Map(referenceFirms.map((f,i)=>[f.id??i,f])),scenario=new Map(scenarioFirms.map((f,i)=>[f.id??i,f]));
 let within=0,reallocation=0,entry=0,exit=0,fixed=0,less=0,common=0;
 for(const [id,b]of reference){const f=scenario.get(id);if(f){common++;within+=b.capital/kb*(f.a-b.a);reallocation+=(f.capital/ks-b.capital/kb)*f.a;fixed+=(b.initialWeight??0)*(f.a-b.a);if(f.a<b.a-1e-10)less++;}else exit-=b.capital/kb*b.a;}
 for(const [id,f]of scenario)if(!reference.has(id))entry+=f.capital/ks*f.a;
 const factor=100/Math.max(1e-12,base);
 return{withinFirmPercent:within*factor,reallocationPercent:reallocation*factor,entryPercent:entry*factor,exitPercent:exit*factor,populationPercent:(entry+exit)*factor,totalPercent:(within+reallocation+entry+exit)*factor,fixedWeightIndexDifference:fixed,firmsWithLessKnowledge:less,commonFirms:common,scenarioOnlyFirms:scenario.size-common,referenceOnlyFirms:reference.size-common};
}
export function diagnoseComparison(params,reference,paths,shocks,base,scenario){
 const settings=comparisonSettings(params,reference,paths,shocks),final=params.periods;
 const distribution=values=>({median:quantile(values,.5),low:quantile(values,.1),high:quantile(values,.9)});
 const localDirectEffect=settings.rates.map(({t,reference:r,scenario:s})=>({t,...distribution(base.map(b=>(s-r)*b.rows[t].learningGapFixed))}));
 const feedback=Object.fromEntries(['employment','wages','consumption','investment','rd','loans','publicDebt'].map(key=>[key,distribution(base.map((b,i)=>scenario[i].rows[final][key]-b.rows[final][key]))]));
 const firstSeed=base[0].agents.length?{seed:base[0].seed,...decomposeTechnology(base[0].agents[final],scenario[0].agents[final])}:null;
 return{settings,localDirectEffect,firstSeed,feedback,note:'The direct effect changes only the adoption rate at identical reference states. It is a local mechanism diagnostic, not the full macroeconomic counterfactual or an empirical causal estimate. Weight decomposition matches permanent IDs and includes unmatched population contributions. Original-cohort knowledge freezes at the last observation on exit and excludes entrants; it is not active-firm productivity.'};
}
export const SENSITIVITY_SPECIFICATIONS=[
 {id:'configured',label:'Configured assumptions',changes:{}},
 {id:'wage_low',label:'Wage response 0.5',changes:{wageAdjustment:.5}},
 {id:'wage_full',label:'Wage response 1.0',changes:{wageAdjustment:1}},
 {id:'spend_low',label:'Income-spending response 0.7',changes:{consumptionIncome:.7}},
 {id:'spend_full',label:'Income-spending response 1.0',changes:{consumptionIncome:1}},
 {id:'selection_off',label:'No productivity-based customer switching',changes:{marketSelection:0}},
 {id:'public_return',label:'Assumed public frontier return 0.15',changes:{publicResearchReturn:.15}},
 {id:'debt_rule',label:'Assumed debt-driven spending cuts 0.04',changes:{fiscalAdjustment:.04}}
];
export function runSensitivity(payload,progress=()=>{}){
 const count=Math.min(5,sanitize(payload.params).replications),rows=[];
 for(let i=0;i<SENSITIVITY_SPECIFICATIONS.length;i++){
  const spec=SENSITIVITY_SPECIFICATIONS[i],r=runEnsemble({...payload,params:{...payload.params,...spec.changes,replications:count},reference:{...payload.reference,...spec.changes}},p=>progress((i+p)/SENSITIVITY_SPECIFICATIONS.length));
  rows.push({id:spec.id,label:spec.label,changes:spec.changes,seeds:count,simulations:r.simulations,gdp:quantile(r.paired.map(x=>x.output),.5),technology:quantile(r.paired.map(x=>x.technology),.5),knowledge:quantile(r.paired.map(x=>x.knowledge),.5),realGDPPerCapitaGrowth:quantile(r.paired.map(x=>x.realGDPPerCapitaGrowth),.5),employment:quantile(r.paired.map(x=>x.employment),.5),flaggedPaths:[...r.raw.baseline,...r.raw.scenario].filter(b=>b.rows.some(x=>x.employment<50||x.publicDebt>3*Math.max(1e-9,x.nominalOutput))).length});
 }
 return{modelVersion:MODEL_VERSION,stepYears:1,rows,simulations:rows.reduce((s,x)=>s+x.simulations,0),seedsPerSpecification:count,note:'Eight predeclared illustrative specifications. Each changed coefficient is applied to both reference and scenario. These are sensitivity probes, not empirically estimated parameter bounds, confidence intervals or model selection. Custom parameter paths may override a changed starting coefficient.'};
}
