import {retirementComparison}from './retirement-diagnostics.mjs';
import {quantile} from './engine.mjs';
import {foreignProviders} from './foreign.mjs';

const median = values => quantile(values, .5);
const direction = (value, margin) => value > margin ? 1 : value < -margin ? -1 : 0;
const throughRun = (run, key) => run.rows.slice(1).reduce((total, row) => total + row[key], 0);

export function simulationFindings(result) {
  const {scenario, baseline: reference} = result.raw;
  const last = result.params.periods;
  const level = (key, year) => median(scenario.map(run => run.rows[year][key]));
  const difference = (year, read) => median(scenario.map((run, i) =>
    read(run.rows[year]) - read(reference[i].rows[year])));
  const relative = (key, year) => median(scenario.map((run, i) => {
    const base = reference[i].rows[year][key];
    return (run.rows[year][key] - base) / Math.max(1, base);
  }));
  const production = direction(relative('goodsOutput', last), .01);
  const jobs = direction(difference(last, row => row.employment), .5);
  const purchases = direction(relative('householdGoods', last), .01);
  const technology = direction(relative('technology', last), .005);
  const heading = production > 0 ? 'The economy ends up producing more'
    : production < 0 ? 'Production ends lower than in the reference'
    : 'Production ends close to the reference';
  const summary = [
    jobs > 0 ? 'By the final year, more people are working than in the reference economy.'
      : jobs < 0 ? 'By the final year, fewer people are working than in the reference economy.' : 'Employment is similar in both economies by the final year.',
    purchases > 0 ? 'Households buy more goods.' : purchases < 0 ? 'Households buy fewer goods.' : '',
  ].filter(Boolean).join(' ');

  const findings = [];
  const policy = [];
  const total = key => median(scenario.map(run => throughRun(run, key)));
  if(total('assetPurchases')>1e-8){
    findings.push('After sustained very low inflation and little room for further rate cuts, the central bank bought existing public bonds. Household sellers received spendable deposits; bank sellers exchanged bonds for reserves. The purchases did not directly create production or cancel public debt.');
    if(total('unfilledAssetPurchases')>.01)findings.push('At times the purchase limit or available bonds restricted the response. Asset purchases could not expand without limit.');
    if(level('centralBankLossCarryforward',last)>.01)findings.push('The central bank carried losses because interest on its new reserves exceeded some of its asset income. Later profits first cover those losses before reaching the government.');
    policy.push('Compare emergency purchases with the same economy using rate policy alone. Their effect depends on whether sellers spend or reinvest the deposits, credit conditions and available goods; price stability is not guaranteed.');
  }
  if(level('populationActive',last)){
    const move=direction(level('populationIndex',last)-100,.1),workers=direction(level('laborForce',last)-100,.1);
    findings.push((move>0?'The population grew, adding to housing and service needs.':move<0?'The population shrank, reducing the number of people the economy supports.':'Population stayed close to its opening size.')+' '+(workers>0?'The potential workforce also expanded.':workers<0?'The potential workforce became smaller.':'The potential workforce changed little.')+' GDP per person shows whether living standards kept pace with total output.');
  }
  const activityMove=direction(level('participationRate',last)-level('participationRate',0),.05);
  if(result.params.ageParticipation&&activityMove){findings.push(activityMove>0?'A larger share of working-age people joined the model labour force as the population shifted toward ages with higher participation. More available workers do not automatically mean more jobs; firms still need demand and finance.':'A smaller share of working-age people remained in the model labour force as the population shifted toward ages with lower participation. This is an age-composition effect, separate from unemployment among those still seeking work.');policy.push('Distinguish fewer available workers from weak hiring. Participation support, childcare, training and flexible later-life work could change within-age activity; these policy effects are not estimated here.');}
  if(total('importedCostPriceContribution')>.05){findings.push('The imported-cost component added upward pressure to domestic producer prices over the run. This can weaken price competitiveness and offset part of a depreciation advantage. Import costs can also rise because foreign prices increase, even when the currency is stable. Final consumer imports separately affect living costs; demand, export competitiveness, financing and foreign income still determine the current account.');policy.push('A weaker currency need not deliver a large trade improvement when production relies on imported inputs. Compare the assumed cost pass-through with alternative values rather than treating depreciation as a guaranteed cure for an external deficit.');}
  if(total('importedCostPriceContribution')<-.05)findings.push('Falling import costs eased the producer-price component over this run. That can support firms using foreign inputs and household purchasing power. It does not guarantee a larger current-account surplus: foreign competition, export demand and income flows still matter.');
  if(level('educationActive',last)){
    const skills=direction(difference(last,row=>row.humanCapitalIndex),.01);
    const learningSupport=direction(difference(last,row=>row.educationTFPMultiplier??1),.001);
    if(learningSupport)findings.push(learningSupport>0?'Workforce skills gave research and technology adoption more support than in the reference. Firms had better chances of successful research and could learn more quickly from useful technologies. The strength of this connection was an experiment assumption; demand, finance and firm turnover still shaped the final result.':'The workforce-skills channel held back research and technology adoption relative to the reference. A stronger assumed connection can amplify a shortage of skills as well as amplify gains from better learning.');
    findings.push(skills>0?'Workers end with more modeled human capital than in the reference. Better learning reached incoming workers after the schooling delay and raised their labor efficiency.':skills<0?'Workers end with less modeled human capital than in the reference. School resources and the changing workforce influenced the skill stock with a delay.':'Education resources feed future workers gradually. The skill stock ends close to the reference; a short run can finish before an education change reaches the workforce.');
    if(skills)policy.push('Compare education quality and access over a long horizon. Extra spending alone does not guarantee better learning; check the assumed delay and effectiveness.');
  }
  if(level('pensionsActive',last)){
    findings.push(level('publicPensionGap',last)>0?'The model’s allocation of collected worker taxes did not cover public old-age payments in the final year. Other revenue or borrowing financed the difference.':'The model’s assumed allocation of collected worker taxes covered public old-age payments in the final year. This is not an observed pension-fund surplus; the wider public budget still matters.');
    if(total('pensionContributions')>0)findings.push('Some household cash moved into funded retirement claims. Investment returns and losses changed those assets, while withdrawals turned part of the claims back into spendable cash. These transfers did not create extra production.');
    if(total('pensionUnpaidWithdrawals')>.01)findings.push('At times the pension fund could not turn enough assets into cash to meet planned withdrawals. Some payments were delayed.');
  }
  if(level('housingActive',last)){
    findings.push('Households used savings and eligible mortgages to acquire housing. Construction added new dwellings; trading existing homes moved assets between owners. Rental payments and owner-occupied housing services formed part of GDP.');
    if(total('mortgageDefaults')>0){findings.push('Some borrowers could not meet mortgage interest payments. Foreclosure transferred collateral to the financial sector, with losses where its modeled value did not cover the debt.');policy.push('Compare debt-service limits and mortgage repricing. Check housing access alongside borrower distress, business credit and financial-sector losses.');}
  }
  if(level('foreignForecastActive',last)){
    findings.push('Foreign productivity followed the chosen long-term projection, with growth changing from year to year. These outside paths changed the technology firms could learn and the strength of foreign competitors. They were inputs to this experiment, not discoveries made by the simulation.');
    if(level('foreignProjectionExtrapolated',last))findings.push('The run extended beyond the published foreign projection horizon. Later foreign growth repeats the last published rate as an explicit assumption.');
  }
  if(result.shocks?.some(shock=>shock.type.startsWith('foreignTFP'))){
    findings.push('The experiment changed productivity growth abroad. Each affected year compounded the foreign technology level; when a temporary growth surprise faded, its accumulated level effect remained. Domestic learning responded only when that knowledge became available through the adoption delay.');
    policy.push('Compare domestic research, skills and access to foreign knowledge under several foreign paths. A stronger foreign frontier offers learning opportunities and tougher competition; it does not guarantee higher domestic GDP.');
  }
  const creditDirection=direction(level('privateDebtGDP',last)-level('privateDebtGDP',0),.5);
  const stockDirection=direction(level('privateDebt',last)-level('privateDebt',0),.1);
  if(creditDirection<0){findings.push(stockDirection<0?'Private borrowing becomes smaller relative to the economy. Repayment and debt removed on failure outpace enough new lending to shrink the outstanding debt stock; changes in nominal GDP also affect the ratio.':'Private debt becomes smaller relative to the economy even though its nominal stock does not shrink. Nominal GDP grows faster than debt, so the ratio falls. This does not mean all borrowers have repaid their loans.');}
  if(creditDirection>0)findings.push('Private debt grows relative to the economy. New investment and housing credit, principal repayments and the size of nominal GDP jointly shape this result. A higher ratio alone does not show whether borrowers can meet their payments.');
  if(creditDirection)policy.push('Compare productive investment and housing access with debt-service costs, borrower defaults and lender losses. A permanently low or high debt ratio is not imposed; the financing preferences remain assumptions.');
  const entries = total('entries'), exits = total('exits');
  if (entries || exits) {
    const turnover = entries > exits ? 'New businesses outnumber closures over the run.'
      : entries < exits ? 'Business closures outnumber new startups over the run.'
      : 'Startups and closures roughly balance over the run.';
    const capability = technology > 0 ? 'The firms still operating use better technology than those in the reference economy.'
      : technology < 0 ? 'The firms still operating trail the reference economy in technology.' : '';
    findings.push([turnover, capability].filter(Boolean).join(' '));
  } else if (technology) {
    findings.push(technology > 0 ? 'Firms improve their technology relative to the reference.' : 'Firms fall behind the reference economy in technology.');
  }

  const years = Array.from({length: last}, (_, i) => i + 1);
  const strongest = read => years.reduce((peak, year) => Math.abs(read(year)) > Math.abs(read(peak)) ? year : peak, 1);
  const active = key => scenario.some(run => run.rows.slice(1).some(row => row[key]));
  if (active('financialMarketActive')) {
    const funded = [
      ['startups through venture capital', 'ventureFunding'],
      ['existing firms through new shares', 'businessEquityIssued'],
      ['firms through corporate bonds', 'corporateBondsIssued'],
      ['the government through bonds', 'marketGovernmentFunding'],
      ['foreign issuers', 'foreignAssetPurchases'],
    ].filter(([,key])=>total(key)>.01).map(([label])=>label);
    if (funded.length) {
      const list = new Intl.ListFormat('en',{style:'long',type:'conjunction'}).format(funded);
      findings.push('Households used some of their deposits to fund '+list+'.');
      if (total('corporateBondWriteoffs')>.01) {
        const recovery = total('corporateBondRecoveries')>.01 ? ' Some bondholders later recovered cash from asset sales.' : '';
        findings.push('Some corporate bonds were written down when firms closed or could not pay.'+recovery);
      }
    } else {
      findings.push('Households made few or no purchases of new shares and bonds. Deposits stayed available for spending.');
    }
    const entryGap = median(scenario.map((run,i)=>throughRun(run,'entries')-throughRun(reference[i],'entries')));
    if (entryGap<0) policy.push('Compare different allocations to venture capital and check whether more startups can raise enough cash while households keep a spending buffer.');
    else if (funded.length) policy.push('Compare what happens when households put more into deposits, shares or bonds. Check both the funding businesses receive and the losses savers bear.');
  }
  if (active('tradeActive')) {
    const tradedYear = [...years].reverse().find(year => scenario.some(run => run.rows[year].tradeActive));
    const exports = total('exports'), imports = total('imports');
    const settlement = direction(median(scenario.map(run=>throughRun(run,'nominalExports')-throughRun(run,'nominalImports'))), .1);
    const exportResult = exports > .01
      ? 'Foreign customers won some orders by offering prices that competed with local bids.'
      : 'Firms made few or no export sales, so foreign orders added little to their revenues.';
    const importResult = imports > .01
      ? 'Imported goods gave households another choice and took some spending away from local firms.'
      : '';
    const balance = settlement < 0 ? 'The economy paid more for imports than it earned from exports over the run.'
      : settlement > 0 ? 'Export earnings exceeded what the economy spent on imports over the run.' : '';
    findings.push([exportResult, importResult, balance].filter(Boolean).join(' '));

    const realMove = direction(level('realExchangeRate', tradedYear) - 100, .25);
    const nominalMove = direction(level('currencyStrength', tradedYear) - 100, .25);
    if (realMove) {
      const prices = realMove > 0 ? 'dearer' : 'cheaper';
      const buyers = realMove > 0 ? 'favored imports and made it harder to attract foreign buyers' : 'favored domestic goods and helped attract foreign buyers';
      const opening = 'By the last year with trade, domestic goods were relatively ' + prices + ' than at the start.';
      const currency = nominalMove === 0 ? ' The nominal exchange rate stayed close to its opening level.'
        : nominalMove !== realMove ? ' Relative prices reversed the change suggested by the nominal exchange rate.' : '';
      findings.push(opening + ' The change ' + buyers + '.' + currency);
    }
    if (settlement < 0) policy.push('Track whether firms can expand export sales over time. Compare the trade deficit and jobs alongside the cost of imported goods for households.');
    else if (exports > .01) policy.push('Compare stronger foreign demand with changes in local demand. Check jobs and household purchases alongside export sales.');
  }
  if (active('importTariffRevenue')) {
    findings.push('An import tariff raised the price households paid for foreign goods. Foreign suppliers received the border value. '+(result.params.tariffExternalShare>0?'EU institutions received the customs duty, with compensation retained by the national collector.':'The domestic government received the customs duty.'));
    policy.push('Compare the support to local sellers and public revenue with the higher cost to households. Check import quantities and real production separately from tax receipts.');
  }
  if (active('foreignAssetIncome')) {
    const valuation = direction(total('foreignAssetValuation'), .05);
    const repriced = valuation>0 ? ' Currency changes raised the domestic value of the portfolio.'
      : valuation<0 ? ' Currency changes reduced the domestic value of the portfolio.' : '';
    findings.push('Households earned income on foreign assets. That income added to the current account.'+repriced);
    if (active('foreignAssetSurplusPurchases'))
      findings.push('In surplus years, some unfilled domestic investment orders went into foreign assets.');
  }
  if (total('bankForeignIncome') < -.05) {
    findings.push('Foreign borrowing also carried an interest cost for the financial sector. Income on household foreign investments therefore did not become a free gain for the economy as a whole.');
    policy.push('Assess the cost of foreign funding alongside returns on foreign assets. A larger overseas portfolio can increase both income and financing risks.');
  }
  if (Math.abs(total('otherForeignIncome')) > .05) {
    findings.push(total('otherForeignIncome') < 0
      ? 'Payments of income and transfers abroad reduced the current account alongside the balance of goods trade.'
      : 'Income and transfers received from abroad supported the current account alongside the balance of goods trade.');
  }
  const fiscalYear = years.find(year => Math.abs(difference(year,row=>row.plannedPublicDemand))>.1);
  if (fiscalYear) {
    const plan = direction(difference(fiscalYear,row=>row.plannedPublicDemand),.1);
    const investment = direction(difference(Math.min(last,fiscalYear+2),row=>row.investment),.1);
    const purchases = plan<0 ? 'fewer' : 'more';
    const response = investment<0 ? ' Private investment was also lower as the scenario progressed.'
      : investment>0 ? ' Private investment was higher as the scenario progressed.' : ' Private investment was close to the reference after the change.';
    findings.push(`The government began planning ${purchases} purchases than in the reference in year ${fiscalYear}.${response}`);
    if(plan<0&&investment<0)policy.push('Compare an immediate cut with a gradual one. Watch whether firms have enough customers to maintain investment and jobs.');
  }
  if(active('defenseResearchPlanChange')){const change=total('defenseResearchPlanChange');findings.push(change>0?'The scenario added funding for defence research to the existing public research budget. Business research could request more paid researcher time; available workers, finance and innovation success still limited what happened.':'The scenario reduced funding for defence research within the public research budget. Requested business research and its financing could fall; ordinary defence purchases received no automatic productivity penalty.');const tech=direction(difference(last,row=>row.technology),.001);findings.push(tech>0?'Firm technology finished ahead of the reference in this simulation. This is the combined model response, not a measured defence multiplier.':tech<0?'Firm technology finished behind the reference despite the funding intervention. Budget size alone did not ensure better innovation.':'Technology finished close to the reference: changing research funding did not guarantee a visible productivity gain.');policy.push('Assess research delivery, civilian spillovers and the opportunity cost of funding. Defence imports, security benefits and separate military industries are outside this model.');}
  if(active('publicRestrictedBenefits')){findings.push('Public health programmes paid firms for care on behalf of households. This supported services and household consumption without giving households extra cash to spend or invest.');policy.push('Keep restricted service payments separate from cash benefits and direct government purchases when assessing fiscal support.');}
  if(active('fiscalCurrentCoverageExpense'))findings.push('The wider government budget also contained current transfers and other expenses. Their private-sector allocation is a simplified coverage assumption, so the resulting GDP response is not an estimated fiscal multiplier.');
  if (active('bankCreditCrowdedOut')) findings.push('When bank lending capacity was tight, public bonds left less room for new business credit.');
  if (active('publicBondRedemptions')) {
    const lowerDebt = direction(level('publicDebt', last) - level('publicDebt', 0), .01) < 0;
    findings.push('The treasury used cash above its liquidity buffer to pay back government bonds. Savers received their principal back and the financial sector released some funds previously tied up in public bonds.' + (lowerDebt ? ' Outstanding public debt was lower by the end of the run.' : ' New borrowing in other years still offset these repayments.'));
  }
  if (active('governmentFirmDividends')) findings.push('The government received dividends on its stakes in firms. These receipts helped its budget; paying dividends did not itself add to GDP.');
  if (active('debtRestructurings')) {
    const earlierOnly = !scenario.some(run => run.rows[last].debtRestructurings > 0);
    findings.push('Some firms could not keep up with interest payments and had debts written down while continuing to operate. Creditors bore the loss.' + (earlierOnly ? ' These events occurred earlier in the run, so a zero in the final year does not mean there were no restructurings.' : ' The annual and cumulative event counts show when this happened.'));
    policy.push('Compare support for viable firms with the losses borne by lenders and savers. Check whether restructuring helps firms recover or merely postpones another failure.');
  }
  if (active('priceDynamicsActive')) {
    const pressureYear = strongest(year => level('monetaryPriceContribution', year));
    const pressure = direction(level('monetaryPriceContribution', pressureYear), .05);
    if (pressure) findings.push(pressure > 0
      ? `The money available to spend and how quickly it was spent pushed prices up relative to the goods available. That pressure was strongest in year ${pressureYear}.`
      : `Spending power was low relative to what firms had produced. That pushed prices down most in year ${pressureYear}.`);
  }
  const activeCurrencyPrice = active('currencyPriceContribution');
  const fxYear = strongest(year => activeCurrencyPrice ? level('currencyPriceContribution', year) : level('currencyAppreciation', year));
  const currencyMove = level('currencyPriceContribution', fxYear);
  const currencyAccess = direction(difference(fxYear, row => row.effectiveForeignContact - row.baseForeignContact), .002);
  const fxWithinScenario = direction(level('effectiveForeignContact', fxYear) - level('baseForeignContact', fxYear), .002);
  if (Math.abs(currencyMove) > .01) {
    const priceEffect = currencyMove > 0 ? 'The currency lost value and put upward pressure on prices' : 'The currency gained value and eased price pressure';
    const access = fxWithinScenario < 0 ? ' The currency was weaker than at opening, which made it harder for firms to reach foreign technology.'
      : fxWithinScenario > 0 ? ' The currency was stronger than at opening, which made foreign technology easier to reach.' : '';
    findings.push(`${priceEffect}. The strongest price effect came in year ${fxYear}.${access}`);
    if (currencyMove > 0 && currencyAccess < 0) {
      policy.push('When a weaker currency raises prices and closes off technology opportunities, test targeted support for firms that need to adopt foreign technology. Track the effects on both prices and access.');
    }
  } else if (fxWithinScenario) {
    findings.push(fxWithinScenario < 0 ? 'The weaker currency makes foreign technology harder for firms to reach.'
      : 'The stronger currency makes foreign technology easier for firms to reach.');
  }

  if (active('policyDynamicsActive')) {
    const movement = year => direction(level('policyRate', year) - level('policyRate', year - 1), .05);
    const firstMove = years.find(movement);
    if (firstMove) {
      const change = movement(firstMove);
      const rate = change > 0 ? 'raised' : 'cut';
      const inflationGap = direction(level('policyInflationSignal', firstMove) - level('policyInflationTargetUsed', firstMove), .05);
      const signal = inflationGap === change ? ` with the previous year’s inflation ${change > 0 ? 'above' : 'below'} target` : '';
      const reversal = years.find(year => year > firstMove && movement(year) === -change);
      const later = reversal ? ` It ${change > 0 ? 'lowered' : 'raised'} rates again in year ${reversal}.` : '';
      const loan = direction(level('investmentRateMultiplier', firstMove) - level('investmentRateMultiplier', firstMove - 1), .002);
      const investment = loan < 0 ? ' The initial rise in borrowing costs held back firms’ investment plans.'
        : loan > 0 ? ' The initial drop in borrowing costs supported firms’ investment plans.' : '';
      const publicRate = direction(level('newPublicRate',firstMove)-level('newPublicRate',firstMove-1),.05);
      const publicCost = publicRate>0 ? ' New public borrowing also became more expensive.'
        : publicRate<0 ? ' New public borrowing also became cheaper.' : '';
      findings.push(`The central bank first ${rate} its policy rate in year ${firstMove}${signal}.${later}${investment}${publicCost}`);
      if (loan < 0) policy.push('Compare a gradual rate increase with a faster one. Watch whether the extra relief on prices is worth the pressure on business investment.');
    }
  }

  if (active('priceDynamicsActive') || active('inflation')) {
    const endingInflation = direction(level('inflation', last), .05);
    const inflation = endingInflation > 0 ? 'Consumer prices are still rising at the end.'
      : endingInflation < 0 ? 'Consumer prices are falling at the end.' : 'Consumer prices are broadly steady in the final year.';
    const priceLevel = direction(level('consumerPriceIndex', last) - level('consumerPriceIndex', 0), .5);
    findings.push(`${inflation}${priceLevel > 0 ? ' They remain above their opening level.' : priceLevel < 0 ? ' They end below their opening level.' : ''}`);
  }

  if(active('financeBlockedEntries')){findings.push('Some prospective firms could not raise their full startup equity. Smaller, less capital-intensive businesses can enter, but the available funding still limits renewal.');policy.push('Distinguish a shortage of viable business ideas from a shortage of suitable startup finance. Venture capital alone does not represent every new business.');}
  if(active('capitalBlockedEntries'))findings.push('Some funded business opportunities were blocked by the available supply of productive assets.');
  const sources = foreignProviders(result.params).map(source => ({
    name: source.name, events: scenario.reduce((count, run) => count + throughRun(run, 'foreign' + source.code), 0),
  })).sort((a, b) => b.events - a.events);
  if (sources[0].events) {
    const leaders = sources.filter(source => source.events === sources[0].events).map(source => source.name);
    const tail = active('foreignTailAdopters');
    findings.push(`${leaders.join(' and ')} supplied the most useful foreign matches across the runs.${tail
      ? ' Some firms learned from individual contacts even when the source benchmark was below their own technology.'
      : active('foreignFromLowerMean') ? ' Firms also learned from sources whose national average was below the domestic technology level.' : ''}`);
    if (tail) policy.push('Look for good technology partners firm by firm. A country with lower average productivity can still contain firms with practices worth adopting.');
  } else if (active('baseForeignContact')) {
    findings.push('Firms found no usable foreign technology to adopt during the simulated years.');
  }

  if(result.params.ageCohorts){
    const ageing=direction(level('workingAgeShare',last)-level('workingAgeShare',0),.1);
    if(ageing)findings.push(ageing<0?'The share of people aged 15–64 falls as the observed age cohorts get older. Births add children first, so they cannot immediately replace retiring workers.':'The share of people aged 15–64 rises as cohorts age into working years and migration changes the population.');
    const pensionChange=direction(difference(last,r=>r.pensionEligibleShare),.05);
    if(pensionChange)findings.push(pensionChange<0?'The scenario leaves fewer people above the pension eligibility threshold than the reference. This reduces the model’s benefit commitments and can keep more people in the labour force.':'More people meet the pension age threshold than in the reference, raising benefit commitments and potentially reducing labour supply.');
    if(pensionChange)policy.push('Assess pension-age changes alongside healthy working life, job opportunities and the distribution of gains and losses. The labour response is a scenario assumption, not a measured reform effect.');
  }
  const retirement=retirementComparison(result,last);
  if(retirement){
    const lf=direction(median(retirement.pairs.map(x=>x.labourForce)),.05),gdp=direction(median(retirement.pairs.map(x=>x.realGDPPercent)),.1);
    if(!retirement.isolated)findings.push('Retirement age changes alongside other assumptions or events. The difference from the reference combines their effects and cannot be credited to retirement policy alone.');
    else if(lf<0&&gdp>0)findings.push('The retirement change leaves a smaller labour force, yet real GDP ends higher in this model experiment. Household spending, investment and firm responses can outweigh the labour constraint when capacity is unused. Pension transfers themselves are not production. This result does not establish that earlier retirement raises GDP in the real economy.');
    else if(lf<0&&gdp<0)findings.push('The retirement change leaves a smaller labour force and lower real GDP than the reference. Changes in spending and investment also shape the outcome; the GDP difference is not simply the pension bill.');
    else if(lf>0)findings.push('The retirement change leaves more people available for work. Its effect on actual production also depends on jobs, demand, investment and financing; extra labour supply does not guarantee an equal increase in output.');
    policy.unshift('Judge retirement changes using retirement income, healthy working lives and public financing as well as GDP. Repeat the experiment with weaker and stronger participation responses; the model does not estimate a country-specific retirement reform effect.');
  }
  if(total('foreignGovBondPurchases')>1e-6){findings.push('Overseas investors finance part of new government borrowing. This can ease domestic financing pressure, while coupons paid abroad reduce national income. Selling bonds itself does not improve the current account.');}
  const debt = direction(difference(last, row => row.publicDebt / Math.max(1, row.nominalOutput)), .02);
  if (debt) findings.push(debt > 0 ? 'The government ends with a heavier debt burden relative to the size of the economy.'
    : 'Public debt ends lower relative to the size of the economy.');
  if (jobs < 0) policy.push('Test whether better job matching helps workers move into new roles. Check employment alongside output and productivity.');
  if (!policy.length && debt > 0) policy.push('Compare the gains from the scenario with the cost of servicing the extra public debt. Check whether the gains persist when public borrowing becomes more expensive.');
  if (!policy.length && technology > 0 && production <= 0) policy.push('Track whether better technology turns into higher production. Changes that help firms find customers or finance investment could make a difference.');
  if (!policy.length) policy.push('Change one policy setting at a time and compare the response of jobs, prices and production across seeds. This helps identify which outcomes depend on the intervention.');
  return {heading, summary, findings, policy: policy.slice(0, 3)};
}
