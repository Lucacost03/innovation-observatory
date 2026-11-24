import {FISCAL_REFERENCES} from './fiscal-reference-data.mjs';
import {GLOBAL_FISCAL_REFERENCES} from './global-fiscal-reference-data.mjs';
import {sectorAllocationHTML} from './sector-allocation-view.mjs';
import {SOCIAL_SPENDING_BENCHMARKS} from './social-spending-data.mjs';
import {publicBudgetHTML} from './public-budget-view.mjs';
import {effectiveParameters} from './engine.mjs';
import {foreignProviders,foreignContext,FOREIGN_PROJECTIONS} from './foreign.mjs';

const sectors = {
  households: {name: 'Households', stock: 'Deposits', key: 'householdDeposits', x: 20, y: 26},
  firms: {name: 'Firms', stock: 'Bank loans', key: 'loans', x: 364, y: 26},
  government: {name: 'Government', stock: 'Public debt', key: 'publicDebt', x: 20, y: 178},
  banks: {name: 'Financial sector', stock: 'Bank equity', key: 'bankEquity', x: 364, y: 178},
};

// An optional third field describes how the settled transfer enters revenue
// and expenses. Null marks financing, principal or a liquidation transfer.
const links = [
  {id: 'households-firms', title: 'Households and firms', directions: [
    {from: 'households', to: 'firms', path: 'M202 50 H354', items: [
      ['Cash household purchases before VAT', 'nominalConsumptionGoods'],
      ['New dwelling construction', 'nominalHousingConstruction'],
      ['Venture capital via financial markets', 'ventureFunding', null],
      ['Other startup equity', row => row.startupFunding - row.ventureFunding, null],
      ['New shares in existing firms', 'businessEquityIssued', null],
      ['New corporate bonds', 'corporateBondsIssued', null],
    ]},
    {from: 'firms', to: 'households', path: 'M354 71 H202', items: [
      ['Wages after withholding', row => row.wages - row.wageWithholding, {label:'Gross wages', key:'wages'}],
      ['Firm dividends', 'firmDividends'],
      ['Corporate bond interest', 'corporateBondInterest'],
      ['Corporate bond principal repaid', 'corporateBondRepayments', null],
      ['Corporate bond recoveries after write-off', 'corporateBondRecoveries', null],
      ['Liquidation proceeds to owners', 'liquidationDistributions', null],
    ]},
  ]},
  {id: 'firms-banks', title: 'Firms and financial sector', directions: [
    {from: 'banks', to: 'firms', path: 'M438 169 V99', items: [
      ['New business loans', 'businessCreditIssued', null],
      ['Interest on business deposits', 'firmDepositInterest'],
    ]},
    {from: 'firms', to: 'banks', path: 'M463 99 V169', items: [
      ['Interest paid to banks', 'loanInterest'],
      ['Dividends to funded pension accounts', 'pensionDividends'],
      ['Liquidation returns to pension funds', 'pensionLiquidationProceeds', null],
      ['Business loan repayments', 'businessLoanRepayments', null],
      ['Principal paid at exit or restructuring', 'exitLoanRepayments', null],
      ['Liquidation recoveries after write-off', 'loanRecoveries', null],
    ]},
  ], note: ['Non-cash loan write-offs this year', 'loanWriteoffs']},
  {id: 'government-households', title: 'Government and households', directions: [
    {from: 'government', to: 'households', path: 'M94 169 V99', items: [
      ['Other cash social support','otherSocialCashAllocated'],
      ['Public old-age cash benefits','publicOldAgeCashAllocated'],
      ['Survivor cash benefits','publicSurvivorCashAllocated'],
      ['Sickness/disability cash benefits','publicSicknessCashAllocated'],
      ['Unemployment benefits', 'unemploymentBenefits'],
      ['Non-business research transfers', 'publicResearchNonBusiness'],
      ['Noncash public pension interest accrued','fiscalNoncashPensionInterest'],
      ['Interest on household-held public debt', 'governmentInterestToHouseholds'],
      ['Public bond principal repaid to households', 'publicBondRedemptionsToHouseholds', null],
    ]},
    {from: 'households', to: 'government', path: 'M119 99 V169', items: [
      ['VAT on household purchases', 'nominalConsumptionTax'],
      ['Gross import duties collected', 'importTariffRevenue'],
      ['Tax on financial income', 'financialIncomeTaxPaid'],
      ['Wealth tax', 'wealthTaxPaid'],
      ['Other current receipts · household-charge proxy','fiscalOtherCurrentRevenue'],
      ['New public bonds bought by households', 'householdBondPurchases', null],
    ]},
  ]},
  {id: 'government-firms', title: 'Government and firms', directions: [
    {from: 'government', to: 'firms', path: 'M200 192 L358 91', items: [
      ['Healthcare services','publicHealthcarePurchases'],
      ['Public education services','publicEducationServicePurchases'],
      ['Defence services within public consumption','publicDefensePurchases'],
      ['Other public goods/services','otherPublicPurchases'],
      ['Restricted healthcare purchases on behalf of households','publicRestrictedBenefits'],
      ['Additional current fiscal coverage · signed proxy','fiscalCurrentCoverageExpense'],
      ['Capital financing against existing national investment','fiscalCapitalExpenditure',null],
      ['Public business research grants', 'publicRDGrants'],
    ]},
    {from: 'firms', to: 'government', path: 'M357 106 L202 207', items: [
      ['Worker income tax withheld by firms', 'wageWithholding', {label:'Worker income tax', from:'households'}],
      ['Business income tax paid', 'profitTaxPaid'],
      ['Other production taxes · coverage proxy','fiscalOtherProductionTaxes'],
      ['Capital fiscal receipts','fiscalCapitalRevenue',null],
      ['Dividends on government equity', 'governmentFirmDividends'],
      ['Liquidation proceeds on government equity', 'governmentLiquidationProceeds', null],
    ]},
  ]},
  {id: 'government-banks', title: 'Government and financial sector', directions: [
    {from: 'government', to: 'banks', path: 'M202 201 H354', items: [
      ['Interest on bank-held public debt', 'governmentInterestToBank'],
      ['Interest on central-bank-held public debt','governmentInterestToCentralBank'],
      ['Bank recapitalization', 'recap', null],
      ['Public bond principal repaid to banks', 'publicBondRedemptionsToBank', null],
      ['Public bond principal repaid to central bank','publicBondRedemptionsToCentralBank',null],
    ]},
    {from: 'banks', to: 'government', path: 'M354 222 H202', items: [
      ['New public bonds bought by banks', 'bankBondPurchases', null],
      ['Central-bank net profit remitted to Treasury','centralBankRemittance'],
    ]},
  ]},
  {id: 'households-banks', title: 'Households and financial sector', directions: [
    {from: 'banks', to: 'households', path: 'M358 189 L202 92', items: [
      ['Bank dividends', 'bankDividends'],
      ['Interest on household deposits before tax', 'householdDepositInterest'],
      ['Interest on term funding claims', 'bankFundingInterest'],
      ['New mortgage loans', 'mortgageOriginations', null],
      ['Central-bank bond purchases from households','assetPurchasesFromHouseholds',null],
      ['Funded pension withdrawals', 'pensionWithdrawals', null],
    ]},
    {from:'households',to:'banks',path:'M202 111 L358 211',items:[
      ['Mortgage interest','mortgageInterest'],['Rent on financial-sector housing','bankRentalIncome'],['Mortgage principal repaid','mortgageRepayments',null],
      ['Funded pension contributions','pensionContributions',null],['Firm stakes purchased from pension fund','pensionEquitySales',null],['Repossessed dwellings purchased','bankHousingSales',null]
    ]},
  ], stock: ['Household deposits held at the bank', 'householdDeposits']},
];

const balanceSheets = {
  households: {
    assets: [
      ['Bank deposits', 'householdDeposits'],
      ['Government bonds', 'householdPublicDebt'],
      ['Corporate bonds', 'householdCorporateBonds'],
      ['Venture equity', 'householdVentureEquity'],
      ['Shares in existing firms', 'householdBusinessEquity'],
      ['Foreign investments', 'householdForeignAssets'],
      ['Funded pension claims', 'pensionAssets'],
      ['Noncash public pension claim accrued since opening','fiscalGovernmentPensionLiability'],
      ['Dwelling structures at current model value', 'householdHousingValue'],
      ['Term funding claims on financial sector', 'financialTermFunding'],
    ],
    liabilities: [['Mortgage debt','householdMortgageDebt']],
    note: 'Dwelling values exclude land. Funded pensions include current investment gains/losses. Original unpriced household firm and bank ownership is omitted; this is a partial net-wealth measure.',
  },
  firms: {
    assets: [
      ['Bank deposits', 'firmDeposits'],
      ['Productive capital', row => row.capital * row.producerPrice],
      ['Capital in liquidation', row => row.dormantCapital * row.producerPrice],
      ['Inventories', row => row.inventory * row.goodsValuationPrice],
    ],
    liabilities: [
      ['Bank loans', 'loans'],
      ['Corporate bonds', 'householdCorporateBonds'],
    ],
    equity: [
      ['Venture equity', 'householdVentureEquity'],
      ['Other issued equity', 'householdBusinessEquity'],
      ['Government ownership · residual book claim', row=>row.governmentPublicEquity+row.governmentEquityInLiquidation],
      ['Pension fund ownership · residual book claim','pensionFirmEquity'],
    ],
    note: 'Capital and inventories use current model prices. Issued equity is shown at the amount paid in.',
  },
  government: {
    assets: [['Treasury cash', 'governmentDeposits'],['Equity in active firms · book value','governmentPublicEquity'],['Equity claims in liquidation · book value','governmentEquityInLiquidation']],
    liabilities: [
      ['Public debt held by households', 'householdPublicDebt'],
      ['Public debt held by banks', 'bankPublicDebt'],
      ['Public debt held by central bank','centralBankBonds'],
      ['Government bonds held abroad','foreignHeldGovernmentBonds'],
      ['Other identified external public debt','foreignHeldGovernmentOtherDebt'],
      ['External public debt · instrument unallocated','foreignHeldGovernmentUnallocatedDebt'],
      ['Noncash public pension liability accrued since opening','fiscalGovernmentPensionLiability'],
    ],
    note: 'Opening cash and equity use the preset’s documented financial-asset sources and labelled proxies. The wider observed equity portfolio is mapped to stakes in modeled firms at residual book value. Treasury liquidity has a source-matched target; excess cash repays bonds. Principal repayments are financing flows, not expenses.',
  },
  banks: {
    assets: [
      ['Opening reserve backing · model residual','centralBankOpeningBacking'],
      ['Central-bank government bonds','centralBankBonds'],
      ['Business loans', 'loans'],
      ['Household mortgages', 'householdMortgageDebt'],
      ['Repossessed dwelling structures','bankHousingValue'],
      ['Pension fund firm stakes','pensionFirmEquity'],
      ['Government bonds', 'bankPublicDebt'],
      ['Foreign settlement assets', 'bankForeignAssets'],
    ],
    liabilities: [
      ['Household deposits', 'householdDeposits'],
      ['Business deposits', 'firmDeposits'],
      ['Treasury deposits', 'governmentDeposits'],
      ['Foreign settlement liabilities', 'bankForeignLiabilities'],
      ['Household funded pension claims','pensionAssets'],
      ['Term funding owed to households','financialTermFunding'],
    ],
    equity: [['Bank equity', 'bankEquity'],['Central-bank retained income / losses','centralBankEquity']],
    note: 'This consolidates the commercial bank, monetary authority and funded pension accounts. Reserves and fund cash cancel internally. The opening reserve backing is an unobserved model residual, not a new empirical asset. Central-bank losses are retained; only profits after loss recovery are remitted to government. Pension claims have matching fund assets. Opening term funding is a residual proxy, with policy-linked interest. Other market securities remain investor/issuer claims.',
  },
};

const units = new Intl.NumberFormat('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const index = new Intl.NumberFormat('en-GB', {minimumFractionDigits: 3, maximumFractionDigits: 3});
const positiveMoney=value=>value>0&&value<.005?value.toExponential(2):money(value);
const money = value => units.format(Math.abs(value) < 1e-9 ? 0 : value);
const gain = value => value === 0 ? '0' : value.toPrecision(3);
const byId = id => document.getElementById(id);
const title = key => sectors[key].name;
const amount = (row,key) => typeof key === 'function' ? key(row) : row[key];
const sumAmounts = items => items.reduce((sum,item)=>sum+item.value,0);

export function sectorYear(result, side, year) {
  const run = result.first[side];
  const row = run.rows[year];
  const paths = side === 'scenario' ? result.paths : [];
  const settings = effectiveParameters(run.params, year, paths);
  const donorYear = run.params.burnIn + year;
  const availableYear = Math.max(0, donorYear - 1 - settings.adoptionLag);
  const recorded = !row.initialObservation;
  const relations = links.map(link => ({
    ...link,
    directions: link.directions.map(direction => {
      const items = direction.items.map(([label, key, summary = {}]) => {
        const value = recorded ? amount(row,key) : null;
        const current = summary && {
          label:summary.label ?? label,
          from:summary.from ?? direction.from,
          to:direction.to,
          value:summary.key && recorded ? amount(row,summary.key) : value,
        };
        return {label,value,current};
      });
      return {...direction, items, total: items.reduce((n, item) => n + (item.value ?? 0), 0)};
    }),
  }));
  const donors = foreignProviders(settings).map(source => ({
    name: source.name,
    anchor: settings[source.relative],
    growth: recorded ? row['foreignTFPGrowth'+source.code] : null,
    closing: run.foreignHistory[donorYear][source.code],
    available: recorded ? run.foreignHistory[availableYear][source.code] : null,
    contacts: row['foreignContacts' + source.code],
    adoptions: row['foreign' + source.code],
    gain: row['foreignGain' + source.code],
  }));
  return {row,relations,donors,recorded,settings,seed:run.seed,countryCode:result.context?.countryCode,fiscalBenchmark:FISCAL_REFERENCES[result.context?.countryCode]??SOCIAL_SPENDING_BENCHMARKS.countries[result.context?.countryCode]??GLOBAL_FISCAL_REFERENCES[result.context?.countryCode]??null};
}

export function sectorOverview(view, sector) {
  const {row,recorded,relations}=view;
  const sheet=balanceSheets[sector];
  const stocks=entries=>entries.map(([label,key])=>({label,value:row.initialObservation&&row.foreignGovOpeningKnown===0&&typeof key==='string'&&key.startsWith('foreignHeldGovernment')?null:amount(row,key)}));
  const flows=relations.flatMap(link=>link.directions.flatMap(direction=>
    direction.items.map(item=>item.current).filter(Boolean)));
  const peers=Object.keys(sectors).filter(key=>key!==sector).map(key=>{
    const revenue=flows.filter(item=>item.from===key&&item.to===sector);
    const expenses=flows.filter(item=>item.from===sector&&item.to===key);
    return {name:title(key),revenue,expenses,
      revenueTotal:recorded?sumAmounts(revenue):null,expenseTotal:recorded?sumAmounts(expenses):null};
  });
  const revenue=peers.flatMap(peer=>peer.revenue),expenses=peers.flatMap(peer=>peer.expenses);
 const externalExpense=sector==='government'&&recorded?(row.governmentInterestToForeign??0):0;
 if(externalExpense)expenses.push({label:'Interest to foreign public creditors',value:externalExpense});
  if(sector==='government'&&recorded){const value=(row.fiscalNoncashMatchedMemo??0)+(row.fiscalSalesNettingAdjustment??0);revenue.push({label:'Noncash own-account / presentation adjustments',value});expenses.push({label:'Noncash own-account / presentation adjustments',value});}
  return {assets:stocks(sheet.assets),liabilities:stocks(sheet.liabilities),equity:stocks(sheet.equity??[]),
    note:sheet.note+(sector==='government'&&row.foreignGovOpeningKnown===0?' Extra-EU opening holder coverage is unavailable. Simulated external claims start from an explicitly incomplete zero execution stock; the resident allocation is a model assumption, not a source observation.':''),peers,revenue,expenses,externalExpense,presentationAdjustment:sector==='government'&&recorded?(row.fiscalNoncashMatchedMemo??0)+(row.fiscalSalesNettingAdjustment??0):0,revenueTotal:recorded?sumAmounts(revenue):null,
    expenseTotal:recorded?sumAmounts(expenses):null};
}

function drawMap(view, selected, selectedSector) {
  const largest = Math.max(1, ...view.relations.flatMap(link => link.directions.map(d => d.total)));
  const arrows = view.relations.flatMap(link => link.directions.map(d => {
    const active = d.total > 1e-9;
    const width = active ? 1.2 + 4 * Math.sqrt(d.total / largest) : 1.2;
    return `<g class="sector-arrow ${link.id === selected ? 'selected' : ''}" data-sector-link="${link.id}">
      <title>${title(d.from)} → ${title(d.to)} · ${view.recorded ? money(d.total) + ' units' : 'opening snapshot'}</title>
      <path class="sector-arrow-hit" d="${d.path}"/>
      <path class="sector-arrow-line" d="${d.path}" stroke-width="${width}" ${active ? 'marker-end="url(#sector-arrowhead)"' : 'stroke-dasharray="4 5"'}/>
    </g>`;
  })).join('');
  const nodes = Object.entries(sectors).map(([key,node]) => `
    <g class="sector-node" data-sector="${key}" role="button" tabindex="0" focusable="true"
      aria-label="${node.name}" aria-pressed="${key===selectedSector}" transform="translate(${node.x},${node.y})">
      <rect width="174" height="64" rx="10"/>
      <text x="12" y="25" class="sector-node-name">${node.name}</text>
      <text x="12" y="47" class="sector-node-stock">${node.stock} ${money(view.row[node.key])}</text>
    </g>`).join('');
  byId('sector-map').innerHTML = `<svg viewBox="0 0 560 260" role="group" aria-label="Domestic sector map. Select a sector to view its accounts.">
    <defs><marker id="sector-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10 Z" fill="#568173"/></marker></defs>
    <g fill="none">${arrows}</g><g class="sector-nodes">${nodes}</g>
  </svg>`;
}

function showDetails(view, selected) {
  const link = view.relations.find(entry => entry.id === selected);
  const groups = link.directions.map(direction => `<tbody>
    <tr class="sector-direction"><th colspan="2" scope="rowgroup">${title(direction.from)} → ${title(direction.to)}</th></tr>
    ${direction.items.map(item => `<tr><td>${item.label}</td><td>${item.value === null ? '—' : money(item.value)}</td></tr>`).join('')}
  </tbody>`).join('');
  const memo = link.note && view.recorded ? link.note : link.stock;
  byId('sector-flow-detail').innerHTML = `
    <table><caption class="sector-sr-only">${link.title} · transfers at current prices</caption>
      <thead><tr><th scope="col">Transfer</th><th scope="col">Model units</th></tr></thead>
      ${groups}
    </table>
    ${memo ? `<p class="small muted sector-flow-note">${memo[0]} · <strong>${money(view.row[memo[1]])} units</strong></p>` : ''}`;
}

function showOverview(view,sector) {
  const overview=sectorOverview(view,sector);
  const shown=value=>value===null?'—':money(value);
  const lines=items=>items.map(item=>`<tr><th scope="row">${item.label}</th><td>${shown(item.value)}</td></tr>`).join('');
  const stockGroup=(label,items,totalLabel)=>`<tbody>
    <tr class="sector-direction"><th colspan="2" scope="rowgroup">${label}</th></tr>
    ${items.length ? lines(items) : '<tr><td colspan="2">No household debt recorded</td></tr>'}
    ${items.length&&totalLabel ? `<tr class="sector-account-total"><th scope="row">${totalLabel}</th><td>${items.some(x=>x.value===null)?'Incomplete':money(sumAmounts(items))}</td></tr>` : ''}
  </tbody>`;
  const name=byId('sector-overview-name');
  if(name.textContent!==title(sector))name.textContent=title(sector);
  byId('sector-overview-balance').innerHTML=`<table>
    <caption>Assets and liabilities</caption>
    ${stockGroup('Assets',overview.assets,'Total assets shown')}
    ${stockGroup('Liabilities',overview.liabilities,'Total liabilities shown')}
    ${overview.equity.length ? stockGroup('Equity',overview.equity) : ''}
  </table><p class="small muted">${overview.note}</p>`;

  const flowItems=items=>items.filter(item=>Math.abs(item.value)>1e-9).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
  const breakdown=(label,items)=>`<tbody><tr class="sector-direction"><th colspan="2" scope="rowgroup">${label}</th></tr>
    ${lines(flowItems(items)) || '<tr><td colspan="2">No transfers this year</td></tr>'}</tbody>`;
  const flowTable=byId('sector-overview-flows');
  const expanded=flowTable.querySelector('details')?.open??true;
  flowTable.innerHTML=`<table>
    <caption>Revenue and expenses</caption>
    <thead><tr><th scope="col">Other sector</th><th scope="col">Revenue and income</th><th scope="col">Expenses and transfers</th></tr></thead>
    <tbody>${overview.peers.map(peer=>`<tr><th scope="row">${peer.name}</th><td>${shown(peer.revenueTotal)}</td><td>${shown(peer.expenseTotal)}</td></tr>`).join('')}${overview.externalExpense?`<tr><th scope="row">Foreign public creditors</th><td>${shown(0)}</td><td>${shown(overview.externalExpense)}</td></tr>`:''}${overview.presentationAdjustment?`<tr><th scope="row">Noncash / presentation adjustments</th><td>${shown(overview.presentationAdjustment)}</td><td>${shown(overview.presentationAdjustment)}</td></tr>`:''}</tbody>
    <tfoot class="sector-account-total"><tr><th scope="row">${overview.presentationAdjustment||overview.externalExpense?'Total including external and presentation items':'Total across the three sectors'}</th><td>${shown(overview.revenueTotal)}</td><td>${shown(overview.expenseTotal)}</td></tr></tfoot>
  </table>
  ${sector==='government'?publicBudgetHTML(view):''}${sectorAllocationHTML(view.countryCode,sector,view.settings)}
  ${view.recorded ? `<details ${expanded?'open':''}><summary>Revenue and expense items</summary>
    <table><caption class="sector-sr-only">Breakdown of domestic revenue and expenses</caption>
    ${breakdown('Revenue and income',overview.revenue)}${breakdown('Expenses and transfers',overview.expenses)}</table></details>`
    : '<p class="small muted">Annual revenues and expenses begin in year 1.</p>'}`;
}

function showForeign(view) {
  const {row, recorded} = view;
  byId('foreign-trade-result').textContent = !recorded
    ? 'Year 0 shows positive trade benchmarks consistent with the normalized opening GDP. Cash settlements start in year 1.'
    : row.tradeActive
      ? (row.continuousForeignBids?'Domestic and overseas buyers offer a continuous range of prices. Higher offers receive scarce goods first. Some repeat customers pay a premium; imports compete for household spending.':'Domestic and foreign buyers compete on the price they offer firms. A small group of foreign customers bids a premium. Imports compete for household spending.')
      : 'The goods trade channel is off for this year. Choose Open to trade to try it.';
  const flow = value => recorded ? money(value) : '—';
  byId('foreign-trade-values').innerHTML = [
    ['Nominal currency strength', money(row.currencyStrength)],
    ['Real currency strength', money(row.realExchangeRate)],
    ['Import price in domestic currency · index', money(100 * row.importPrice)],
    ['Domestic technology versus foreign competitors', index.format(row.tradeCompetitiveness)+'×'],
    ['Domestic bid per good', money(row.producerPrice)],
    ['Average price received on exports', recorded&&row.exports>0 ? money(row.exportPrice) : '—'],
    ['Foreign orders · real units', flow(row.exportOrders)],
    ['Exports sold · real units', positiveMoney(row.exports)],
    ['Imports bought · real units', positiveMoney(row.imports)],
    ['Import tariff', money(row.importTariff)+'%'],
    ['Import price after duty · index', money(100*row.landedImportPrice)],
    ['Gross import duties · nominal units', flow(row.importTariffRevenue)],
    ['Customs tax retained in this economy', flow(row.governmentTariffTax)],
    ['Collection compensation retained', flow(row.tariffCollectionFees)],
    ['Net customs settlement paid externally', flow(row.tariffNetExternalTransfer)],
    ['Current account · nominal units', recorded||row.openingMacroBenchmark?money(row.currentAccount):'—'],
    ['Current account / nominal GDP', money(row.currentAccountGDP)+'%'],
    ['Net foreign position at current exchange rate · nominal units', money(row.netForeignPosition)],
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  byId('foreign-net-values').innerHTML = [
    ['Gross foreign assets at acquisition cost', positiveMoney(row.foreignAssetsAtCost)],
    ['Gross foreign liabilities', positiveMoney(row.foreignLiabilities)],
    ['Net foreign assets at acquisition cost', money(row.netForeignAssets)],
    ['Annual change in net foreign assets', flow(row.netForeignAssetChange)],
    ['Current account this year', recorded||row.openingMacroBenchmark?money(row.currentAccount):'—'],
    ['Cumulative currency valuation', money(row.foreignAssetValuationBalance)],
    ['Net position at current exchange rate', money(row.netForeignPosition)],
  ].map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  byId('foreign-finance-result').textContent = recorded
    ? 'Foreign assets pay income on opening holdings; government coupons abroad reduce the current account. Public bond issues and principal repayments are financial transactions, with matched settlement assets. Currency valuation is separate.'
    : 'Opening holdings are shown here. Purchases, income and currency gains start in year 1.';
  byId('foreign-finance-values').innerHTML = [
    ['Household foreign assets · nominal units', money(row.householdForeignAssets)],
    ['Foreign assets purchased · nominal units', flow(row.foreignAssetPurchases)],
    ['Of which redirected by a current account surplus', flow(row.foreignAssetSurplusPurchases)],
    ['Income from foreign assets · nominal units', flow(row.foreignAssetIncome)],
    ['Financial sector net foreign interest', flow(row.bankForeignIncome)],
    ['Government interest paid abroad · current-account debit', flow(row.governmentInterestToForeign)],
    ['Public bonds bought abroad · financial transaction', flow(row.foreignGovBondPurchases)],
    ['Public principal repaid abroad · financial transaction', flow((row.publicBondRedemptionsToForeign??0)+(row.foreignGovOtherDebtRedemptions??0))],
    ['Government debt held abroad', money(row.foreignHeldGovernmentDebt)],
    ['Other net foreign income and transfers', flow(row.otherForeignIncome)],
    ['Foreign cash yield', money(row.foreignAssetYield)+'%'],
    ['Exchange-rate gain or loss · nominal units', flow(row.foreignAssetValuation)],
    ['Bank’s foreign settlement position · nominal units', money(row.bankNetForeignPosition)],
  ].map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  const p = view.settings;
  byId('foreign-sector-result').textContent = view.recorded
    ? `${view.row.foreignAdopters} firms adopted foreign knowledge this year. ${view.row.foreignTailAdopters} gained from an individual match whose source benchmark was below their own technology.`
    : 'Opening donor levels. Adoption starts when the model takes its first annual step.';
  const poolContext=foreignContext(p),rowPool=poolContext?.providers.ROW;
  const projection=FOREIGN_PROJECTIONS,scenario=projection.scenarios[view.row.foreignProjectionScenario??0],year=view.row.foreignProjectionCalendarYear;
  byId('foreign-projection-context').textContent=view.row.foreignForecastActive
    ? `Calendar year ${year} · ${scenario.code}: ${scenario.label}. Annual growth varies with the published path; this is an external input to this economy.`
    : `Calendar year ${year} · custom fixed-rate mode. The three fixed growth controls and any scheduled growth shocks determine donor productivity.`;
  byId('foreign-projection-values').innerHTML=foreignProviders(view.settings).map(source=>`<dt>${source.name} · 2023 = 100</dt><dd>${money(view.row['foreignTFPIndex'+source.code])}</dd>`).join('');
  byId('foreign-projection-note').textContent=(view.row.foreignForecastActive
    ? `OECD EO117, 2025 scenario vintage updated January 2026. TFP is a proxy derived from labour-efficiency growth with OECD’s 0.67 labour share, linked to PWT starting levels. The rest-of-world path covers ${rowPool?.projectionMembers.length??projection.row.coveredCountries} countries, ${money(100*(rowPool?.projectionOutputCoverage??projection.row.outputCoverage))}% of the opening pool’s output; its evolution proxies uncovered countries. `
    : 'Fixed growth rates extrapolate historical PWT trends and remain assumptions. ')
    +(view.row.foreignProjectionExtrapolated?'The published horizon has ended: growth now repeats the final 2100 rate as an explicit extrapolation. ':'Published paths end in 2100. Later years repeat the final growth rate as an explicit assumption. ')
    +(poolContext?`Home economy excluded from all sources: ${poolContext.name}. Named pools and rest of world do not overlap. `:'')
    +'These conditional projections are not known future outcomes and do not validate domestic forecast accuracy.';
  byId('foreign-sector-donors').innerHTML = view.donors.map(d => `
    <tr><th scope="row">${d.name}</th><td>${index.format(d.anchor)}×</td><td>${d.growth===null?'—':money(d.growth)+'%'}</td>
    <td>${index.format(d.closing)}</td><td>${d.available === null ? '—' : index.format(d.available)}</td>
    <td>${view.recorded ? d.contacts : '—'}</td><td>${view.recorded ? d.adoptions : '—'}</td><td>${view.recorded ? gain(d.gain) : '—'}</td></tr>`).join('');
  byId('foreign-sector-settings').innerHTML = [
    ['Base annual chance of foreign contact', money(100 * p.foreignContact) + '%'],
    ['Annual chance after currency effects', money(100 * view.row.effectiveForeignContact) + '%'],
    ['Foreign basket real interest rate', money(view.row.foreignRealRate) + '%'],
    ['Source odds when contacted', 'One third per donor'],
    ['Assumed leader premium', money(p.foreignLeaderPremium) + '×'],
    ['Spread of technology opportunities', money(p.foreignTechDispersion) + ' log σ'],
    ['Base adoption speed', money(100 * p.foreignAdoption) + '% of gap'],
    ['Absorptive capacity', money(p.absorptiveCapacity)],
    ['Research capability', money(p.humanCapital)],
    ['Additional adoption delay', p.adoptionLag + ' completed years'],
    ['Effective share of a positive gap adopted', money(100 * Math.min(1, p.foreignAdoption * p.absorptiveCapacity * p.humanCapital)) + '%'],
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
}

function showFinancialSector(view) {
  const {row,recorded} = view;
  byId('sector-market-status').textContent = !recorded
    ? 'Opening balances. New investment orders begin in the first simulated year.'
    : row.financialMarketActive
      ? 'Households reserve money for planned spending and set aside part of the rest for new issues. They can keep the entire balance liquid by setting the deposit share to zero.'
      : 'Choose Household investment to try market funding. Bank lending and existing holdings are shown below.';
  const list = (id, entries, settled) => {
    byId(id).innerHTML = entries.map(([label,value]) =>
      `<div><dt>${label}</dt><dd>${settled&&value!==null ? money(value) : '—'}</dd></div>`).join('');
  };
  list('sector-portfolio-values', [
    ['Liquid household deposits', row.householdDeposits],
    ['Government bonds held by households', row.householdPublicDebt],
    ['Corporate bonds held by households', row.householdCorporateBonds],
    ['Foreign assets held by households', row.householdForeignAssets],
    ['Venture equity in active firms', row.householdVentureEquity],
    ['New equity held in existing firms', row.householdBusinessEquity],
    ['Bank loans to firms', row.loans],
    ['Bank equity', row.bankEquity],
  ],true);
  list('sector-deposit-values', [
    ['Household deposit rate · % per year', row.householdDepositRate],
    ['Business deposit rate · % per year', row.firmDepositRate],
    ['Interest paid to households', recorded?row.householdDepositInterest:null],
    ['Interest paid to businesses', recorded?row.firmDepositInterest:null],
  ],true);
  list('sector-market-values', [
    ['Household orders available', row.marketBudget],
    ['Venture capital for startups', row.ventureFunding],
    ['New shares in existing firms', row.businessEquityIssued],
    ['New corporate bonds', row.corporateBondsIssued],
    ['New government bonds via the market', row.marketGovernmentFunding],
    ['Foreign assets purchased', row.foreignAssetPurchases],
    ['Unspent orders kept liquid', Math.max(0,row.marketBudget-row.marketPurchases)],
  ],recorded);
  list('sector-market-returns', [
    ['Interest paid to households', row.corporateBondInterest],
    ['Principal repaid', row.corporateBondRepayments],
    ['Principal written off', row.corporateBondWriteoffs],
    ['Recovered from closed firms', row.corporateBondRecoveries],
  ],recorded);
}

function showFiscalAccounts(view) {
  const row = view.row;
  const list = (id, entries) => {
    byId(id).innerHTML = entries.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  };
  const transfer = value => view.recorded ? money(value) : '—';
  list('sector-fiscal-values', [
    ['Public budget base · real units',money(row.publicBudgetBase)],
    ['Planned purchases · real units',transfer(row.plannedPublicDemand)],
    ['Delivered purchases · real units',transfer(row.government)],
    ['Central bank policy rate',money(row.policyRate)+'%'],
    ['Business borrowing rate',money(row.effectiveLoanRate)+'%'],
    ['New public borrowing quote',money(row.newPublicRate)+'%'],
    ['Expected return on business lending',money(row.expectedBusinessReturn)+'%'],
    ['Bank capacity used by public debt',money(row.publicCreditWeight)+' of bond book'],
    ['Rate paid on outstanding public debt',money(row.publicDebtRate)+'%'],
  ]);
  byId('sector-credit-note').textContent = !view.recorded ? 'Opening rates are shown before any simulated payments.'
    : row.bankCreditCrowdedOut > 1e-9
      ? `Public bonds reduced the available business credit by ${money(row.bankCreditCrowdedOut)} nominal units under the shared capacity assumption.`
      : 'Counting public bonds left executed business credit at the same level this year.';
  byId('sector-credit-note').textContent += ' The weight ranges from 0.20 to 0.40 and rises with the yield on new public bonds relative to expected business loan returns.';
  const p=view.settings;
  list('sector-tax-values', [
    ['Worker average income tax',money(p.incomeTax)+'% · '+transfer(row.wageWithholding)],
    ['Collected worker tax / gross payroll',view.recorded&&row.wages>1e-12?money(100*row.wageWithholding/row.wages)+'%':'Unavailable'],
    ['Preliminary worker withholding refunded',transfer(row.fiscalWorkerTaxRefund)],
    ['Additional worker tax collected',transfer(row.fiscalWorkerExtraTax)],
    ['Worker-tax request not collected',transfer(row.fiscalWorkerTaxUncollected)],
    ['Business income tax',money(p.profitTax)+'% · '+transfer(row.profitTaxPaid)],
    ['VAT',money(p.consumptionTax)+'% · '+transfer(row.nominalConsumptionTax)],
    ['Tax on financial income',money(p.financialIncomeTax)+'% · '+transfer(row.financialIncomeTaxPaid)],
    ['Wealth tax',money(p.wealthTax)+'% · '+transfer(row.wealthTaxPaid)],
    ['Import tariff',money(p.importTariff)+'% · '+transfer(row.importTariffRevenue)],
  ]);
  list('sector-saving-values', [
    ['National saving · nominal units',transfer(row.nationalSaving)],
    ['Gross investment · nominal units',transfer(row.grossInvestment)],
    ['Saving less investment · nominal units',transfer(row.nationalSaving-row.grossInvestment)],
    ['Net goods exports · nominal units',transfer(row.nominalExports-row.nominalImports)],
    ['Foreign investment income · nominal units',transfer(row.foreignAssetIncome)],
    ['Financial sector net foreign interest',transfer(row.bankForeignIncome)],
    ['Net customs settlement paid externally',transfer(-row.tariffNetExternalTransfer)],
    ['Other net foreign income and transfers',transfer(row.otherForeignIncome)],
    ['Less government interest paid abroad',transfer(row.governmentInterestToForeign)],
    ['Current account · nominal units',transfer(row.currentAccount)],
  ]);
  list('sector-saving-detail', [
    ['Households',transfer(row.householdSaving)],
    ['Firms',transfer(row.firmSaving)],
    ['Financial sector · bank earnings',transfer(row.bankSaving)],
    ['Government',transfer(row.publicSaving)],
    ['Private saving after investment',transfer(row.privateNetLending)],
  ]);
}

export function renderSectorYear(result, year) {
  const select = byId('sector-relationship');
  if (!select.options.length) select.innerHTML = links.map(link =>
    `<option value="${link.id}">${link.title}</option>`).join('');
  const sectorSelect=byId('sector-overview-select');
  if(!sectorSelect.options.length)sectorSelect.innerHTML=Object.entries(sectors).map(([key,sector])=>
    `<option value="${key}">${sector.name}</option>`).join('');
  const side = byId('sector-economy').value;
  const view = sectorYear(result, side, year);
  byId('sector-dynamics').classList.remove('hidden');
  byId('sector-caption').textContent = (side === 'scenario' ? 'Scenario' : 'Reference') + ` seed ${view.seed} · year ${year}. ` +
    (view.recorded ? 'Arrows are settled transfers at current prices. The cards show end-of-year balances.' : 'Opening balances are shown before any simulated transfers.');
  drawMap(view, select.value, sectorSelect.value);
  byId('sector-overview-context').textContent=(side==='scenario'?'Scenario':'Reference')+
    ` · year ${year} · nominal model units`;
  showOverview(view,sectorSelect.value);
  showDetails(view, select.value);
  showFinancialSector(view);
  showFiscalAccounts(view);
  showForeign(view);
}
