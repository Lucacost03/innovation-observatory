import {settleWorkerTax}from './payroll-tax.mjs';
import {DEFAULTS}from './parameters.mjs';
import {capitalFiscalPolicy}from './fiscal-capital.mjs';
import {FISCAL_ENGINE} from './fiscal-data.mjs';
import {LEGACY_FISCAL_CALIBRATION}from './legacy-fiscal-calibration.mjs';
const sum=a=>a.reduce((s,x)=>s+x,0);
export const FISCAL_FLOWS={fiscalCapitalExpenseSourceYear:2023,fiscalCapitalRevenueSourceYear:2023,fiscalCapitalPathActive:0,fiscalCapitalPathAvailable:0,fiscalCapitalExtrapolated:0,defenseResearchPlanChange:0,fiscalSalesNettingAdjustment:0,publicRestrictedBenefits:0,restrictedBenefitQuantity:0,fiscalHouseholdTaxAdjustment:0,fiscalWorkerTaxRefund:0,fiscalWorkerExtraTax:0,fiscalWorkerTaxUncollected:0,fiscalCorporateTaxAdjustment:0,fiscalOtherProductionTaxes:0,fiscalOtherCurrentRevenue:0,fiscalCurrentCoverageExpense:0,fiscalCapitalExpenditure:0,fiscalCapitalRevenue:0,fiscalNoncashMatchedMemo:0,fiscalNoncashPensionInterest:0,fiscalUnpaidRevenue:0,fiscalGovernmentPensionLiability:0};
export const fiscalContext=p=>{const c=p.fiscalCoverage?FISCAL_ENGINE[p.foreignPoolId]:null;return c&&!(p.ageCohorts||p.foreignGovBondMarket||p.initialForeignGovDebt)?{...c,calibration:LEGACY_FISCAL_CALIBRATION[p.foreignPoolId]??c.calibration}:c;};
function distribute(items,amount,weight,mutate){const total=sum(items.map(weight));items.forEach(x=>mutate(x,amount*(total>0?weight(x)/total:1/items.length)));}
function privatePayment(e,p,items,request,income){
 if(request<0){e.ensureGov(-request,p);e.gov.cash+=request;distribute(items,-request,x=>Math.max(0,x.ownership??x.share??0),(x,a)=>{x.cash+=a;if(income)x.income+=a;});return request;}
 const available=sum(items.map(x=>Math.max(0,x.cash))),paid=Math.min(request,available);
 distribute(items,paid,x=>Math.max(0,x.cash),(x,a)=>{x.cash-=a;if(income)x.income-=a;});e.gov.cash+=paid;return paid;
}
function publicFirmTransfer(e,p,request){return -privatePayment(e,p,e.firms,-request,false);}
export function settleFiscalCoverage(e,p,flows,nominalScale,monetary,calendarYear=2024){
 const c=fiscalContext(p),a=c?.opening,k=c?.calibration;if(!a||!k)return;
 const dated=capitalFiscalPolicy(p,calendarYear,a);Object.assign(flows,{fiscalCapitalExpenseSourceYear:dated.fiscalCapitalExpenseSourceYear,fiscalCapitalRevenueSourceYear:dated.fiscalCapitalRevenueSourceYear,fiscalCapitalPathActive:dated.fiscalCapitalPathActive,fiscalCapitalPathAvailable:dated.fiscalCapitalPathAvailable,fiscalCapitalExtrapolated:dated.fiscalCapitalExtrapolated});
 // Older EU fiscal snapshots stored zero for the corporate control even
 // though the active preset used the positive registry default. A zero
 // reference must not make the user's control ineffective.
 const factor=Math.max(0,nominalScale)/100,policy=key=>{
  const reference=c.basePolicy[key]>0?c.basePolicy[key]:DEFAULTS[key];
  return reference>0?p[key]/reference:1;
 };
 const targetWithholding=(a.householdTaxSocial-k.capitalIncomeTaxesGDP)*factor*policy('incomeTax');
 settleWorkerTax(e,p,flows,targetWithholding);
 const targetCorporate=a.corporateTax*factor*policy('profitTax'),fAdj=privatePayment(e,p,e.firms,targetCorporate-flows.profitTaxPaid,false);flows.profitTaxPaid+=fAdj;flows.fiscalCorporateTaxAdjustment=fAdj;flows.fiscalUnpaidRevenue+=Math.max(0,targetCorporate-flows.profitTaxPaid);
 const otherProduction=(a.productionTaxes-k.consumptionTaxesGDP-(p.tariffSettlement?(c.tariffCalibration?.domesticDutyGDP??0):0))*factor;
 flows.fiscalOtherProductionTaxes=privatePayment(e,p,e.firms,otherProduction,false);flows.fiscalUnpaidRevenue+=Math.max(0,otherProduction-flows.fiscalOtherProductionTaxes);
 const otherReceipts=(a.otherCurrentRevenue-a.matchedNoncash-k.publicPropertyIncomeGDP-(p.tariffSettlement?(c.tariffCalibration?.collectionFeeGDP??0):0))*factor;
 flows.fiscalOtherCurrentRevenue=privatePayment(e,p,e.households,otherReceipts,true);flows.fiscalUnpaidRevenue+=Math.max(0,otherReceipts-flows.fiscalOtherCurrentRevenue);
 flows.fiscalCurrentCoverageExpense=publicFirmTransfer(e,p,k.currentExpenseCoverageGDP*factor);
 // National investment already includes public capital formation. These are
 // financing transfers, not another good or additional current income.
 flows.fiscalCapitalRevenue=privatePayment(e,p,e.firms,dated.capitalRevenue*factor,false);
 flows.fiscalUnpaidRevenue+=Math.max(0,dated.capitalRevenue*factor-flows.fiscalCapitalRevenue);
 flows.fiscalCapitalExpenditure=publicFirmTransfer(e,p,dated.capitalExpense*factor);
 flows.fiscalNoncashMatchedMemo=a.matchedNoncash*factor;flows.fiscalSalesNettingAdjustment=-(a.reportSalesNetting??0)*factor;
 const rate=c.basePolicy.bondRate>0?Math.max(0,monetary.publicDebtRate)/c.basePolicy.bondRate:1;
 flows.fiscalNoncashPensionInterest=a.noncashInterest*factor*rate;
 if(flows.fiscalNoncashPensionInterest){
  e.gov.pensionLiability=(e.gov.pensionLiability??0)+flows.fiscalNoncashPensionInterest;
  distribute(e.households,flows.fiscalNoncashPensionInterest,h=>h.earningsWeight,(h,x)=>{h.publicPensionClaim=(h.publicPensionClaim??0)+x;});
  flows.pensionAccruedIncome+=flows.fiscalNoncashPensionInterest;
 }
 flows.fiscalGovernmentPensionLiability=e.gov.pensionLiability??0;
 const claims=sum(e.households.map(h=>h.publicPensionClaim??0));
 if(Math.abs(claims-flows.fiscalGovernmentPensionLiability)>1e-8*Math.max(1,claims))throw Error('Noncash public pension claims did not reconcile.');
}
export function openingFiscalMetrics(p){const context=fiscalContext(p),a=context?.opening;if(!a)return {};
 const net=a.reportSalesNetting??0;
 return {fiscalOpeningBenchmark:1,fiscalCurrentSplitKnown:Number(context.country!=='CHN'),publicCurrentRevenue:a.currentRevenue-net,publicCurrentExpenditure:a.currentExpenditure-net,publicCurrentRevenueGDP:a.currentRevenue-net,publicCurrentExpenditureGDP:a.currentExpenditure-net,publicTotalRevenue:a.revenue-net,publicTotalExpenditure:a.expenditure-net,publicTotalRevenueGDP:a.revenue-net,publicTotalExpenditureGDP:a.expenditure-net,publicNetLending:a.revenue-a.expenditure,publicSaving:a.currentRevenue-a.currentExpenditure,publicBudgetRatioDefined:1,publicRestrictedBenefits:a.restrictedBenefits,restrictedBenefitQuantity:a.restrictedBenefits,fiscalSalesNettingAdjustment:-net,fiscalCapitalRevenue:a.capitalRevenue,fiscalCapitalExpenditure:a.capitalExpenditure,fiscalNoncashPensionInterest:a.noncashInterest,fiscalNoncashMatchedMemo:a.matchedNoncash};}
