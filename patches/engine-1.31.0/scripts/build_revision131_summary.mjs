import fs from 'node:fs';
const root=new URL('../',import.meta.url),r=JSON.parse(fs.readFileSync(new URL('dist/data/revision131_validation.json',root)));
const {payerCases,longRuns,interventions,scores,fiscalScores,...summary}=r;
fs.writeFileSync(new URL('dist/revision131-data.mjs',root),'export const REVISION131='+JSON.stringify(summary)+';\n');
const sum=a=>a.reduce((s,x)=>s+x,0),mean=a=>sum(a)/a.length,n=x=>x.toFixed(6);
const table=['gdp','ca','deficit'].map(key=>`| ${key} | ${n(r.scoreCountries[key].earlier.RMSE)} | ${n(r.scoreCountries[key].candidate.RMSE)} | ${n(r.scoreCountries[key].earlier.MAE)} | ${n(r.scoreCountries[key].candidate.MAE)} |`).join('\n');
const drift=which=>mean(payerCases.filter(x=>x.country!=='EU27').map(x=>Math.abs(x['firstIncomeGini'+which]-x.openingIncomeGini)));
const worse=Object.entries(r.byCountry).filter(([code])=>code!=='EU27').map(([,x])=>x).filter(x=>x.score.gdp.candidate.RMSE>x.score.gdp.earlier.RMSE+1e-10).length;
fs.writeFileSync(new URL('research/PAYROLL_TAX_METHODS_1_31.md',root),`# Payroll-tax counterparty correction — engine 1.31

The retained correction improves a specific payment mechanism. It does not establish improved forecasting accuracy or a fully realistic income distribution. All source inputs and economic response coefficients are unchanged.

## Identified error

The source-budget bridge reconciles preliminary worker withholding to its configured aggregate tax target. In engine 1.30.1 a negative adjustment returned cash according to financial ownership, including to households that had no current wages and no withholding to reverse. Positive adjustments were distributed by deposits, so asset holders could pay a modeled worker-tax adjustment unrelated to their payroll. These allocations distort household disposable income and later spending/financing choices.

## Implemented correction

The engine records the actual current-period gross payroll after funded hours and persistent earnings weights allocate the wage bill. Refunds reverse withholding proportionally among its actual payers. They do not exceed the represented tax paid. Extra requests use the same wage recipients, are capped by each recipient's remaining gross payroll and available cash, and are not reassigned to another household when someone cannot pay. Unsupported requests are reported as uncollected cash revenue. No cash is created and no duplicate tax is charged.

The function retains actual household cash before and after settlement, excluding government-financing bond purchases, so counterparty checks use independently measured balances. Opening observations are unchanged. With fiscal coverage disabled, shared economic row values reproduce the frozen prior engine. Pension funding uses the final collected worker tax as before. Existing public benefits and other tax channels remain distinct.

This is a reconciliation of represented payroll withholding, not a new refundable tax-credit programme. Real-world personal income taxes can also tax pensions, self-employment, capital income and other benefits. The source worker/capital decomposition and pooled wage mapping remain proxies. The lagged-GDP tax target is retained; an empirically unverified wage elasticity or progressivity rule is not silently added. Uncollected requests are forgone cash revenue, not an accrued tax asset in this model.

## Business-income-tax control correction

EU fiscal snapshots retained a zero corporate-tax reference even though the active website used the existing positive registry default. The fiscal scaling function treated a zero reference as an instruction to ignore the control. Consequently, changing or zeroing business income tax could leave observed fiscal coverage receipts unchanged. The correction uses the already-existing default control as the missing reference; it does not invent a statutory national tax rate. Baseline observed receipts and all preset values remain unchanged. All30 presets are checked at zero and raised business-tax settings, with longer zero/increase interventions for the six focus economies. Corporate and other fiscal counterpart allocation rules remain broader proxies.

## Executed comparisons

${r.paths} paths and ${r.annualSteps.toLocaleString('en-GB')} annual steps compare frozen1.30.1 with the correction. All30 presets use five common seeds: one120-year and four12-year pairs. Six economies also have three-seed40-year retirement, worker-tax and business-tax interventions. Every case is retained. No coefficient is fitted or selected on forecast errors or GDP signs.

${r.openingValuesPreserved.toLocaleString('en-GB')} common opening values are exactly preserved. Maximum relative sector/finance residual: ${r.maxResidual.toExponential(3)}. Maximum public-debt bridge residual relative to debt scale: ${r.maxDebtBridge.toExponential(3)}. The actual tax cash-difference check has maximum residual ${r.maxTaxCashRelativeResidual.toExponential(3)} relative to household cash. Extremely large century-long stocks make absolute subtraction lose units, so the test includes an explicit machine-precision bound on the cash stocks; it does not modify the economic simulation.

The earlier allocation sent ${r.payerSummary.earlierRefundToNonEarners.toFixed(6)} nominal model units of represented worker refunds to non-earners across the retained baseline paths. The correction sends ${r.payerSummary.candidateRefundToNonEarners} there. This sum combines differently scaled countries and years and is an accounting diagnostic, not an economic effect size. Maximum collected-worker-tax/gross-payroll ratio: ${r.payerSummary.maximumWorkerBurden.toFixed(6)}. Full cash constraints, no-payroll, no-withholding, refund bounds, own-liquidity and income-base boundaries have separate unit checks.

GDP, income/expenditure accounts, national saving less investment, CA/NFA transactions, private/public debt and pension allocations reconcile. Source-year tariffs, public budgets, opening inequality and data vintages remain unchanged. Tests also preserve authored1.30/1.30.1 inputs and event schedules.

## Conditional macro diagnostics and unsuccessful outcomes

Both versions use identical previously examined revised2024/25 observations and dated capital-budget information. These are retrospective conditional diagnostics, not forecasts using only information available in2023 and not an untouched holdout. Repeated seeds are not additional historical observations. Individual countries and the overlapping EU27 aggregate are scored separately.

29-country results, percentage-point units:

| Outcome | Earlier RMSE | Corrected RMSE | Earlier MAE | Corrected MAE |
|---|---:|---:|---:|---:|
${table}

${worse} of29 individual countries have worse GDP RMSE in this diagnostic. All country results remain in the report. A more faithful tax payment allocation need not improve these macro errors; no broad forecasting gain is inferred.

Across29 individual countries, the mean absolute year1 income-Gini difference from the opening target changes from ${drift('Earlier').toFixed(6)} to ${drift('Candidate').toFixed(6)}. This is opening-moment drift, **not a prediction error against observed2024 income**. It exposes a separate weakness: observed disposable-income Gini is used as a proxy for gross earnings ranks, while modeled transfers and capital income subsequently change the distribution. The correction does not retune those ranks against future outcomes or force future Gini to the opening target. Extreme long-run paths also remain visible; 120-year stress tests do not validate pension, fiscal or financial forecasts.

## Consistent deployed model code

Deployment assigns one release identifier to relative module imports, the main script and the simulation worker. This prevents a fresh entry point from combining old cached fiscal/parameter modules with a new engine. The integration test first loads and caches the prior1.30.1 graph, replaces the files, versions their URLs and verifies exact current ITA/USA/CHN outputs. The old ignored-zero business-tax behaviour is reproduced before the replacement. The clean downloadable source is packaged before deployment-only URL versioning. Reproduce this additional software check with \`node tests/versioned-runtime.mjs\`.

## Evidence boundary

[OECD Taxing Wages2025 methodology](https://www.oecd.org/en/publications/taxing-wages-2025_b3a95829-en/full-report/methodology-and-limitations_49306c2c.html) distinguishes gross wages, worker taxes, social contributions and net take-home pay, and separately defines tax credits and transfers. [OECD Revenue Statistics2025](https://www.oecd.org/en/publications/revenue-statistics-2025_3a264267-en/full-report/disentangling-personal-income-tax-revenue-in-oecd-countries_d5d8741b.html) explains that household personal-income taxes span more than wages. These primary sources were checked24November2026. They support the distinction and the mapping caveat; they do not estimate this ABM's coefficients, household distribution or fiscal multiplier.

No claim is made that tax refunds are universally unavailable to nonworkers in actual tax systems. This correction concerns only the reversal of this model's recorded payroll withholding. Verified source observations are retained. Richer pension-tax, employer/employee, gross/net income and corporate-tax data would be needed before replacing the wider fiscal proxy.

Reproduce with \`python3 scripts/unpack_source_fixtures.py\`, \`node tests/payroll-tax.mjs\`, \`node tests/revision131.mjs\` and \`node scripts/build_revision131_summary.mjs\`. Frozen source and inputs: \`research/frozen_engine_v1_30_1/\`. Full outcomes: \`dist/data/revision131_validation.json\`.
`);
console.log('Built payroll-tax evidence and methods from executed results.');
