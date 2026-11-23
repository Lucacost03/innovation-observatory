"""Write a current audit from executed results and package runnable source."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
data = root / 'dist/data'
load = lambda name: json.loads((data / name).read_text())
v, diffusion, turnover = [load(n) for n in ['simulation_validation.json', 'diffusion_audit.json', 'turnover_validation.json']]
size = load('size_mapping_diagnostics.json')
labor = load('employment_audit.json')
frontiers = load('foreign_frontiers.json')
row_pool = frontiers['restOfWorld']
current_labor = labor['comparison'][-1]
prior_labor = labor['comparison'][0]
audit = load('parameter_audit.json')
price = load('price_validation.json')
open_economy = load('open_economy_validation.json')
money = load('money_validation.json')
fiscal = load('fiscal_validation.json')
trade = load('trade_validation.json')
finance = load('finance_validation.json')
live = load('live_economy_validation.json')
distribution = load('distribution_validation.json')
household_trade = load('household_trade_validation.json')
event_editor = load('event_editor_validation.json')
capital_inputs = load('capital_input_validation.json')
income_fiscal = load('income_fiscal_validation.json')
society = load('society_validation.json')
foreign_projection = load('foreign_projection_validation.json')
event_inputs = load('event_input_validation.json')
macro_policy = load('macro_policy_validation.json')
social_spending = load('social_spending_validation.json')
regression = json.loads((root / 'research/distribution_regression.json').read_text())
manifest = load('official_data_manifest.json')
qa_file = root / 'research/browser_qa_1_26.json'
qa = json.loads(qa_file.read_text()) if qa_file.exists() else {}
failed = json.loads((root / 'research/failed_turnover_v1_3_initial/turnover_validation.json').read_text())
intermediate = json.loads((root / 'research/capacity_share_experiment.json').read_text())
initial_both = next(x for x in failed['factorial'] if x['mode'] == 'both')
final_both = next(x for x in turnover['factorial'] if x['mode'] == 'both')
total = v['simulationRuns'] + diffusion['currentEngineRuns'] + turnover['currentEngineRuns'] + labor['currentRuns']
labels = {'legacy_fixed': 'Entry/exit and foreign adoption off', 'turnover_only': 'Entry/exit only',
          'foreign_only': 'Foreign adoption only', 'both': 'Both enabled'}
text = f'''# Innovation Observatory — engine {audit['modelVersion']} validation

Executed reports: general {v['executedAt']}; turnover {turnover['executedAt']}; diffusion {diffusion['executedAt']} and labor {labor['executedAt']}.

**Numerical, accounting, timing and reproducibility checks: PASS. Empirical dynamic validity and out-of-sample forecast accuracy: NOT ESTABLISHED.**

## Model time, labor matching and public purchases

Each step represents one model year. Year 0 uses 2023 opening stocks and normalized demand benchmarks when settling is zero. Settling advances the economy before year 0. The labor force opens at 100 units. With population dynamics active it follows the working-age cohort; employment and unemployment are shares of the current labor force. The original-channel audits below use fixed-population inputs with the new additions off; the current society validation is reported separately. The initial Italy preset has 92.3% employment and 7.7% unemployment in the active labor force.

The previous engine could place every worker in a job. The revised engine separates a share of incumbent jobs, reassigns continuing workers to vacancies and matches a share of opening unemployment. Firms adjust hours after matching. Credit and cash restrict funded payroll. The opening employment control is bounded at 99.9%. Positive separations and partial matching keep unemployment positive during the run.

Eurostat `lfsi_long_a` follows corresponding quarters in consecutive years. The two-state model conditions on employed and unemployed endpoints. The separation proxy is EMP_UNE divided by the sum of EMP_EMP and EMP_UNE. The job finding proxy is UNE_EMP divided by the sum of UNE_EMP and UNE_UNE. Both ratios are expressed as percentages. National or EU aggregate pairs match {labor['matchedLaborRates']['employmentSeparation']}/28 separation inputs and {labor['matchedLaborRates']['jobFindingRate']}/28 job finding inputs. The remaining controls are labeled EU27 fallback assumptions. The source flags are included in the download.

Public borrowing finances delivered purchases after household payments and consumption tax receipts. Under an isolated supply shock with public purchases of {labor['example']['executedPurchases']:.3f} units, borrowing fell from {labor['example']['oldProcurementDebt']:.3f} to {labor['example']['newProcurementDebt']:.3f} units. This test holds taxes, opening debt and other public outflows at zero.

The before and after comparison uses 28 presets, five common seeds and 40 model years. The old engine reached 100% employment in {prior_labor['hit100']}/{prior_labor['runs']} paths. The current engine reached it in {current_labor['hit100']}/{current_labor['runs']} paths, with a peak of {current_labor['maxEmployment']:.2f}%. {current_labor['employmentBelow50']} current paths reach employment below 50% and {current_labor['debtAbove300GDP']} reach public debt above 300% of GDP. The full comparison also includes an intermediate run with the prior donor anchors to separate the technology-pool change. `employment_audit.json` contains every outcome.

## Implemented behavior

Firms now enter and leave. At the same size and arrears, worse opening technology raises relative exit probability. The mean nonfinancial hazard is normalized to a 2023 Eurostat enterprise death-rate proxy. A descriptive size/exit slope comes from grouped Eurostat observations; it is not a causal firm-level estimate. Financial failures may add exits. Independent startup opportunities do not impose one-for-one replacement.

Cash first pays creditors. Remaining loans are written off; funded asset sales can subsequently recover written-off claims. Unsold real assets remain in liquidation estates. Dormant capital depreciates. Households fund their pro-rata common ownership contributions from their own deposits, and entrants buy existing capital. Secondhand transfers enter neither GDP nor new investment. New firms have zero contemporaneous GDP and start operating the next period. Capital, inventories, financial flows and bank accounts reconcile.

Permanent firm IDs preserve histories and process-specific seeded draws after an exit. Links are repaired against current IDs. Delayed histories exclude firms that did not yet exist. Current-capital technology compares active firms; original-cohort knowledge freezes its last value on exit and excludes entrants. Comparisons reconcile knowledge changes among common IDs, capital reallocation and unmatched populations. The unmatched contribution is not causal identification of turnover.

Firms sample the USA, China and a rest-of-world technology pool with equal source probabilities after a contact. The rest-of-world anchor uses {row_pool['coveredEconomies']} of {row_pool['candidateEconomies']} PWT economies outside the USA and China. They account for {100*row_pool['coveredOutputShare']:.2f}% of reported 2023 PPP output in that pool. The home economy is included where covered. Fixed 2023 output-side PPP GDP weights produce a mean `ctfp` of {frontiers['nationalCTFP']['ROW']:.6f} and a mean national 2013–2023 `rtfpna` CAGR of {frontiers['historicalGrowthPct']['ROW']:.4f}% per year. `pwt_rest_of_world_weights.csv` records all members and weights. The model divides the level by the home anchor and applies the configured leader premium. This sets the mean of each source's distribution. Firms adopt positive sampled gaps according to the configured absorption and learning rates. Future donor growth extrapolates the historical average.

## Empirical inputs and mappings

The {audit['controls']} controls separate source statistics, arithmetic transformations, proxies, numerical choices and assumptions. {len(manifest)} frozen official source files retain exact URLs, retrieval dates, source flags and SHA256 hashes. 2023 is the common opening year. Revised observations retrieved in November 2026 are not a real-time 2023 information vintage.

All 28 presets have matched enterprise birth/death rates, grouped size dispersion, descriptive size/exit slopes, startup-size proxies and foreign productivity ratios. Enterprise demography covers the broad business economy, including non-employers; applying its active-enterprise denominator to a synthetic opening population is a mapping assumption. Financial defaults and bounds can change realized rates.

- Size dispersion is the count-weighted standard deviation of log class mean persons employed, across 0, 1–4, 5–9 and 10+ employee classes. Within-class dispersion is unavailable. Applying that sigma to a lognormal capital distribution assumes a size/capital relationship.
- The size/exit coefficient is the negative weighted regression slope of log(-log(1-deathRate/100)) on log class mean employment, weighted by enterprise counts. Zero/missing death rates are omitted from this descriptive log fit. It does not identify firm-level conditional failure behavior.
- Startup size is employment share of births divided by the enterprise birth rate. Converting this employment ratio to startup capital assumes a common capital/labor scale.
- PWT `ctfp` supports cross-country PPP TFP level comparisons. Country-specific `rtfpna` indexes are used only for temporal growth. The EU home denominator is a cgdpo-weighted national TFP mean, not an observed EU aggregate TFP or a measured firm frontier.

Earlier audited employment, fiscal, financial-stock, R&D and financing-cost mappings are retained. R&D labor is finite and funded within the wage bill; non-labor GERD remains an unfinanced benchmark. This is not a complete SNA intangible-capital or detailed equity-instrument account.

## Executed checks

Earlier fixed-price audit reports cover {total:,} paths: {v['simulationRuns']:,} general/source/accounting runs, {diffusion['currentEngineRuns']:,} diffusion/assumption-sensitivity runs, {turnover['currentEngineRuns']:,} turnover/foreign and {labor['currentRuns']:,} labor audit runs. They also cover {turnover['frozenEngineRuns'] + labor['frozenRuns']} paths through archived engines for comparison. The {size['initialStates']} opening states are counted separately. The price experiment has its own comparison below.

Largest reported relative accounting residual: {max(v['maxRelativeResidual'], turnover['maxAccountingResidual']):.3e}. Largest capital-stock reconciliation residual in the turnover suite: {turnover['maxCapitalResidual']:.3e} model units. Runtime checks reject nonfinite stocks, unfunded accounting transactions and failed reconciliations.

'''
text += '\n'.join('- ' + x for x in turnover['checks']) + '\n'
text += f'''
The pure-learning suite also tests 1,000 same-state adoption comparisons and 30 paired multi-period comparisons with innovation, turnover and foreign learning disabled. Raising the same-state adoption fraction never subtracts existing knowledge. This mechanical property does not establish a positive total GDP response.

## Controlled final simulation comparison

Protocol: 28 presets × five common seeds × four channel combinations × 40 annual steps, with no settling or exogenous shocks. The capacity-aware allocation rule and the same matched initial inputs apply to every combination. Coefficients are not selected on the outcomes. Every case is retained in `turnover_experiments.csv` and `research/turnover_experiments.json`.

| Channel combination | Runs | Employment below 50% | Debt above 300% GDP | Population floor | Population cap | Median final employment | Median final debt/GDP |
|---|---:|---:|---:|---:|---:|---:|---:|
'''
for x in turnover['factorial']:
    text += f"| {labels[x['mode']]} | {x['runs']} | {x['employmentBelow50']} | {x['debtAbove300GDP']} | {x['floorBound']} | {x['capBound']} | {x['medianFinalEmployment']:.2f}% | {100*x['medianFinalDebtGDP']:.2f}% |\n"
text += f'''
A path can trigger several flags. The thresholds are assumed plausibility screens, not empirical event probabilities. Both enabled versus both off gives {turnover['pairedSummary']['negativeGDP']}/{turnover['pairedSummary']['pairs']} negative final GDP gaps and {turnover['pairedSummary']['negativeTechnology']} negative active-technology gaps. These outcomes are retained. Foreign adoption improves some screens, while turnover can worsen others. Correct accounting does not make every added mechanism beneficial or realistic.

The diffusion protocol uses five paired seeds for every preset. Eight predeclared illustrative assumption specifications use two paired seeds each for Italy, EU27 and Germany. Earlier archived diffusion results use different mechanisms and seed counts; their signs are not a matched before/after accuracy comparison.

## Iteration, unsuccessful experiment and justified correction

The first turnover variant treated similarly sized firms as targets for aggregate enterprise-count rates and used a size-blind demand target. A tiny startup could attract target demand similar to a large producer, stranding productive capacity. In the initial both-on factorial subset, {initial_both['employmentBelow50']}/{initial_both['runs']} paths reached employment below 50%, and {initial_both['debtAbove300GDP']} exceeded debt/GDP 300%. This variant was unsuccessful and is frozen with its inputs, engine and outcomes in `research/failed_turnover_v1_3_initial/`.

A controlled intermediate correction changed only the capacity basis of demand targets, with the same earlier inputs and 140 country/seed cases. Employment-below-50 flags fell to {intermediate['summary']['below50']}/140; debt-above-300 flags were {intermediate['summary']['above300']}/140. This is a numerical plausibility correction, not forecast improvement. Its code is frozen in `research/capacity_share_variant/`, and all intermediate cases are in `research/capacity_share_experiment.json`.

The final implementation makes that allocation assumption explicit as `capacityCompetition`, enabled in all four final combinations. Its zero setting replays the earlier size-blind rule. Final inputs also replace the narrow common size dispersion and startup-size guess with documented size-class proxies, and anchor the size/exit relationship to grouped observations. As a separate accounting correction, each common owner must fund its own startup equity contribution; an aggregate cash pool alone does not establish shareholder liquidity.

No parameter grid was searched to maximize GDP, force positive diffusion effects or minimize a final holdout error. Structural corrections were made for identified consistency problems, and descriptive source mappings were computed directly from the frozen observations.

## Starting-state size-moment check

Across {size['initialStates']} initial states (28 presets × ten seeds × two size mappings), the mean absolute discrepancy from the observed 2023 employment share of enterprise deaths falls from {size['meanAbsoluteMomentDiscrepancyPP']['earlier']:.3f} to {size['meanAbsoluteMomentDiscrepancyPP']['mapped']:.3f} percentage points. The inputs/moment were inspected during development. This is an **in-sample mapping diagnostic**, not holdout MAE, a historical forecast or independent empirical validation. The remaining discrepancy is retained by country in `size_mapping_diagnostics.json`.

## Unresolved failures and empirical requirements

In the final both-on screen, {final_both['employmentBelow50']}/140 paths reach very low employment, {final_both['debtAbove300GDP']}/140 exceed debt/GDP 300%, and {final_both['floorBound']} hit the two-firm floor. The employment and debt screens flag paths that need further calibration. Do not call the model a reliable macroeconomic forecasting system, validated policy tool or a proof that innovation/turnover has a particular real-world multiplier.

Count/size mappings do not identify joint firm productivity, age, leverage, survival and adoption distributions. A 2023 rate or a historical donor growth rate need not remain constant for 40 years. The price experiment represents one domestic good. Sector linkages, international goods and financial transmission, detailed financing institutions and full R&D capitalization remain outside the model. Behavioral wages, consumption, investment, credit, innovation success and absorptive capacity remain incompletely calibrated.

Further validation needs linked firm panels, measured household demand and firm financing responses, jointly calibrated targets, independent shock-response checks and a predeclared evaluation sample. The original statistical layer produced the archived TFP scores. The browser ABM produced the price comparisons below.

## Reproduction and exports

Follow `README.md`. Numerical simulation needs Node 18+ with no JavaScript dependencies. Offline data regeneration additionally needs pandas and openpyxl. The package includes the original PWT workbook and frozen Eurostat inputs. Older imports recompute with the current engine. The frozen engines permit historical replay of retired settings and Korea-only growth paths. Exported JSON preserves first-seed firm/network histories and event logs for both economies, all row paths and reconciliation checks. The separate event CSV labels its displayed-seed scope.

'''
text += '''## Earlier prices and inflation experiment

Engine 1.5 tested a price rule with a 2% anchor and prior funded sales pressure. This section records the historical comparison. The current rule uses money, spending velocity and output.

The backtest uses all-items Eurostat HICP for a comparison with the model's single consumer good. The rule was chosen among feedback variants on 2014–2019 data and assessed in the later checks. Errors are in percentage points across 27 member countries. Inflation is the one-year change in year 2 and GDP growth is annualized over two years.

| Price rule | 2020–2023 inflation RMSE | 2025 inflation RMSE | 2025 GDP growth RMSE |
|---|---:|---:|---:|
'''
for key, label in [('fixed', 'Fixed prices'), ('anchor', 'Constant 2% anchor'), ('demand', 'Changing prices')]:
    older = price['scores']['historical'][key]['memberCountries']['2']
    recent = price['scores']['recent'][key]['memberCountries']['2']
    text += f"| {label} | {older['inflation']['rmse']:.2f} | {recent['inflation']['rmse']:.2f} | {recent['gdp']['rmse']:.2f} |\n"
text += '\nIn the earlier study, inflation forecast errors fell and GDP growth forecast errors increased. See `price_validation.json` for the full protocol and other scores.\n\n'
text += '''## Foreign matching, policy rates and the currency in engine 1.6

New configurations draw firm-level opportunities from a mean-preserving lognormal distribution. A common dispersion of 0.30 is illustrative. A national mean is an anchor for contact opportunities, and a firm adopts from the individual draw when the draw exceeds its own technology. The opening policy rate uses the ECB deposit facility rate or a matched BIS national series. Bulgaria and EU27 use ECB proxies. The first policy signal uses 2023 HICP and subsequent signals use lagged model inflation. Policy rate movements change effective loan interest and planned investment. Currency appreciation lowers price pressure and increases the chance of a foreign contact. The currency index represents a synthetic basket.

'''
text += open_economy['protocol'] + '\n\n' + open_economy['measurement'] + '\n\n'
text += '| Configuration | 2024 inflation RMSE | 2025 inflation RMSE | 2025 GDP growth RMSE |\n|---|---:|---:|---:|\n'
for key, label in [('fixed','Earlier fixed-price setup'), ('prices','Changing prices alone'), ('dispersion','Varied foreign matches alone'),
                   ('monetary','Prices, policy and currency'), ('integrated','All new channels')]:
    first, second = (open_economy['scores'][key]['memberCountries'][horizon] for horizon in ('1','2'))
    text += f"| {label} | {first['inflation']['rmse']:.2f} | {second['inflation']['rmse']:.2f} | {second['gdp']['rmse']:.2f} |\n"
text += '\n' + open_economy['decision'] + ' See `open_economy_validation.json` for MAE, RMSE and all country results.\n\n'
text += '''## Money-based inflation and real GDP in engine 1.7

The price rule compares opening private money times planned spending velocity with the most recent output valued at the preceding price. Prices adjust gradually. The first signal uses the opening balances and the model's opening goods scale. The central bank reacts to prior-year inflation, changes the borrowing rate and influences spending speed. The currency responds to the domestic policy rate after inflation relative to an assumed foreign real rate. Households translate last year's real income into a current-price spending plan. Actual purchases remain cash-constrained.

'''
text += money['controlled']['protocol'] + '\n\n'
text += '| Calculation at 2% inflation | Median GDP gap in year 10 | Median GDP gap in year 20 | Year-40 GDP below 50 |\n|---|---:|---:|---:|\n'
for mode, label in [('old','Earlier spending calculation'), ('new','Corrected spending calculation')]:
    run = money['controlled']['modes'][mode]
    text += f"| {label} | {run['outputs']['10']['pairedMedianGDPGapPct']:.2f}% | {run['outputs']['20']['pairedMedianGDPGapPct']:.2f}% | {run['finalGDPBelow50']} of {run['paths']} |\n"
text += '\n' + money['historicalValidation']['protocol'] + '\n\n'
text += 'The rate of price adjustment was selected using the 2014–2019 targets. The full scores, paired outputs, 40-year stress counts and rate-response comparison are in `money_validation.json`.\n\n'
text += '''## Public demand and policy-sensitive credit in engine 1.8

The public purchase plan is separate from the opening composition. The trend in the default country budget base uses ten annual observations of real government final consumption ending in 2023. Government and business borrowing rates respond to the current policy decision. The effective rate on the outstanding public stock adjusts gradually. Interest settles on opening public claims. The optional shared-capacity rule counts part of bank-held public debt against business lending capacity.

The saving accounts sum household, firm, bank and government saving independently. Gross investment includes changes in inventories. The difference between national saving and gross investment equals the current account. Domestic settlement makes this balance zero. The public saving account also reconciles to debt issuance, changes in deposits and recapitalization.

'''
text += fiscal['stress']['protocol'] + '\n\n'
text += '| Cut timing | Earlier paths below half of opening GDP in year 40 | Revised paths |\n|---|---:|---:|\n'
for key, label in [('cut', 'Year 1'), ('timeline', 'Year 8')]:
    earlier = fiscal['stress']['results']['legacy']['summary'][key]
    revised = fiscal['stress']['results']['publicTrend']['summary'][key]
    text += f"| {label} | {earlier['finalGDPBelow50']} of {earlier['paths']} | {revised['finalGDPBelow50']} of {revised['paths']} |\n"
text += '\n' + fiscal['benchmark']['protocol'] + '\n\n'
text += fiscal['decision']['trendRationale'] + ' See `fiscal_validation.json` for rates, debt risks, tested alternatives and country outcomes.\n\n'
text += """## Foreign trade, real currency and loan pricing in engine 1.9

Reset restores Fixed mode for both the policy rule and the nominal exchange rate. Business borrowing is priced from the opening policy rate, a calibrated opening margin and the pass-through of each year's policy change. Earlier independent loan-rate paths are retired. The replacement of missing-country opening loan quotes with an assumed cross-country margin was tested and held back after higher GDP, unemployment and inflation errors in the eight affected presets.

The trade scenario uses 5% of gross Eurostat trade as a scale for the final-goods channel. Imports compete for household spending and their prices enter the consumer index. Export orders contribute to production plans. Exports settle from goods left after domestic purchases and normal inventories. The real strength index multiplies nominal strength by the ratio of domestic producer prices to foreign basket prices. Foreign prices and demand each grow at an assumed 2% per year.

The current account equals goods exports minus imports in this specification. It reconciles to national saving less gross investment and to the change in the bank's net external settlement position. External income, imported inputs and valuation of foreign assets are outside the modeled accounts.

"""
text += trade['protocol'] + '\n\n'
text += '| Configuration | 2025 GDP growth RMSE | 2025 unemployment RMSE | 2025 net exports / GDP RMSE | Debt above 300% in year 40 |\n'
text += '|---|---:|---:|---:|---:|\n'
for mode, label in [('closed','Trade off'),('open','Open to trade'),('floating','Trade with policy and currency rules'),
                    ('broad','Broader trade coverage')]:
    errors = trade['scores'][mode]['memberCountries']['2']
    stress = trade['stress'][mode]
    text += (f"| {label} | {errors['gdp']['rmse']:.2f} | {errors['unemployment']['rmse']:.2f} | "
             f"{errors['netExports']['rmse']:.2f} | {stress['debtAbove300']} of {stress['paths']} |\n")
text += (f"\nThe study ran {trade['paths']} paths and {trade['annualSteps']} annual steps. The maximum relative accounting residual was "
         f"{trade['maxResidual']:.2e}. " + trade['decision'] + ' See `trade_validation.json` for the full comparisons.\n\n')
text += """## Household investment and financial markets in engine 1.10

The market uses voluntary orders from deposits above planned household spending. New equity and corporate bonds fill some of a firm's cash gap before bank loans. Venture funding pays for secondhand capital and working cash. The model tracks household holdings, dividends, interest, repayments, write-offs and recoveries. The government can borrow through new bond issues to households and banks. Equity positions are measured at contributed cost.

Purchases of securities reallocate deposits. Gross investment tracks fixed investment and inventory changes. National saving minus gross investment reconciles to the current account with either trade setting.

"""
text += finance['recentProtocol'] + '\n\n'
text += '| Configuration | 2025 real GDP growth RMSE | 2025 unemployment RMSE | 2025 inflation RMSE | Debt above 300% of nominal GDP in year 40 |\n'
text += '|---|---:|---:|---:|---:|\n'
for mode, label in [('legacy','Earlier rules'),('market','Household investment'),('smallerBudget','Smaller deposit commitment')]:
    errors = finance['recent'][mode]['errors']
    stress = finance['stress'][mode]
    text += (f"| {label} | {errors['gdp']['rmse']:.2f} | {errors['unemployment']['rmse']:.2f} | "
             f"{errors['inflation']['rmse']:.2f} | {stress['debtAbove300']} of {stress['paths']} |\n")
text += (f"\nThe study ran {finance['paths']:,} paths over {finance['annualSteps']:,} annual steps. The maximum relative residuals were "
         f"{finance['maxFinanceResidual']:.2e} for the financial ledgers and {finance['maxSavingResidual']:.2e} for saving minus investment. "
         "The market is optional. Startup entry fell and banks bought more of the new public debt. The funding weights are scenario assumptions. "
         "See `finance_validation.json` for country results and the combined trade and monetary runs.\n\n")
text += """## Opening values, international finance and active country defaults

Year 0 displays the observed local 2023 HICP and model opening stocks. Unobserved annual flows start in year 1. The public-debt capacity weight is derived from the new public bond quote relative to the expected business loan return and stays between 0.20 and 0.40. Foreign securities earn income on opening holdings. Unfilled domestic orders can use a current account surplus after planned foreign purchases. Currency valuation and gross foreign purchases settle outside current income.

Country defaults enable all four channels. Goods sell to higher bidders first. Competitiveness depends on relative technology as well as real exchange rates. A small group of foreign buyers is willing to pay a premium. Banks pay policy-linked interest on opening deposits. The model separates five tax bases and accepts signed domestic, foreign, rate and currency shocks.

"""
text += live['benchmark']['protocol'] + '\n\n'
text += '| Outcome | Earlier RMSE | Current RMSE |\n|---|---:|---:|\n'
for key, label in [('gdp','Real GDP growth'),('unemployment','Unemployment'),('inflation','Inflation')]:
    before, after = (live['benchmark'][series][key]['rmse'] for series in ['priorErrors','currentErrors'])
    text += f"| {label} | {before:.2f} | {after:.2f} |\n"
text += (f"\nBoth trade flows were positive in all {live['stress']['default']['years'] + live['stress']['combined']['years']:,} "
         "years of the default and combined stress cases. "
         f"The accounting checks covered {live['paths']} paths and {live['years']:,} years. The largest relative gap was "
         f"{live['maxAccountingResidual']:.2e}. See `live_economy_validation.json` for country results and settings.\n\n")
text += """## Household distribution and external transaction reporting in engine 1.13

Income Gini uses annual household cash income after modeled direct taxes and includes wages, transfers, interest and dividends. It excludes principal, securities purchases, liquidation proceeds and currency revaluation. Negative values are retained. For positive total income the population Gini can exceed one with negative observations. Unequal values with a nonpositive total are marked unavailable, rather than clipped or shifted. An all-zero distribution has Gini zero by convention. Every household has equal weight. Household-size equivalence adjustments are outside the model.

Financial wealth is recorded deposits, public and corporate bonds, contributed equity in active firms and foreign securities at the current exchange rate. Housing, household debt, original unpriced firm and bank ownership, and contingent liquidation claims are excluded. Equity at paid-in cost is not a market valuation. This measure is a subset of total household net wealth. The synthetic opening income distribution is equal and the wealth distribution is lognormal by assumption. These are model outcomes, not country survey estimates.

Every year has income and financial-wealth Gini metrics. First-seed household vectors support complete histograms, means, medians, P10/P90 and independently ranked equal-population quintiles. Summarized trend metrics use medians and P10/P90 across paired seeds. Exports include scalar metrics for all seeds and first-seed distributions in the full JSON.

Public debt / GDP uses public bond face values divided by annual nominal GDP. Private debt / GDP uses active business bank loans plus outstanding corporate bond face values. It does not double count deposits or treat shares as debt. Household borrowing is not modeled. Nonpositive nominal GDP makes ratios unavailable.

Acquisition cost is tracked on each household foreign-security purchase. The national transaction position is household foreign acquisition cost plus the bank's signed foreign settlement position. Gross assets are household acquisition cost plus a positive bank settlement asset. Gross liabilities are a negative bank settlement position. The independently calculated annual change in assets less liabilities must equal the current account. Gross household purchases change the sector holding the external position and do not set its net flow. Separate currency revaluation bridges this transaction position to the net position at current exchange rates. Capital-account transfers and other volume changes are outside the model. With valuation present, the change in a market-valued international position is current account plus valuation, not current account alone.

References for definitions are OECD Income inequality (https://doi.org/10.1787/459aa7f1-en) and IMF External Sector Report 2025 (https://www.imf.org/-/media/Files/Publications/ESR/2025/English/text.ashx). These sources do not calibrate the household microdistribution.

"""
text += (f"The executed reporting study covered {distribution['paths']} paths and {distribution['years']:,} annual steps, "
         f"including {distribution['negativeIncomeYears']} years with negative individual incomes. "
         f"The maximum relative foreign transaction residual was {distribution['maxForeignResidual']:.2e}, "
         f"and the recorded wealth reconciliation gap was {distribution['maxWealthResidual']:.2e}. "
         f"A separate regression compared {regression['paths']} matched paths and reproduced all "
         f"{regression['unchangedExistingValues']:,} existing economic output values exactly against commit {regression['priorCommit']}. "
         "These additions improve reporting and enforce explicit accounting. No additional dynamic forecasting accuracy has been established. "
         "Historical accuracy studies above retain their original engine specifications.\n\n")
text += """## Empirical household moments, gross foreign positions and tariffs in engine 1.14

Opening income Ginis use Eurostat ilc_di12, age TOTAL, EU-SILC 2024 (generally 2023 income), divided by 100. Mapping equivalised disposable income to equally sized model households is a proxy. Persistent earnings ranks distribute the fixed, funded aggregate wage bill without changing the labor input or creating money. The correlation of income and wealth ranks is assumed to be 0.4. No future Gini is forced back to its opening target.

The financial-wealth benchmark is reconstructed from ECB HFCS 2023 C1 participation rates and C3 conditional financial-asset deciles and means. Quantiles interpolate linearly below P90. A Pareto upper decile matches the conditional mean. Probability-bin integrals preserve the mean, including the upper tail, on a 20,000-bin reference grid. Rounded '< 0.1' figures use a 0.05 midpoint. The resulting Gini is a derived proxy for financial assets, not an official published Gini for total net wealth. Twenty-two national inputs are covered. Bulgaria, Denmark, Poland, Romania, Sweden and EU27 use a euro-area proxy. The published HFCS J4 total net-wealth Gini is displayed separately. Country reference periods and survey comparability notes remain in the frozen workbook. Initial synthetic lognormal ranks match the chosen Gini moments at the actual household count, but do not reproduce survey microdata or every decile exactly.

Gross external settlement assets and liabilities start as matched stocks, using 5% of the smaller Eurostat 2023 FA A_LE/L_LE position in percent of GDP. This is a coverage and initialization proxy, not the complete national IIP. The selected EU27 aggregate is missing, so the matched-stock proxy uses GDP-weighted member positions and includes intra-EU exposure. It must not be interpreted as a consolidated extra-EU IIP. Domestic opening deposits, loans and equity remain balanced. Net receipts add foreign settlement assets; net payments add foreign funding. One quarter of excess offsetting positions unwinds each year, retaining the opening relationships. The rollover fraction and non-interest-bearing settlement balances are assumptions. Household foreign securities have their own cash yield. Gross assets less liabilities reconcile independently to net foreign assets at acquisition cost. Their annual change equals the current account. Separate currency valuation bridges to the position at current exchange rates.

Opening trade volumes are positive benchmarks consistent with normalized expenditure GDP. The website keeps trade active, with positive minimum import-share and foreign-order parameters. Physical output and funded spending still constrain sales. It does not fabricate exports during a complete production collapse.

An ad valorem tariff raises the landed import price. Import VAT is levied on border value plus duty. Households pay domestic duty to the government; foreign suppliers receive the border value. Imports and the current account exclude domestic duty. Public saving includes it, and nominal GDP includes it as a product tax. Real GDP uses opening VAT and duty rates so a tax increase is not counted as extra real production. The same constant-price correction also fixes the previous VAT-rate artifact. This is a fixed-base model volume measure, not a complete chain-linked national accounting system. Tariff defaults are zero for experiments and are not estimated national tariff schedules. Imported intermediates, product-specific exemptions, retaliation and trade-policy uncertainty are outside the model.

Primary definitions: Eurostat ilc_di12 and bop_gdp6_q; ECB HFCS 2023 tables C1/C3/J4; European Commission VAT taxable amount (https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive/taxable-amount_en); OECD tariff national accounting (https://www.oecd.org/en/blogs/2025/05/understanding-the-impact-of-changing-tariffs-on-gdp.html). Frozen files and SHA256 hashes are in HOUSEHOLD_TRADE_MANIFEST.json. Run scripts/enrich_households_trade.py after earlier profile enrichment, then tests/household-trade.mjs.

"""
text += (f"The current checks passed {household_trade['openingStates']} opening states and {household_trade['paths']} "
         f"simulation paths over {household_trade['years']:,} years. Both gross trade flows and both gross foreign stocks stayed "
         f"positive in {household_trade['surplusYears']:,} surplus years and {household_trade['deficitYears']:,} deficit years. "
         f"The largest relative accounting residual was {household_trade['maxResidual']:.2e}. "
         f"Opening Gini fitting errors were at most {household_trade['maxIncomeFitError']:.2e} for income and "
         f"{household_trade['maxWealthFitError']:.2e} for financial wealth. "
         "This improves initial-data fit and accounting; it does not establish better macroeconomic forecast accuracy. "
         "All path summaries are retained in household_trade_validation.json. Earlier studies above are archived specifications.\n\n")
text += f"""## Named event planner in engine 1.14.1

The separate event window groups direct shocks under editable names and common timing. Each annual event has a start year, inclusive full-strength duration and remaining fraction per later year. Several signed channels can be combined in one event, with 20 direct effects in total. The per-year preview uses the simulator's existing shock calculation: multiplicative percentage channels and additive policy-rate/currency offsets. It shows imposed changes, not predicted macroeconomic outcomes. Scenario events leave the reference unchanged. Saving, cancelling, exports and older flat schedules retain their meaning.

Scheduling verification: **{event_editor['status']}**, executed {event_editor['executedAt']}, covering {event_editor['paths']} simulation paths and {event_editor['checkedYears']} annual steps. Checks include exact start/end timing, fading, permanent effects, overlapping channels, invalid schedules, saved-setting and JSON replay, preserved 1.14 reference settings and identical economic row outputs with and without event metadata. No event changes outcomes before its start. The economic shock equations are unchanged, so this release makes no additional empirical accuracy claim. Full results are in event_editor_validation.json; the reproducible checks are tests/event-schedule.mjs.

"""
text += f"""## Empirical capital-input mappings in engine 1.15

2023 ECB QSA household foreign debt securities and listed shares anchor foreign order shares. VIFA look-through is available for 21 member presets; six use direct holdings of the same instruments and may understate indirect exposures. The representative EU27 uses the euro area's extra-area share, not a consolidated extra-EU observation. Foreign relative weight equals the domestic weight sum times foreign share / (1 minus foreign share). Italy's weight 150.18 corresponds to a 60.03% order-share proxy. The mapping uses stocks to initialize new annual orders; it does not estimate a behavioral response. There is no clipping at weight 100.

Financial-income tax rates divide EC DG TAXUD 2023 household capital-income receipts by Eurostat gross household property income. Bulgaria's missing denominator and the Netherlands' negative net receipts use an explicit EU27 fallback. Italy's effective proxy is 12.0656%; it is not the statutory rate on any individual security. Source taxes and income include broader concepts than the model's cash interest and dividends. The earlier wage-tax budget proxy is reduced by separately allocated capital receipts to avoid duplication.

The financial-wealth levy uses Italy's 0.20% financial-product levy / IVAFE proxy, Belgium's observed securities-account receipts / household financial assets, and Spain's observed wealth and solidarity-tax receipts / household financial assets. These uniform proxies do not reproduce exemptions, thresholds, fixed current-account charges, regional schedules or exact tax bases. Spain's real tax also covers non-financial wealth. Other member presets retain zero on the comparable modeled base, rather than an invented positive levy; this does not imply absence of real-estate, inheritance or transaction taxes. EU27 uses a GDP-weighted member proxy, not an EU-wide tax law. Separately allocated Spanish recurring wealth receipts are also removed from the broader D5 wage-tax fallback. Primary snapshots and all transformations are in capital_input_benchmarks.json, the official source manifest and scripts/enrich_capital_inputs.py.

Input, replay, annual accounts and migration checks: {capital_inputs['status']}, {capital_inputs['paths']} paths, {capital_inputs['years']:,} annual steps; largest relative residual {capital_inputs['maxResidual']:.2e}. Both gross trade flows stay positive in {capital_inputs['stress']['pathsWithPositiveTrade']} of {capital_inputs['stress']['paths']} longer paths, while {capital_inputs['stress']['pathsWithDebtAbove300GDP']} end above 300% public debt/GDP. The green question/event panel explicitly belongs to setup; a separate divider labels computed outcomes.

The following same-engine comparison uses five common seeds per preset and previously examined 2025 observations. GDP is annualized between 2023 and 2025. All 27 countries have equal weight and remain in the scores. No input is selected from these outcomes. **The updated input proxies worsen these errors; improved forecasting accuracy is not established.**

"""
text += '| Metric | Earlier RMSE pp | Updated RMSE pp |\n|---|---:|---:|\n'
for key, label in [('gdp', 'Annualized real GDP growth'), ('unemployment', 'Unemployment'), ('inflation', 'Inflation')]:
    text += f"| {label} | {capital_inputs['benchmark']['before'][key]['rmse']:.3f} | {capital_inputs['benchmark']['after'][key]['rmse']:.3f} |\n"
text += '\nAll country predictions and longer paths are retained in capital_input_validation.json.\n\n'
text += f"""## GDP income, TFP and treasury repayment in engine 1.16

The outcome panel separates gross wages, gross capital income and net production taxes at current prices. Gross capital income includes depreciation and retains negative values. Modeled business research grants are treated as production subsidies, added to operating surplus and deducted from net production taxes. The components reconcile independently to expenditure GDP. Interest, dividends, direct taxes and principal repayment do not create additional GDP. These are income shares, not causal contributions to GDP growth.

TFP level is 100 times the existing normalized productivity residual, based on real goods output, production hours, capital and the configured PWT accounting exponent. It is a within-economy index before optional settling, not an absolute cross-country PWT level or the latent firm-knowledge index. The annual outcome tables identify their first seed, separately from ensemble charts.

Eurostat 2023 nasa_10_f_bs, S13 non-consolidated assets F2 and F5 in percent of GDP, anchors treasury cash and government equity/fund holdings in all 28 presets. Italy opens with 4.7% cash/deposits and 9.5% equity/fund shares; EU27 with 8.7% and 17.6%. Governments hold liquidity for payments, and the wider F5 portfolio need not be small. It is mapped to residual book claims on domestic firms, not asserted to equal non-financial public-company ownership. Government receives its share of current dividends and capital liquidation proceeds. Household new equity dilutes the original public claim. Scripts/enrich_government_assets.py, frozen government_cash_equity_2023.json and government_asset_benchmarks.json retain the selections and source definitions.

Treasury cash above the observed opening cash/GDP ratio times lagged real GDP at current producer prices repays outstanding government bonds pro rata. This liquidity target is an assumption. No borrowing is made solely to refill it. Debt principal reduces treasury cash and outstanding household/bank bonds without becoming household income, a taxable return or bank equity. Existing excess cash can also repay bonds during a current deficit. If no debt remains, excess cash is retained as an asset rather than erased.

Separate annual and cumulative counts show payment defaults, continuing-firm restructurings, default-related exits and loan write-offs. Cumulative counts are events, not unique firms. With entry/exit active, default normally closes the firm; otherwise its debt is restructured. Minimum-population restructurings are marked in the event log. Other exits can also write off debt. A stale forced-exit flag in firms retained by the numerical floor is now cleared, and a regression verifies it cannot independently cause repeated restructurings. Default frequency is not empirically estimated. A zero final-year count can be valid even after earlier events.

Current validation: **{income_fiscal['status']}**, {income_fiscal['paths']} paths, {income_fiscal['years']:,} annual steps and {income_fiscal['openingPresets']} official opening presets. Maximum relative accounting residual {income_fiscal['maxResidual']:.2e}; maximum income/expenditure GDP gap {income_fiscal['maxIncomeResidual']:.2e} nominal units. Bond repayments occurred in {income_fiscal['redemptionYears']} checked years. The high-surplus test reduced debt from {income_fiscal['surplusExample']['openingDebt']:.2f} to {income_fiscal['surplusExample']['finalDebt']:.2f}, retiring {income_fiscal['surplusExample']['bondsRepaid']:.2f} units of principal. Severe seed-2026 tests produced 34 continuing-firm restructurings with exits off and 29 default-related exits with exits on; both final-year default counts were zero. These tests check accounting and mechanisms, not a calibrated real-world default rate.

{income_fiscal['benchmark']['protocol']} The following errors worsen slightly. No improved macroeconomic forecasting accuracy is claimed.

"""
text += '| Metric | Frozen 1.15 RMSE pp | Current 1.16 RMSE pp |\n|---|---:|---:|\n'
for key, label in [('gdp', 'Annualized real GDP growth'), ('unemployment', 'Unemployment'), ('inflation', 'Inflation')]:
    text += f"| {label} | {income_fiscal['benchmark']['before'][key]['rmse']:.3f} | {income_fiscal['benchmark']['after'][key]['rmse']:.3f} |\n"
text += '\nAll results and limitations are retained in income_fiscal_validation.json. The earlier capital-input numerical study above is reproduced with its frozen 1.15 engine so government ownership and repayment changes do not confound that comparison. Current parameter and configuration checks use the current registry.\n\n'
text += f"""## Population, schooling, retirement and housing in engine 1.17

{society['paths']} paths and{society['years']:,} annual steps passed current checks, with maximum relative residual{society['maxResidual']:.2e}. All 28opening inputs enter without clipping. Population balances, mortgage principal, pension cash, public/household/firm/financial ledgers, income/expenditure GDP and S−I=CA/NFA transactions=CA reconcile. Tests cover all 16channel combinations and parameter boundaries. There were{society['mortgageDefaults']} mortgage defaults in{society['foreclosurePaths']} paths. The year 4education-quality change first affected worker human capital in year{society['education']['firstChangedYear']}. With additions off,{society['unchangedValues']:,} shared frozen 1.16values are reproduced within numerical tolerance.

The original-mechanism numerical studies above use frozen 1.16country inputs with the additions off, or their explicitly frozen engine specifications. The current full-coverage study is separate. Every current path is retained. No coefficient was selected from the diagnostic errors below.

"""
text += '| Metric | Frozen 1.16 RMSE pp | Full1.17 RMSE pp |\n|---|---:|---:|\n'
for key,label in [('gdp','Annualized real GDP growth'),('unemployment','Unemployment'),('inflation','Inflation')]:
    text += f"| {label} | {society['benchmark']['before'][key]['rmse']:.3f} | {society['benchmark']['after'][key]['rmse']:.3f} |\n"
text += '\nGDP and unemployment errors fall; inflation error rises. These are previously examined2025 observations and definitions/coverage differ. This is not an untouched validation or proof of overall accuracy.\n\n'
text += (root/'research/SOCIETY_METHODS.md').read_text()+'\n\n'
text += f"## Foreign projection and event checks — engine 1.18\n\n{foreign_projection['paths']} paths, {foreign_projection['years']:,} annual steps; maximum relative accounting gap {foreign_projection['maxResidual']:.2e}. With projections disabled, {foreign_projection['unchangedValues']:,} common row values reproduce frozen 1.17. No forecast accuracy improvement is inferred.\n\n"
text += (root/'research/FOREIGN_PROJECTION_METHODS.md').read_text()+'\n\n'
text += f"## Filled event assumptions and presentation correction — engine 1.18.1\n\n{event_inputs['paths']} paths and {event_inputs['years']:,} annual steps passed, maximum relative residual {event_inputs['maxResidual']:.2e}. All {event_inputs['unchangedPaths']} pre-change valid paths retained exactly the same numerical rows. {event_inputs['invalidCasesRejected']} malformed inputs were rejected. The selected parameter assumptions are visible and editable alongside shocks; a different example replaces an untouched default downturn. The long social/housing outcome card is removed while its model channels remain. No behavioral coefficient or forecasting accuracy improvement is inferred. Full evidence: event_input_validation.json.\n\n"
if qa:
    text += f"## Browser verification for engine {qa['modelVersion']}\n\n" + json.dumps(qa, indent=2) + '\n\n'
text += '## Official source manifest\n\n'
for m in manifest:
    text += f"- {m['name']}: {m['dataset']}\n  {m['url']}\n  Retrieved {m['retrievedAt']}; SHA256 {m['sha256']}\n"
text += '\nPWT 11.0: CC BY 4.0; Feenstra, Inklaar and Timmer (2015), The Next Generation of the Penn World Table, AER 105(10), 3150–3182. Eurostat, ECB and BIS sources acknowledged.\n'
text = '# Current country budget allocation audit — engine 1.19.1\n\n' + (root/'research/SOCIAL_SPENDING_METHODS.md').read_text() + '\n\n## Monetary and employment audit — engine 1.19.0\n\n' + (root/'research/MACRO_POLICY_METHODS.md').read_text() + '\n\n## Historical and component studies\n\n' + text
text = (root/'research/GLOBAL_INPUT_METHODS.md').read_text() + '\n\n## Archived component and input studies\n\n' + text
text = (root/'research/EDUCATION_INCOME_METHODS.md').read_text() + '\n\n## Earlier input and component studies\n\n' + text
text = (root/'research/EDUCATION_TFP_METHODS.md').read_text() + '\n\n## Earlier education and component studies\n\n' + text
text = (root/'research/MACRO_EXTERNAL_TFP_METHODS.md').read_text() + '\n\n## Archived studies and earlier releases\n\n' + text
text = (root/'research/CONTINUOUS_TRADE_METHODS.md').read_text() + '\n\n## Earlier current-account and component audits\n\n' + text
text = (root/'research/FISCAL_DEFENSE_METHODS.md').read_text()+'\n\n## Archived studies and earlier releases\n\n'+text
text = (root/'research/DEMOGRAPHY_INCOME_FOREIGN_METHODS_1_26.md').read_text()+'\n\n## Earlier fiscal and component studies\n\n'+text
text = (root/'research/GROWTH_INFERENCE_METHODS_1_27.md').read_text()+'\n\n## Historical1.26 and earlier studies\n\n'+text
text = (root/'research/CREDIT_POLICY_METHODS_1_28.md').read_text()+'\n\n## Historical1.27 and earlier studies\n\n'+text
text = (root/'research/PARTICIPATION_PRICE_FISCAL_METHODS_1_29.md').read_text()+'\n\n## Historical1.28 and earlier studies\n\n'+text
text = (root/'research/TARIFF_FISCAL_METHODS_1_30.md').read_text()+'\n\n## Historical1.29 and earlier studies\n\n'+text
text = (root/'research/RETIREMENT_PENSION_METHODS_1_30_1.md').read_text()+'\n\n## Historical1.30 and earlier studies\n\n'+text
(data / 'VALIDATION_REPORT.md').write_text(text)
(root / 'research/METHODS.md').write_text(text)
out = data / 'innovation_observatory_source.zip'
files = [root / 'README.md', root / 'package.json']
compressed_fixtures=set(json.loads((root/'research/archived_fixtures_manifest.json').read_text()))
current_proof = root / 'research/browser-participation-costs-1_29.jpg'
for folder in ['dist', 'tests', 'scripts', 'research']:
    files += [p for p in (root / folder).rglob('*') if p.is_file() and p != out
              and str(p.relative_to(root)) not in compressed_fixtures
              and not (p.parent==root/'research/fiscal_reconciliation/usa' and p.suffix=='.xlsx')
              and p not in [root/'research/macro_policy/baseline.json',root/'research/social_spending/before.json']
              and (p.suffix != '.zip' or p == root/'research/education_quality_candidates/hci_csv.zip')
              and (p.suffix.lower() not in ['.jpg', '.jpeg', '.png'] or p == current_proof)
              and not (p.parent == root/'research/education_2026' and (p.suffix == '.dta' or p.name.endswith('.dta.xz') or p.name in ['hci_plus_index_panel.csv','catalog_hci_plus_index_panel.csv']))
              and not (p.parent==root/'research/dynamics_audit_1_26/income_evidence' and p.suffix in ['.dta','.pdf'])
              and p not in [root/'research/demography_1_26/eurostat_pensions_missoc.pdf',root/'research/sovereign_foreign_1_26/fed_x4.pdf',root/'research/fiscal_reconciliation/engine_1_24.tar.xz']
              and p.suffix not in ['.pyc', '.gz'] and '__pycache__' not in p.parts]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for p in sorted(set(files)):
        archive.write(p, 'innovation_observatory/' + str(p.relative_to(root)))
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
assert out.stat().st_size <= 25 * 1024 * 1024, 'Downloadable source exceeds the hosting per-file limit.'
print(json.dumps({'controls': audit['controls'], 'auditedFixedPricePaths': total,
                  'sourceFiles': len(set(files)), 'archiveBytes': out.stat().st_size,
                  'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}, indent=2))
