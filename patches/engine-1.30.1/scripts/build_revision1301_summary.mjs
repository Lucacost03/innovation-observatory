import fs from 'node:fs';
const root=new URL('../',import.meta.url),r=JSON.parse(fs.readFileSync(new URL('dist/data/revision1301_validation.json',root)));
const focus=['ITA','DEU','FRA','EU27','USA','CHN'];
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const n=x=>x.toFixed(3);
const table=focus.map(country=>{
 const cs=r.cases.filter(x=>x.country===country&&x.delta===-2);
 return `| ${country} | ${[4,10,20,40].map(t=>n(mean(cs.map(x=>x.years.find(x=>x.year===t).realGDPPercent)))).join(' | ')} |`;
}).join('\n');
const funding=r.funding.filter(x=>['ITA','USA','CHN'].includes(x.country)).map(x=>`| ${x.country} | ${n(x.benefits)} | ${n(x.collectedWorkerTax)} | ${n(x.previousAllocatedTax)} | ${n(x.correctAllocatedTax)} | ${n(x.correctGap)} |`).join('\n');
const text=`# Retirement and pension reporting audit — engine 1.30.1

This release corrects an identified reporting inconsistency and explains retirement comparisons. It does not tune GDP to an expected sign or change any economic response coefficient. All source inputs remain unchanged. Reporting accuracy improves; empirical forecast accuracy is unchanged and remains unestablished.

## Finding and correction

Public old-age benefits are government-to-household cash transfers. They are not added directly to GDP. The final public budget already uses reconciled worker income-tax/social-contribution receipts. However, the pension funding memo previously allocated a share of preliminary payroll withholding, before fiscal coverage refunded or collected the difference. The two reporting lines could describe taxes that had been refunded and could incorrectly show pension spending as covered.

The allocation is now calculated after fiscal reconciliation:

\`allocated worker tax = max(0, final collected worker withholding) × configured allocation share\`

\`reported funding difference = public old-age benefits − allocated worker tax\`

There is no new tax, pension reserve, cash payment, GDP component or debt entry. The allocation share remains an explicit assumption or proxy; it is not an observed statutory pension contribution rate. A negative difference is not evidence of an actual pension-fund surplus. Other fiscal receipts and borrowing finance a positive difference. Opening simulated pension flows remain unavailable in charts rather than being displayed as observed zeros.

Year 1 examples, unchanged preset settings and seed 2026 · nominal model units:

| Economy | Old-age payments | Final collected worker tax | Previous allocation | Corrected allocation | Corrected signed difference |
|---|---:|---:|---:|---:|---:|
${funding}

## Retirement/GDP trend

Each period is one year. Single-year population cohorts advance and the statistical working-age group remains 15–64. Pension eligibility is an overlapping representative policy threshold, not an automatic employment exit. It changes modeled eligibility and shifts participation using the separately labelled, unestimated reform response. Existing pension benefit normalization continues to use the source retirement age, so changing a scenario's opening age does not erase its cost.

Lower eligibility usually reduces labour supply. Actual GDP also depends on customers, available capital, financing, hiring, innovation and firm survival. In some demand-constrained US paths, higher subsequent consumption and investment offset the smaller workforce. The expenditure breakdown describes where the output difference appears; it does not identify a causal multiplier. A higher GDP outcome alone does not validate a pension reform.

Mean real-GDP difference from the matched control after a two-year reduction in eligibility age beginning in year 4 · percent of control · three seeds:

| Economy | Year 4 | Year 10 | Year 20 | Year 40 |
|---|---:|---:|---:|---:|
${table}

The existing population/pension outcome details now show the selected year's paired labour force, benefit cost, funding difference and public debt, together with an exact real-GDP decomposition into consumption, government consumption, fixed investment, inventory change and net exports. Findings distinguish an isolated retirement-age experiment from changes combined with other controls or events. No extra long chart is added.

## Executed validation

${r.paths} paths and ${r.annualSteps.toLocaleString('en-GB')} annual steps were executed. All 30 presets use three common seeds, control and plus/minus two eligibility years from year 4, with 40 annual periods. Every path is compared with the frozen original 1.30.0 engine. Six focus economies also test participation responses 0 and 1, while 0.5 remains the unchanged default, and have 120-year retirement stress tests.

${r.unchangedEconomicValues.toLocaleString('en-GB')} economic/reporting row values excluding the two corrected pension memos are exactly identical to 1.30.0. This includes GDP, tax revenue, public/private debt, cash, employment, innovation and financial stocks. No event anticipates its start. The largest relative sector/finance residual is ${r.maxResidual.toExponential(3)}; the largest real-GDP decomposition residual is ${r.maxGDPSplitResidual.toExponential(3)} real units. Maximum pension tax-allocation error falls from ${n(r.maxFundingErrorBefore)} to ${r.maxFundingErrorAfter}. Saving minus investment, current account/NFA transactions, expenditure GDP and debt financing reconcile.

The sensitivity values are illustrative assumptions, not statistical confidence bounds. Three seeds do not establish robust empirical reform effects. Extreme long-run paths and mixed GDP signs remain in the downloadable report. No improvement in GDP forecast error is claimed because the economic paths are unchanged. Saved 1.30.0 inputs, including intentional zeros and event schedules, are preserved.

## Evidence and remaining limitations

OECD's 2024 paper [Is it worth raising the normal retirement age?](https://www.oecd.org/en/publications/is-it-worth-raising-the-normal-retirement-age_5f2a3b40-en.html) finds that estimated labour effects depend on country demographics, pension systems and early-exit pathways. The [ECB population-ageing and pension-reform analysis](https://www.ecb.europa.eu/press/economic-bulletin/html/eb201802.en.html) discusses labour supply, consumption, financing and country-specific reform design. These sources motivate transparent channel comparisons, not a fitted coefficient or universal GDP sign in this model. Primary pages checked 23 November 2026. Existing retained country population, participation and pension references remain the source for opening inputs.

The model still lacks individual age-linked pension beneficiaries, lifetime contribution histories, minimum versus normal eligibility schedules, disability/early-exit substitution, country-specific benefit recalculation, healthy-life constraints and a fully estimated sovereign financing response. Household pension payments are allocated among synthetic households without age-linked histories. Funded pensions use pooled asset/liquidity rules. These limitations matter for distribution and fiscal policy evaluation. Adding arbitrary coefficients without suitable data would not establish accuracy, so they are disclosed rather than silently calibrated to a desired GDP effect.

Reproduce with \`python3 scripts/unpack_source_fixtures.py\`, then \`npm run test:retirement\`. Full cases, assumptions and stress outcomes: \`dist/data/revision1301_validation.json\`. Frozen baseline source and its hash manifest: \`research/frozen_engine_v1_30/\`.
`;
fs.writeFileSync(new URL('research/RETIREMENT_PENSION_METHODS_1_30_1.md',root),text);
console.log('Built retirement methods from executed results.');
