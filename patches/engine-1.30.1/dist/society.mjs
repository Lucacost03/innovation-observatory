import {AgeCohorts}from './age-cohorts.mjs';
// Population cohorts, schooling, funded pensions and dwelling/mortgage ledgers.
// These mechanisms are explicit scenario rules, not estimated policy effects.
import {publicEquityValue} from './finance.mjs';
const sum=a=>a.reduce((s,x)=>s+x,0),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const SOCIAL_FLOWS={births:0,deaths:0,netMigration:0,populationLaborOutflow:0,bankFundingInterest:0,publicPensionBenefits:0,publicPensionContributions:0,publicPensionGap:0,otherCashSupport:0,publicEducationSpending:0,privateEducationSpending:0,educationResourcesIndex:100,publicEducationFundingIndex:100,privateEducationFundingIndex:100,effectivePublicEducationIndex:100,effectivePrivateEducationIndex:100,pensionContributions:0,pensionWithdrawals:0,pensionUnpaidWithdrawals:0,pensionDividends:0,pensionDepositInterest:0,pensionAccruedIncome:0,pensionLiquidationProceeds:0,pensionEquitySales:0,mortgageOriginations:0,mortgageRepayments:0,mortgageInterest:0,mortgageInterestShortfall:0,mortgageDefaults:0,mortgageWriteoffs:0,mortgagePrincipalExtinguished:0,housingForeclosures:0,housingAssetPurchases:0,housingAssetSales:0,bankHousingSales:0,housingConstruction:0,nominalHousingConstruction:0,actualHousingRent:0,imputedHousingRent:0,bankRentalIncome:0,housingServicesReal:0,housingServices:0,housingDepreciation:0,housePriceValuation:0,bankHousingValuation:0,bankHousingDepreciation:0,housingOrders:0,housingUnfilledOrders:0};

export class Society {
 constructor(p){
  this.p=p;this.child=p.initialChildShare;this.old=p.initialOldShare;this.working=100-this.child-this.old;
  if(this.working<=0)throw Error('Opening child and older population shares must total less than100%.');
  this.initialWorking=this.working;this.initialOld=this.old;this.population=100;this.laborForce=100;
  this.ageCohorts=p.ageCohorts?new AgeCohorts(p):null;this.pensionEligible=this.ageCohorts?.eligible??this.old;this.initialPensionEligible=this.pensionEligible;
  this.human=p.initialHumanCapital;this.schoolHistory=[this.human];this.housingPrice=1;this.rentIndex=1;
  this.housing0=p.housingEnabled?p.initialHousingGDP:0;this.housingUnits=this.housing0;
  this.pensionCash=0;this.pensionUnits=0;this.lastPensionPrice=1;
 }
 initialize(e){
  const p=this.p,hs=e.households;
  for(const h of hs){h.housing=0;h.prefersOwnership=false;h.mortgage=0;h.mortgageRate=p.mortgageOpeningRate;h.mortgageArrears=0;h.pensionUnits=0;h.pensionValue=0;}
  e.bank.housing=0;
  if(p.housingEnabled){
   const ranked=[...hs].sort((a,b)=>b.ownership-a.ownership),count=clamp(Math.round(hs.length*p.ownerOccupancy/100),1,hs.length),owners=ranked.slice(0,count);
   const base=this.housing0/hs.length,extra=this.housing0-base*count,totalWeight=sum(owners.map(h=>h.ownership));
   for(const h of owners){h.prefersOwnership=true;h.housing=base+extra*h.ownership/totalWeight;}
   const borrowers=owners.slice().sort((a,b)=>a.earningsWeight-b.earningsWeight),mortgageCount=clamp(Math.round(hs.length*p.mortgagedOwnerShare/100),1,count);
   const start=Math.floor((count-mortgageCount)/2),selected=borrowers.slice(start,start+mortgageCount),collateral=sum(selected.map(h=>h.housing));
   for(const h of selected)h.mortgage=p.initialMortgageGDP*h.housing/collateral;
   // Existing structure collateral is a proxy for the financing preference,
   // not a measured loan-to-value on newly originated mortgages.
   this.openingMortgageShare=Math.min(p.mortgageLTV/100,p.initialMortgageGDP/Math.max(1e-9,collateral));
   this.actualRentUnit=p.actualRentGDP/Math.max(1e-9,base*(hs.length-count));
   this.imputedRentUnit=p.imputedRentGDP/Math.max(1e-9,base*count);
  }
  if(p.pensionEnabled&&p.initialPrivatePensionGDP>0){
   const available=sum(e.firms.map(f=>Math.max(0,f.capital+f.inventory+f.cash-f.loan)*(1-f.publicOwnership)));
   if(p.initialPrivatePensionGDP>available+1e-8)throw Error('Funded pension opening assets exceed available original household firm equity.');
   for(const f of e.firms)f.pensionOwnership=(1-f.publicOwnership)*p.initialPrivatePensionGDP/Math.max(1e-12,available);
   this.pensionUnits=p.initialPrivatePensionGDP;
   for(const h of hs)h.pensionUnits=this.pensionUnits*h.ownership;
  }
  this.markPensions(e,1);
 }
 mortgages(hs){return sum(hs.map(h=>h.mortgage));}
 advance(p,e,flows){
  const before=this.population,previousLF=this.laborForce;
  if(this.ageCohorts){
   if(p.populationDynamics)this.ageCohorts.advance(p,this.schoolHistory,flows);else if(p.educationEnabled)this.ageCohorts.advanceSkills(p,this.schoolHistory);else this.ageCohorts.update(p);
   this.child=this.ageCohorts.child;this.working=this.ageCohorts.working;this.old=this.ageCohorts.old;this.population=this.ageCohorts.population;this.laborForce=this.ageCohorts.laborForce;this.pensionEligible=this.ageCohorts.eligible;
   if(p.educationEnabled)this.human=this.ageCohorts.human;
  }else if(p.populationDynamics){
   const groups=[this.child,this.working,this.old],bases=[this.p.initialChildShare,this.initialWorking,this.initialOld],shares=[p.childDeathShare,p.workingDeathShare,p.oldDeathShare],shareTotal=sum(shares);
   const deaths=groups.map((g,i)=>Math.min(g,g*p.deathRate*(shares[i]/Math.max(1e-12,shareTotal))/Math.max(1e-9,bases[i])));
   const survivors=groups.map((g,i)=>g-deaths[i]),graduate=survivors[0]/15,retire=survivors[1]/50;
   const births=before*p.birthRate/100,net=before*p.netMigrationRate/100,workingShare=p.migrantWorkingShare/100;
   const youngShare=(1-workingShare)*this.p.initialChildShare/(this.p.initialChildShare+this.p.initialOldShare);
   const mix=[youngShare,workingShare,1-workingShare-youngShare],pre=[survivors[0]-graduate+births,survivors[1]+graduate-retire,survivors[2]+retire];
   const migrants=mix.map((w,i)=>Math.max(-pre[i],net*w));
   const skillIndex=Math.max(0,this.schoolHistory.length-p.educationLag),graduateHuman=this.schoolHistory[skillIndex];
   const stay=Math.max(0,survivors[1]-retire),migrationSkill=migrants[1]>=0?this.p.initialHumanCapital*p.migrantHumanCapital:this.human;
   const humanTotal=this.human*stay+graduate*graduateHuman+migrants[1]*migrationSkill;
   [this.child,this.working,this.old]=pre.map((g,i)=>Math.max(1e-9,g+migrants[i]));
   this.population=this.child+this.working+this.old;
   if(p.educationEnabled)this.human=Math.max(.01,humanTotal/this.working);
   this.laborForce=100*this.working/this.initialWorking;
   flows.births=births;flows.deaths=sum(deaths);flows.netMigration=sum(migrants);
   if(Math.abs(this.population-before-births+sum(deaths)-sum(migrants))>1e-7)throw Error('Population stocks and flows did not reconcile.');
  }else if(p.educationEnabled){
   const graduate=this.child/15,idx=Math.max(0,this.schoolHistory.length-p.educationLag);
   this.human=(this.human*Math.max(0,this.working-graduate)+graduate*this.schoolHistory[idx])/Math.max(1e-9,this.working);
  }
  if(this.laborForce<previousLF){const ratio=this.laborForce/previousLF;for(const f of e.firms){flows.populationLaborOutflow+=f.employment*(1-ratio);f.employment*=ratio;}}
  return {laborForce:this.laborForce,populationChange:this.population/before,humanMultiplier:p.educationEnabled?this.human/this.p.initialHumanCapital:1};
 }
 updateRent(p,producerPrice){
  if(!p.housingEnabled)return;
  const scarcity=this.population/100/(Math.max(1e-9,this.housingUnits)/this.housing0),target=producerPrice*scarcity;
  const change=clamp(p.rentAdjustment*Math.log(Math.max(1e-9,target)/this.rentIndex),Math.log(.9),Math.log(1.1));
  this.rentIndex*=Math.exp(change);
 }
 payPublicPensions(e,p,flows,wages,price,baseSupport){
  if(!p.pensionEnabled){flows.otherCashSupport=baseSupport;return baseSupport;}
  flows.otherCashSupport=Math.max(0,baseSupport-Math.min(p.publicPensionGDP,p.incomeSupport)/100*e.lastOutput*price);
  const realWage=e.wage/price/(this.p.laborShare/this.p.employmentRate);
  flows.publicPensionBenefits=p.publicPensionGDP*(this.ageCohorts?this.pensionEligible/Math.max(1e-12,this.initialPensionEligible):this.old/this.initialOld)*price*Math.pow(Math.max(.01,realWage),p.pensionWageIndexation);
  const weights=e.households.map(h=>1/Math.sqrt(Math.max(.1,h.earningsWeight))),total=sum(weights);
  e.support(flows.publicPensionBenefits,p,weights.map(w=>w/total));
  return flows.otherCashSupport;
 }
 reconcilePublicPensionFunding(p,flows){
  // Reporting allocation of taxes already collected; never another payment.
  // Fiscal coverage can refund or collect worker taxes after benefit settlement.
  flows.publicPensionContributions=p.pensionEnabled?Math.max(0,flows.wageWithholding)*p.publicPensionContributionShare/100:0;
  flows.publicPensionGap=flows.publicPensionBenefits-flows.publicPensionContributions;
 }
 settleHousingServices(e,p,flows,creditIncome){
  if(!p.housingEnabled)return;
  const hs=e.households,need=this.housing0/hs.length*this.population/100,owner=hs.map(h=>h.prefersOwnership?Math.min(h.housing,need):0),tenant=hs.map((h,i)=>Math.max(0,need-owner[i])),supply=hs.map((h,i)=>Math.max(0,h.housing-owner[i]));
  const bankSupply=e.bank.housing,totalSupply=sum(supply)+bankSupply,totalNeed=sum(tenant),ration=totalNeed?Math.min(1,totalSupply/totalNeed):0;
  let actual=0,realActual=0;
  hs.forEach((h,i)=>{const units=tenant[i]*ration,due=units*this.actualRentUnit*this.rentIndex,paid=Math.min(h.cash,due);h.cash-=paid;actual+=paid;realActual+=paid/Math.max(1e-12,this.rentIndex);});
  if(totalSupply>0){hs.forEach((h,i)=>creditIncome(h,actual*supply[i]/totalSupply));flows.bankRentalIncome=actual*bankSupply/totalSupply;e.bank.equity+=flows.bankRentalIncome;}
  flows.actualHousingRent=actual;flows.imputedHousingRent=sum(owner)*this.imputedRentUnit*this.rentIndex;
  flows.housingServices=flows.actualHousingRent+flows.imputedHousingRent;
  flows.housingServicesReal=realActual+sum(owner)*this.imputedRentUnit;
 }
 mortgageQuote(p,policyRate){return clamp(this.p.initialPolicyRate+p.mortgageSpread+p.mortgagePassThrough*(policyRate-this.p.initialPolicyRate),0,30);}
 settleMortgages(e,p,flows,quote){
  if(!p.housingEnabled)return;
  for(const h of e.households){
   h.mortgageRate+=p.mortgageRepricing/100*(quote-h.mortgageRate);
   const due=h.mortgage*h.mortgageRate/100,paid=Math.min(h.cash,due);h.cash-=paid;h.income-=paid;e.bank.equity+=paid;flows.mortgageInterest+=paid;flows.mortgageInterestShortfall+=due-paid;
   h.mortgageArrears=paid<due-1e-8?h.mortgageArrears+1:0;
   const repay=Math.min(h.mortgage,h.mortgage/p.mortgageTerm,h.cash);h.cash-=repay;h.mortgage-=repay;flows.mortgageRepayments+=repay;
   if(h.mortgageArrears>=p.defaultAfter&&h.mortgage>0){
    const seized=Math.min(h.housing,h.mortgage/this.housingPrice),loss=Math.max(0,h.mortgage-seized*this.housingPrice);
    flows.mortgagePrincipalExtinguished+=h.mortgage;e.bank.housing+=seized;h.housing-=seized;e.bank.equity-=loss;flows.housingForeclosures+=seized;flows.mortgageWriteoffs+=loss;flows.mortgageDefaults++;h.mortgage=0;h.mortgageArrears=0;
   }
  }
 }
 lendingCapacity(e,p,exposure){
  return !p.capitalRequirement?Infinity:Math.max(0,e.bank.equity/(p.capitalRequirement/100)-e.loans()-this.mortgages(e.households)*p.mortgageRiskWeight-e.bank.bonds*exposure.publicCreditWeight)/p.mortgageRiskWeight;
 }
 fundPurchase(e,h,budget,p,quote,exposure,flows,reserve=0){
  const equityCash=Math.max(0,h.cash-reserve),income=Math.max(0,h.lastIncome??h.income),service=quote/100+1/p.mortgageTerm;
  const serviceRoom=Math.max(0,income*p.mortgageDebtServiceLimit/100-h.mortgage*(h.mortgageRate/100+1/p.mortgageTerm));
  const debtRoom=service>0?serviceRoom/service:0,ltv=p.mortgageLTV/100;
  const collateralRoom=Math.max(0,ltv*(h.housing*this.housingPrice+budget)-h.mortgage);
  const downPaymentRoom=ltv<1?(ltv*equityCash+Math.max(0,ltv*h.housing*this.housingPrice-h.mortgage))/(1-ltv):Infinity;
  const openingQuote=this.p.initialPolicyRate+this.p.mortgageSpread;
  const preferredLoan=p.housingFinanceMix?budget*clamp((this.openingMortgageShare??0)*Math.exp(-p.housingRateSensitivity*(quote-openingQuote)),0,p.mortgageLTV/100):0;
  const loan=Math.min(budget,Math.max(0,budget-equityCash,preferredLoan),debtRoom,collateralRoom,downPaymentRoom,this.lendingCapacity(e,p,exposure)*p.creditAvailability);
  const paid=Math.min(budget,equityCash+loan),oldDebt=h.mortgage;
  if(loan>0){h.cash+=loan;h.mortgage+=loan;h.mortgageRate=(h.mortgageRate*oldDebt+quote*loan)/h.mortgage;flows.mortgageOriginations+=loan;}
  return {budget:paid,loan};
 }
 constructionTarget(e,p,quote){
  if(!p.housingEnabled)return 0;
  const demandFactor=Math.min(2,Math.pow(this.housingPrice/e.prices.producerPrice,2)*this.population/100/(Math.max(1e-9,this.housingUnits)/this.housing0));
  return demandFactor*p.investmentShare*p.residentialInvestmentShare/100/100*e.lastOutput*Math.exp(-p.housingRateSensitivity*(quote-(this.p.initialPolicyRate+this.p.mortgageSpread)));
 }
 housingOrders(e,p,quote,exposure,flows,plans){
  if(!p.housingEnabled)return e.households.map(()=>({budget:0,loan:0}));
  const target=this.constructionTarget(e,p,quote)*e.prices.producerPrice;
  const need=this.housing0/e.households.length*this.population/100,weights=e.households.map(h=>(h.prefersOwnership?Math.max(0,need-h.housing):0)+p.housingInvestorDemand/100*need*h.ownership*e.households.length),total=sum(weights);
  const orders=e.households.map((h,i)=>this.fundPurchase(e,h,total?target*weights[i]/total:0,p,quote,exposure,flows,plans[i]));
  flows.housingOrders=sum(orders.map(x=>x.budget));return orders;
 }
 settleConstruction(e,orders,fill,price,flows){
  let total=0;
  e.households.forEach((h,i)=>{const order=orders[i],paid=order.budget*fill,refund=order.loan*(1-fill);h.cash-=paid+refund;h.mortgage-=refund;flows.mortgageOriginations-=refund;h.housing+=paid/price;total+=paid;});
  flows.nominalHousingConstruction=total;flows.housingConstruction=total/price;flows.housingUnfilledOrders=flows.housingOrders-total;
 }
 tradeExistingHousing(e,p,quote,exposure,flows){
  if(!p.housingEnabled||!p.housingTurnover)return;
  const hs=e.households,need=this.housing0/hs.length*this.population/100;
  const sellers=hs.map(h=>({h,units:Math.max(0,h.housing-(h.prefersOwnership?need:0))*p.housingTurnover/100}));
  // A partial sale releases the matching share of mortgage collateral. An
  // underwater owner must fund the difference from existing cash; selling
  // cannot silently overdraw the deposit or create negative pension units.
  const saleCapacity=s=>{
   const repaymentPerUnit=s.h.housing>0?s.h.mortgage/s.h.housing:0;
   const cashPerUnit=Math.max(0,repaymentPerUnit-this.housingPrice);
   return Math.min(s.units,s.h.housing,cashPerUnit>0?Math.max(0,s.h.cash)/cashPerUnit:Infinity);
  };
  let bankUnits=e.bank.housing;
  const buyers=[...hs].sort((a,b)=>(b.prefersOwnership?need-b.housing:0)-(a.prefersOwnership?need-a.housing:0));
  for(const buyer of buyers){
   const gap=buyer.prefersOwnership?Math.max(0,need-buyer.housing):0,wanted=gap*this.housingPrice+p.housingInvestorDemand/100*Math.max(0,buyer.cash);
   const supply=bankUnits+sum(sellers.filter(s=>s.h!==buyer).map(saleCapacity));
   if(!supply||wanted<=0)continue;
   const order=this.fundPurchase(e,buyer,Math.min(wanted,supply*this.housingPrice),p,quote,exposure,flows),units=order.budget/this.housingPrice;
   if(!units)continue;buyer.cash-=order.budget;buyer.housing+=units;flows.housingAssetPurchases+=order.budget;
   let remaining=units,bankSale=Math.min(bankUnits,remaining);bankUnits-=bankSale;e.bank.housing-=bankSale;remaining-=bankSale;flows.bankHousingSales+=bankSale*this.housingPrice;
   for(const seller of sellers){if(seller.h===buyer||!remaining)continue;const sold=Math.min(saleCapacity(seller),remaining),value=sold*this.housingPrice;
    if(!sold)continue;const oldHousing=seller.h.housing,repay=Math.min(seller.h.mortgage,value*seller.h.mortgage/Math.max(1e-9,oldHousing*this.housingPrice));
    seller.units-=sold;seller.h.housing-=sold;seller.h.cash+=value-repay;seller.h.mortgage-=repay;flows.mortgageRepayments+=repay;flows.housingAssetSales+=value;remaining-=sold;
   }
  }
 }
 markPensions(e,price){
  const assets=this.pensionCash+publicEquityValue([...e.firms,...e.estates],price,'pensionOwnership');
  const unit=this.pensionUnits>1e-12?assets/this.pensionUnits:1;
  for(const h of e.households)h.pensionValue=h.pensionUnits*unit;
  this.lastPensionPrice=unit;return assets;
 }
 closePensions(e,p,flows,wages,price,openingCash){
  if(!p.pensionEnabled)return;
  const interest=openingCash*e.monetary.householdDepositRate/100;this.pensionCash+=interest;e.bank.equity-=interest;flows.pensionDepositInterest=interest;
  let assets=this.markPensions(e,price),unit=this.pensionUnits>1e-12?assets/this.pensionUnits:1;
  const wanted=wages*p.privatePensionContributionRate/100,weights=e.households.map(h=>h.earningsWeight),total=sum(weights);
  if(unit>1e-12)e.households.forEach((h,i)=>{const paid=Math.min(Math.max(0,h.cash),wanted*weights[i]/total);h.cash-=paid;this.pensionCash+=paid;h.pensionUnits+=paid/unit;this.pensionUnits+=paid/unit;flows.pensionContributions+=paid;});
  assets=this.markPensions(e,price);const requested=assets*p.privatePensionWithdrawalRate/100*(this.ageCohorts?this.pensionEligible/Math.max(1e-12,this.initialPensionEligible):this.old/this.initialOld);
  const equity=publicEquityValue(e.firms,price,'pensionOwnership'),shortage=Math.max(0,requested-this.pensionCash);
  const capacity=Math.max(0,Math.min(...e.households.filter(h=>h.ownership>0).map(h=>h.cash/h.ownership)));
  const sale=Math.min(shortage,equity,capacity);
  if(sale>0){for(const h of e.households)h.cash-=sale*h.ownership;this.pensionCash+=sale;for(const f of e.firms)f.pensionOwnership=(f.pensionOwnership??0)*(1-sale/equity);flows.pensionEquitySales=sale;}
  assets=this.markPensions(e,price);unit=this.pensionUnits>1e-12?assets/this.pensionUnits:1;
  const paid=Math.min(this.pensionCash,requested),units=unit>0?Math.min(this.pensionUnits,paid/unit):0,totalUnits=this.pensionUnits;
  if(totalUnits>0)for(const h of e.households){const share=h.pensionUnits/totalUnits;h.cash+=paid*share;h.pensionUnits=Math.max(0,h.pensionUnits-units*share);}
  this.pensionUnits=Math.max(0,this.pensionUnits-units);this.pensionCash-=paid;flows.pensionWithdrawals=paid;flows.pensionUnpaidWithdrawals=requested-paid;flows.pensionAccruedIncome=flows.pensionDividends+flows.pensionDepositInterest;this.markPensions(e,price);
  if(Math.abs(sum(e.households.map(h=>h.pensionUnits))-this.pensionUnits)>1e-10*Math.max(1,this.pensionUnits))throw Error('Funded pension units did not reconcile.');
 }
 closeEducation(p,flows,nominalGovernment,nominalGoodsConsumption,price,openingGovShare,openingGoodsConsumption){
  if(!p.educationEnabled){this.schoolHistory.push(this.human);return;}
  flows.publicEducationSpending=Math.min(nominalGovernment,openingGovShare>0?nominalGovernment*p.publicEducationGDP/openingGovShare:0);
  flows.privateEducationSpending=Math.min(nominalGoodsConsumption,openingGoodsConsumption>0?nominalGoodsConsumption*p.privateEducationGDP/openingGoodsConsumption:0);
  const qualityAnchor=this.p.initialEducationQuality??1;
  const publicRelativeQuality=p.publicEducationQuality/qualityAnchor,privateRelativeQuality=p.privateEducationQuality/qualityAnchor;
  const base=this.p.publicEducationGDP+this.p.privateEducationGDP,resource=(flows.publicEducationSpending*publicRelativeQuality+flows.privateEducationSpending*privateRelativeQuality)/price;
  const relative=base>0?resource/(base*this.child/this.p.initialChildShare):1;
  // Reporting decomposes the existing single funding/effectiveness channel.
  const pupilScale=this.child/this.p.initialChildShare;
  flows.publicEducationFundingIndex=this.p.publicEducationGDP>0?100*flows.publicEducationSpending/price/(this.p.publicEducationGDP*pupilScale):0;
  flows.privateEducationFundingIndex=this.p.privateEducationGDP>0?100*flows.privateEducationSpending/price/(this.p.privateEducationGDP*pupilScale):0;
  flows.effectivePublicEducationIndex=flows.publicEducationFundingIndex*publicRelativeQuality;
  flows.effectivePrivateEducationIndex=flows.privateEducationFundingIndex*privateRelativeQuality;
  flows.educationResourcesIndex=100*relative;
  this.schoolHistory.push(this.p.initialHumanCapital*Math.pow(Math.max(.01,relative),p.educationElasticity));
 }
 closeHousing(e,p,flows,quote,price){
  if(!p.housingEnabled)return;
  const units=sum(e.households.map(h=>h.housing))+e.bank.housing,oldPrice=this.housingPrice;
  const depreciation=units*p.housingDepreciation/100;
  for(const h of e.households)h.housing*=1-p.housingDepreciation/100;
  flows.bankHousingDepreciation=e.bank.housing*p.housingDepreciation/100*oldPrice;
  e.bank.housing*=1-p.housingDepreciation/100;e.bank.equity-=flows.bankHousingDepreciation;
  this.housingUnits=units-depreciation;
  const scarcity=this.population/100/(this.housingUnits/this.housing0),rateMove=quote-(this.p.initialPolicyRate+this.p.mortgageSpread),target=price*scarcity*Math.exp(-p.housingRateSensitivity*rateMove);
  this.housingPrice*=Math.exp(clamp(p.housePriceAdjustment*Math.log(Math.max(1e-9,target)/oldPrice),Math.log(.85),Math.log(1.15)));
  flows.housePriceValuation=this.housingUnits*(this.housingPrice-oldPrice);flows.bankHousingValuation=e.bank.housing*(this.housingPrice-oldPrice);e.bank.equity+=flows.bankHousingValuation;
  flows.housingDepreciation=depreciation;
 }
 metrics(e,p,price=1){
  const mortgages=this.mortgages(e.households),pensionAssets=this.markPensions(e,price);
  const participation=this.ageCohorts?.participationRate??p.initialParticipationRate;
  return {participationRate:participation,inactivePopulation:100-participation,workingAgeShare:100*this.working/Math.max(1e-12,this.population),pensionEligiblePopulation:this.ageCohorts?this.pensionEligible:this.old,pensionEligibleShare:100*(this.ageCohorts?this.pensionEligible:this.old)/Math.max(1e-12,this.population),retirementAge:this.ageCohorts?.retirementAgeUsed??p.retirementAge,populationMillions:this.p.initialPopulationMillions*this.population/100,populationIndex:this.population,childPopulation:this.child,workingAgePopulation:this.working,olderPopulation:this.old,laborForce:this.laborForce,oldAgeDependency:100*this.old/this.working,humanCapitalLevel:this.human,humanCapitalIndex:100*this.human/this.p.initialHumanCapital,housingStock:this.housingUnits,housePriceIndex:100*this.housingPrice,rentPriceIndex:100*this.rentIndex,householdHousingValue:sum(e.households.map(h=>h.housing))*this.housingPrice,bankHousingValue:e.bank.housing*this.housingPrice,householdMortgageDebt:mortgages,financialTermFunding:e.bank.termFunding,pensionAssets,pensionCash:this.pensionCash,pensionFirmEquity:Math.max(0,pensionAssets-this.pensionCash),mortgageRate: mortgages?sum(e.households.map(h=>h.mortgage*h.mortgageRate))/mortgages:this.mortgageQuote(p,e.monetary.policyRate),newMortgageRate:this.mortgageQuote(p,e.monetary.policyRate),housingActive:p.housingEnabled,pensionsActive:p.pensionEnabled,educationActive:p.educationEnabled,populationActive:p.populationDynamics};
 }
}
