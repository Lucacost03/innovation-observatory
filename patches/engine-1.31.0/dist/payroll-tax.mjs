// Reconcile the model's pooled worker tax with its actual payroll recipients.
// This is a payment-allocation correction, not a national tax microsimulation.
const sum=a=>a.reduce((s,x)=>s+x,0);

export function settleWorkerTax(e,p,flows,target){
 if(!Number.isFinite(target)||target<0)throw Error('Invalid worker tax target.');
 const households=e.households,gross=e.workerGrossPayroll??households.map(()=>0);
 if(gross.length!==households.length||gross.some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid worker payroll ledger.');
 const total=sum(gross),prepaid=Math.max(0,flows.wageWithholding),request=target-prepaid;
 const shares=gross.map(x=>total>0?x/total:0);
 let openingCash=households.map(h=>h.cash);
 let adjustment=0,refund=0,extra=0;
 if(request<0&&total>0){
  refund=Math.min(-request,prepaid);
  e.ensureGov(refund,p);e.gov.cash-=refund;
  openingCash=households.map(h=>h.cash);
  households.forEach((h,i)=>{const payment=refund*shares[i];h.cash+=payment;h.income+=payment;});
  adjustment=-refund;
 }else if(request>0&&total>0){
  households.forEach((h,i)=>{
   const paidBefore=prepaid*shares[i],liability=Math.min(request*shares[i],Math.max(0,gross[i]-paidBefore));
   const payment=Math.min(Math.max(0,h.cash),liability);
   h.cash-=payment;h.income-=payment;extra+=payment;
  });
  e.gov.cash+=extra;adjustment=extra;
 }
 flows.wageWithholding+=adjustment;
 flows.fiscalHouseholdTaxAdjustment=adjustment;
 flows.fiscalWorkerTaxRefund=refund;
 flows.fiscalWorkerExtraTax=extra;
 flows.fiscalWorkerTaxUncollected=Math.max(0,target-flows.wageWithholding);
 flows.fiscalUnpaidRevenue+=flows.fiscalWorkerTaxUncollected;
 // Actual before/after cash is retained for independent counterparty checks.
 // The snapshot excludes any bond purchases financing the government refund.
 e.workerTaxAudit={grossPayroll:Array.from(gross),openingCash,closingCash:households.map(h=>h.cash),prepaid,finalPaid:flows.wageWithholding};
 return {adjustment,refund,extra,uncollected:flows.fiscalWorkerTaxUncollected};
}
