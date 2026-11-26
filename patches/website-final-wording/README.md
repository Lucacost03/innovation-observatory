# Innovation Observatory — engine 1.31.0

Private, browser-local research simulator of innovation, firm turnover, foreign knowledge adoption, household investment and stock-flow-consistent accounts. It provides 30 starting presets (27 EU countries, one representative EU aggregate, the United States and China), permanent firm IDs, time-varying controls, paired seeded experiments, changing network snapshots and data/assumption audits.

**Accounting and software tests pass. Accurate macroeconomic forecasts, realistic long-run dynamics and causal policy multipliers have not been established.** Failed and extreme paths remain visible.

Innovation Observatory is independent of Econometrics Lab. The shared launcher and cross-site navigation were removed after the model and browser checks. Existing access settings are preserved.

## Current payroll-tax counterparty correction — 1.31

Worker-tax reconciliation now returns preliminary withholding to its actual wage recipients. Extra requests use the same wage recipients, respect own cash and remaining gross payroll, and disclose uncollected revenue rather than shifting it onto unrelated asset holders. EU business-income-tax controls also now affect the fiscal bridge where a zero legacy reference had disabled them; zero settings remove represented receipts. This changes payment and control logic; it adds no new tax coefficient and leaves opening empirical data and aggregate tax targets unchanged.

The all30-preset paired comparison uses five common seeds, 120/12-year horizons and retirement/tax interventions. It checks actual household cash before and after settlement, full sector/GDP/saving/external/debt identities, and unchanged opening observations. The revised macro diagnostics are mixed and are not an untouched forecasting test. Initial disposable-income Gini remains a proxy for gross earnings heterogeneity; the correction does not fix every later inequality outcome or the extreme long-run paths.

Run `npm run test:payroll` after restoring fixtures. Full results, every country error and limitations are in `dist/data/revision131_validation.json` and `research/PAYROLL_TAX_METHODS_1_31.md`. Earlier studies replay their retained engines. Saved1.30/1.30.1 inputs and intervention schedules are preserved. Deployed modules and the simulation worker share a release identifier to prevent mixing old cached modules with the new engine; `npm run test:runtime` reproduces and tests this cache boundary.

## Historical retirement and pension reporting audit — 1.30.1

Pension funding now allocates a share of final collected worker taxes after fiscal reconciliation, rather than preliminary withholding. This corrects the funding memo without changing economic transactions, GDP, public debt or any source input. The allocation remains an assumption, not an observed pension-fund balance.

Retirement comparisons in the existing population/pension outcome details show labour supply, benefit costs, funding, debt and an exact real-GDP spending decomposition. Findings distinguish isolated age changes from combined interventions. Lower eligibility does not force a particular GDP sign: labour supply, demand and financing interact. No participation coefficient was fitted or changed.

Run `npm run test:retirement` after restoring fixtures. The audit covers every preset, common-seed retirement comparisons, participation sensitivity and 120-year stress paths. It verifies exact economic-path parity with frozen 1.30.0 and corrects only the two pension reporting fields. Saved 1.30.0 edits and event schedules are retained. Full outcomes and limitations: `dist/data/revision1301_validation.json` and `research/RETIREMENT_PENSION_METHODS_1_30_1.md`.

## Historical tariffs and fiscal correction — 1.30

Every preset has an empirical effective2023 goods tariff (customs duties / goods imports). National EU averages include duty-free intra-EU goods; EU27 uses external imports. EU institutions receive the customs duty, with25% collection compensation retained nationally. The net external settlement enters the fiscal and external ledgers; existing coverage is reclassified to avoid double counting. Source-matched opening imports and CA are preserved.

The starting economy remains2023. Newer observed fiscal references are visibly separate from simulated outcomes. Published2024–25 capital fiscal shares replace perpetual repetition of exceptional opening spending; afterwards the latest share is an explicit continuation assumption. This is conditional historical information, not an as-of2023 forecast. China's missing current/capital split and Denmark's unavailable2025 revenue remain missing. Public debt/GDP changes have an exact deficit, financing and GDP-denominator breakdown. Graph variables are alphabetized and fiscal/tooltip dates include calendar years.

Run `npm run test:revision130` after restoring shared fixtures. All30 presets, legacy replay, capital-source timing, source-input migration and tariff shocks are covered. The conditional fiscal diagnostic improves slightly; overall predictive accuracy is not established. Detailed methods, all errors and source URLs are in `research/TARIFF_FISCAL_METHODS_1_30.md` and `dist/data/revision130_validation.json`.

## Historical participation, imported-cost and fiscal audit — 1.29

Participation now uses country-specific 2023 age bands, reweighted as cohorts change. One bounded calibration preserves the chosen opening aggregate. China replaces an age-15+ proxy with the ILOSTAT 15–64 estimate of 75.202%; its opening employment-within-labour-force rate remains an assumption. Future within-age activity is held fixed as a composition-only scenario.

Foreign border prices converted to domestic currency partly feed producer prices, replacing the old nominal-FX-only term. Producer prices feed back into real trade competitiveness. The common pass-through remains an assumption because national exposure coefficients could not be verified. No neutral current account, intermediate payment or extra GDP is imposed. Deficit/GDP is total expenditure minus total revenue over current nominal GDP; positive means deficit, negative surplus. Bond principal repayment remains financing.

The 450-path, 11,760-step comparison passes accounting, timing and network checks. It does **not** improve overall retrospective forecast fit: 29-country GDP RMSE changes 3.7014 to 3.7456 percentage points; current-account RMSE changes 2.7522 to 2.7546 points of GDP. Fifteen country GDP errors worsen. All misses remain. These revised 2024/25 comparisons were already examined; they are not an untouched holdout. The 120-year runs are stress tests, not forecasts.

Run `npm run test:revision129` after restoring compressed fixtures. Rebuild source mappings with `python3 scripts/integrate_1_29.py` after the 1.28 integration. The source extraction comparison is pinned to frozen 1.28 inputs. Source flags, missing exposure values, complete simulation comparisons and browser replays are retained. Detailed methods are in `research/PARTICIPATION_PRICE_FISCAL_METHODS_1_29.md`.

## Historical policy, trade and credit audit — 1.28

Central-bank decisions use instrument increments: normally0.25percentage points,0.10for China's7-day repo convention. The US target range is shown with its midpoint used in transmission. Opening observed quotes and off-quarter anchors are preserved. One model year may span several decisions; this is an annual scenario rule, not an estimated central-bank meeting model. Commercial spreads and contract repricing remain separate. Policy level charts show the first paired seed as held-rate steps, with95% seed-spread bands; Difference mode retains mean paired confidence intervals.

Exports and import competition already use nominal currency strength adjusted by domestic/foreign prices. All30 presets pass appreciation/depreciation signs and the case where inflation offsets nominal depreciation. The index is a model producer-price basket, not an observed BIS CPI-based REER.

New business capital must be paid for, with actual financing and matching producer receipts. Eligible home buyers can preserve liquidity while borrowing. The mortgage financing share is an opening stock/collateral proxy, not an observed new-loan LTV or estimated preference. Purchase budgets, LTV, income, down payments and lender capital constrain credit. Independent annual private-debt stock/flow and debt/GDP denominator bridges explain declines without imposing a floor. Modelled private debt excludes consumer credit and other unmodelled national liabilities; opening business leverage remains assumed.

The600-path,26,640-step frozen1.27/current1.28 comparison uses all30 presets and10 matched seeds:3 pairs run120years,7run12. Pooled29-country GDP RMSE changes3.7205→3.6960pp and CA RMSE2.8179→2.7867ppGDP. Gains are small; CA MAE and the overlapping EU27 GDP comparison worsen slightly, and11 country GDP errors worsen. Revised2024/25 observations were already examined, not untouched holdout. The120-year runs are structural stress tests beyond published projections, not forecasts: paths ending below1% modelled private debt/GDP fall77/90→9/90, while10 corrected paths still exceed300% at some point. No minimum debt target is imposed. Full misses and limitations remain in`dist/data/revision128_validation.json`.

Run`node tests/credit-policy.mjs`, `node tests/revision128.mjs` and`node scripts/build_revision128_summary.mjs`. Rebuild conventions with`python3 scripts/integrate_1_28.py`after the1.27 integration. The earlier450-path prototype predates the final purchase-budget safeguard and is frozen independently as1.28.0-prototype; its results are not the final release score. Historical1.27 studies now use their own frozen engine and inputs.

## Historical GDP and inference audit — 1.27

PWT11.0 annual hours2013–2023 replace the common115% hours ceiling with each country's historical maximum /2023 level; using historical hours as future limits is a proxy assumption. This addresses an overly rapid hours expansion, not an excessive opening human-capital level. Turning education off leaves early GDP essentially unchanged; its channel is retained. Other consumption and initialization trials were rejected after worsening GDP error. A random-link network trial provides negligible gain, so topology is retained. Link repair, identity and degree checks pass; empirical topology calibration is unavailable.

The600-path,12240-step comparison uses10 paired seeds across all30 presets;3 seeds run40years and7 run12. On58 previously examined country/horizon GDP comparisons,29 countries pooled, RMSE changes4.3573→3.7205 percentage points and MAE3.7076→2.8722. EU27 is separate. Current-account RMSE worsens2.5553→2.8179;13 countries have worse GDP errors, including USA and China. This is retrospective diagnostic improvement, not universal or out-of-sample forecast validation. All country misses and long-run stress paths remain visible in`dist/data/revision127_validation.json`.

Real GDP per capita growth is100×((realGDP_t/population_t)/(realGDP_(t−1)/population_(t−1))−1), in percent per year. It replaces the initial-cohort knowledge outcome. The internal knowledge diagnostic remains for engine compatibility. Opening growth without a preceding observation is unavailable, not a fabricated zero.

Level charts use empirical P2.5–P97.5 seed bands. Difference mode and headline cards use mean paired effects with pointwise95% Student t intervals. One final-year real-GDP percentage effect per seed is the primary test; years are not independent replicates. Secondary outcomes/years are exploratory, without multiple-testing correction. Intervals assume independent seed pairs and approximately normal mean effects; small or skewed samples can be unreliable. Zero-variance and single-seed samples have no invented t-test p-value. These quantify conditional Monte Carlo uncertainty, not data/parameter uncertainty or causal real-policy confidence. Numeric checks compare199 critical values and49 probabilities to independent SciPy results.

Run`node tests/inference.mjs`, `node tests/revision127.mjs` and`node scripts/build_revision127_summary.mjs`. Rebuild hours inputs with`python3 scripts/integrate_1_27.py`after the1.26 integration steps. The frozen1.26 engine and its input profiles are preserved independently. Earlier1.26 study scripts are pinned to those sources.

## Firm network size display

Circle area is proportional to real productive capital. A common scale across all years of the displayed scenario makes firm growth visible over time; the legend reports real model units. Individual node sizes are not clipped. Colour still represents technology, with rings for events. This presentation change does not alter any model equation, data input or simulation result.

## Run

The downloadable source losslessly compresses repeated historical fixtures and larger raw research responses; run `python3 scripts/unpack_source_fixtures.py` before standalone source audits or integration. `npm test` restores them automatically.

No JavaScript dependencies or build step are required. With Node18+ and Python3 (standard library for fixture restoration and fiscal source checks):

```sh
npm test
node tests/revision126.mjs
node scripts/build_revision126_summary.mjs
node scripts/build_audit.mjs
python3 scripts/check_global_sources.py
python3 scripts/check_macro_sources.py
python3 scripts/package_source.py
```

The current release suite covers all 30 presets, education-source mappings, two-income shares, archived compatibility paths and current-account comparisons, controlled startup comparisons, saved settings, timed events, underwater house sales, finance, foreign assets and trade. Earlier study scripts/reports remain in the source archive. `test:prior-study-scripts` is the preserved prior command list; several scripts intentionally compare obsolete input values or byte fingerprints, and are not the release suite for changed presets. Their dated accuracy tables remain historical records.

Rebuild empirical mappings offline (Python with pandas/openpyxl): `python3 scripts/build_foreign_pools.py`, then `python3 scripts/integrate_global_inputs.py`, then `python3 scripts/integrate_education_quality.py`. Then run `python3 scripts/integrate_macro_external.py` and `node scripts/calibrate_export_orders.mjs`. Finish with `python3 scripts/integrate_fiscal_accounts.py`, `python3 scripts/build_fiscal_reference.py`, `python3 scripts/integrate_defense.py`, `python3 scripts/integrate_1_26.py`, `node scripts/calibrate_fiscal_coverage.mjs` and `node scripts/build_audit.mjs`. The retained age/participation source projections can be regenerated with `research/demography_1_26/extract.py` and `extract_post_participation.py`. The education step restores learning anchors; the macro step restores GDP-share/current-account calibrations, and the last step fits unobserved opening export orders using only the 2023 snapshot. Source verification is separate from forecast validation.

To use locally, serve the static folder over HTTP:

```sh
python -m http.server 8080 --directory dist
```

Open http://localhost:8080. File URLs cannot load the modules/worker. This local server has no authentication; hosted access is restricted by the existing Site policy.

## Annual ageing, pension policy and foreign public creditors in 1.26

Population age composition now changes through annual ageing of country-specific cohorts, births, mortality and migration. Statistical working age (15–64), pension eligibility and labour participation are separate. **Pension eligibility age** is editable in the main controls and in dated policy timelines; a +2 years from year 5 example is provided. Source references are dated 2023, with sex/career/early-benefit distinctions shown. Legal eligibility is not actual retirement. European older activity uses observed age-band rates; USA and China use retained ILOSTAT estimates. Future mortality/migration profiles and reform participation responses remain explicit assumptions.

The opening labour-income share now uses the same production-tax coverage as later years. In the published US default example, about 2.55 of the 3.44 percentage-point opening jump was a denominator discontinuity. Correcting it changes measurement alone, with exact unchanged GDP/wage paths in the isolated test. Remaining payroll/value-added movements are model results, not verified wage forecasts; PWT is a self-employment-adjusted basic-price proxy.

Government borrowing can be bought abroad. Source opening holdings distinguish verified bonds, other external debt and missing instrument detail. Issuance and principal repayment have matched external settlement assets and do not themselves change CA; coupons abroad enter CA once. Foreign funding does not have to equal a current-account deficit. EU27 extra-EU opening coverage remains unavailable, not an observed zero. Complete national IIP coverage is not claimed.

The outcome details show changing age composition, pension eligibility, foreign public creditors and an exact spending decomposition of each seed's largest GDP decline. Inventory, final demand, paid hours and finance can move output even while technology rises; these movements are not established normal business cycles. The all-country comparison to independently frozen 1.25, three matched seeds and 40 annual steps has mixed retrospective forecasting results; full current scores and weak paths are retained in `dist/data/revision126_validation.json`. An unrelated opening-market-share alignment trial worsened GDP errors and was rejected. No future observations were used to fit coefficients. Full methods: `research/DEMOGRAPHY_INCOME_FOREIGN_METHODS_1_26.md`.

## Fiscal coverage and defence in1.25

All30presets now include an official2023 general-government revenue/expense ledger, source definitions and separate2024/25references. Common opening2023 is retained to match capital and employment data; it is not labelled current2026. Unknown observations stay missing. BEA, ESA and MOF scopes are not treated as identical statistics.

US Medicare/Medicaid financing was absent from consumption funding, while opening disposable income contained noncash benefits. Restricted third-party purchases now fund those services without giving households cash. The income anchor removes those benefits and net owner rental income (a partial cash proxy). Broader receipts/current expenses use a disclosed cash-equivalent fiscal bridge, calibrated only to2023 fiscal moments. Capital financing supports investment already counted and adds no second GDP amount. Noncash public-pension interest accrues a matched claim/liability. Sector counterparts, public-asset ownership and future share continuation remain simplified assumptions.

The matched five-seed2024/25 diagnostic improves USA GDP-growth RMSE from2.96to0.94percentagepoints, pooled29-country GDP RMSE from4.37to4.35and current-account RMSE from2.69to2.54. Some country errors increase; weak and extreme long-run paths remain. This is revised-data retrospective analysis, not an untouched holdout or validated forecast. Exact results: `dist/data/fiscal_reconciliation_validation.json`.

Defence services are separated within existing government consumption; source allocations alone leave GDP unchanged. The defence R&D example adds an explicitly assumed signed change to existing public research once, requesting financed paid researcher time. Public business-research allocation is a proxy for additional defence funding. No automatic TFP bonus, universal private-R&D crowd-in coefficient, or fabricated Chinese military R&D level is imposed. Source definitions and missing splits: `dist/data/defense_benchmarks.json`.

The downloadable source losslessly packs repeated archived fixtures into `research/archived_fixtures.tar.xz`; `npm test` restores missing members with SHA256 verification. Original fixtures remain in Git. Large optional raw BEA workbooks remain in Git and are omitted from the25MiBdownload; complete extracted observations, coordinates, source URLs, raw hashes and the extractor remain. To re-extract BEA, fetch those exact optional files from their manifest URLs; the normal release tests run offline without them. The existing archived source-study optional dependency requirements are unchanged.

## Continuous export competition in 1.24

Four large foreign bid brackets previously caused abrupt export jumps under almost invisible price changes. Source presets now use continuous bids with the same order volume and mean bid, while higher offers still receive scarce goods first. The old rule remains available as `continuousForeignBids=0` for comparison. The distribution is an assumption.

All 30presets × 5 seeds × 2 rules × 40 years were compared. Across 29 individual countries, retrospective current-account MAE falls modestly from 2.004 to 1.987pp of GDP; real GDP growth RMSE is effectively unchanged (4.370→4.369pp). Long-run outcomes remain mixed, including more low-employment years in this study. Full country results and limitations are in `dist/data/trade_bid_validation.json` and `research/CONTINUOUS_TRADE_METHODS.md`. This is a numerical correction with a modest retrospective fit gain, not a validated forecasting model.

## Current accounts and comparable TFP in 1.23

Opening 2023 current accounts now match IMF BOP/WDI: USA −3.34895%, China +1.40681%, and constructed EU member aggregate +2.58232% of GDP. The Evidence table also displays later observations separately from the simulation. The complete observed goods/services net balance is retained; only offsetting common gross trade is scaled to 5%. This remains a composite final-good coverage proxy. Government consumption and investment now use actual GDP denominators, with opening inventory investment. Annual benchmark flows are not applied a second time to opening stocks.

A factor-of-100 China R&D mapping error is corrected: 2592.22bn CNY business R&D /126058.2bn CNY same-vintage GDP ×100 =2.05637% GDP. The previous205.9% value was silently clipped at runtime to10%. Source presets are now tested against all bounds.

Other net primary/secondary income and transfers are calibrated as CA less net goods/services trade, allocated to households as a proxy. Future payments scale with lagged nominal GDP and require cash. New foreign settlement income is signed: foreign funding costs interest, so debt-financed portfolios do not create free net yield. S−I=CA and annual acquisition-cost ΔNFA=CA remain independently reconciled. Currency valuation is separate.

The home knowledge frontier uses the same country-specific OECD conditional path transformation as foreign donors, with explicit missing-national fallbacks. Historical 2013–2023 PWT TFP growth is2.25254% China,.52934% USA,.18917% constructed EU mean. This history does not guarantee future rankings. Firm-technology TFP and the existing output-based TFP residual are reported separately; neither equals national PWT TFP coverage.

The FX reference can gradually follow completed relative price levels rather than staying at an arbitrary nominal100 under divergent inflation. Its0.15 speed is an unestimated PPP scenario. Full methods, source definitions, retrospective comparison and retained failures are in `research/MACRO_EXTERNAL_TFP_METHODS.md` and `dist/data/macro_external_validation.json`.

## Latest learning data and stronger education transmission in 1.22

All 29 national education presets now use the World Bank HCI+ 2026 release, 2025 estimates, with actual learning-assessment years shown separately. The constructed EU27 learning score is 504.4, the US is 509.8 and Italy is 500.1. China's national 441 still extrapolates 2015 data; the much higher PISA 2025 results of Beijing, Shanghai, Jiangsu and Zhejiang are shown separately as regional evidence on a different scale. They are not substituted for all China. The current source checks include pre-primary years in the revised HCI+ LAYS definition.

**Education effect on innovation and adoption** controls how strongly changes in workforce skills affect funded research and learning from domestic/foreign technology. The **Education & innovation** experiment uses strength 2 from year 1 and improves school quality by 50% from year 4. Existing workforce-entry delays still apply. The stronger value is an unestimated scenario assumption; country data presets retain strength 1. It does not multiply GDP or TFP directly. The new chart follows the actual skills multiplier, and findings describe its observed role in each run.

The stronger-channel study passed 125 paths and 4,925 years, plus 1,800 controlled firm comparisons. Final technology was higher in all 60 paired reform cases, while GDP was lower in three and the TFP residual lower in one. This is mechanism sensitivity, not an empirical forecast improvement. The 129-path income/source study and the existing release regressions also passed. The source refresh preserves relative saved quality settings and targets. Methods: `research/EDUCATION_TFP_METHODS.md`.

The current integrator uses frozen Catalog/repository CSV panels (lossless XZ compression) and an exact projection of the official assessment metadata. The large Stata intermediates are retained in Git, with retrieval URLs and hashes, and omitted from the downloadable source bundle; the offline integration and tests run without them. The archived 2020 integrator is retained separately for the historical study.

## Two income shares and country learning anchors in 1.21 (historical)

The outcome table and share charts show only labour and gross capital income. Both percentages use their combined total, labelled **GDP income excluding net taxes**, so they sum to 100%. Market-price GDP still includes net production taxes in the accounting ledger and exports; those taxes are not reassigned to capital. Negative components remain visible. Shares are undefined when combined income is nonpositive.

World Bank HCI 2020 harmonized learning scores now anchor all 29 national education presets; EU27 uses a disclosed child-population-weighted proxy. The quality index is score / 625, following the World Bank learning-adjusted schooling convention. Most underlying assessments are from 2018; Cyprus and China's source metadata are 2015. China's 441 is an extrapolated national estimate, not the high-scoring PISA provinces substituted for the country. The scores are learning outcomes, not causal teaching-effectiveness measurements or current 2023 test results.

National scores do not identify public/private quality differences. Both funding channels use the national anchor with an explicit sector-allocation fallback. Relative resource improvements retain the existing education response and learning delay; current adult human capital remains the separate PWT input. This release does not add a test-score-to-GDP coefficient. Legacy quality settings and timed targets are scaled to preserve their relative changes; current experiments retain their edited levels.

The income/education study passed 129 paths and 5,070 annual steps. Across all 30 presets, shared economic values reproduce the frozen 1.20 engine within numerical tolerance; the two rebased share fields intentionally differ. Relative education reforms retain their year-14 first effect with a year-4 intervention and the existing ten-year lag. Source checks reproduce 87 workbook/CSV values and 29 learning-adjustment identities. These establish data fidelity and accounting, not improved forecasting accuracy. Methods: `research/EDUCATION_INCOME_METHODS.md`; results: `dist/data/education_income_validation.json`.

The downloadable source bundle keeps code, frozen engines, raw data, methods, tests and the current browser proof. Older proof images remain in Git history and are omitted from that bundle to stay below the hosting per-file size limit. Packaging validates both ZIP integrity and the size limit before publication.

## Global inputs and firm entry in 1.20

All 30presets now have a transparent input audit. European source arithmetic was independently rechecked;20unemployment-benefit replacement scales now preserve the observed cash flow using the updated age15–64employment denominator. Source-value and parameter-value metadata are separate. Country coverage counts are refreshed.

US inputs use coherent frozen Federal Reserve2023accounts, OECD/BLS labour and inflation, PWT and matched national sources. China uses NBS, UN, MOF and PBOC with vintage/scope distinctions retained. Unknown behavioural responses, portfolio choices and some housing/pension stocks remain explicitly labelled assumptions. China uses an age15+ national employment proxy and an assumed national unemployment rate; it does not mix urban-only unemployment into that identity. Projection paths remain conditional future inputs.

Every foreign pool excludes the home economy. US and China substitute EU27 for the domestic donor; named sources and ROW have disjoint membership. Aggregation and OECD coverage are rebuilt for each preset.

Startup mean size is anchored to the opening economy. A mean-preserving distribution replaces the average-as-minimum rule; incumbent grouped-size dispersion is a disclosed proxy for the missing entrant distribution. Exact funding costs reflect discounted liquidation assets. Funding and capital rejections are distinct. The model still uses pooled household equity for entrants and does not represent all founder/debt channels. It does not force VC or entry to rise.

Long simulations exposed an existing underwater-house sale bug. Sellers must fund any mortgage repayment above sale proceeds; otherwise the offer is limited. This prevents negative deposits and corrupted pension units. No education response coefficient was adjusted.

Current reports: `dist/data/global_model_validation.json`, `startup_funding_validation.json`, `global_input_coverage.json`, `global_input_sources.json` and `foreign_pools.json`. Methods and explicit limitations: `research/GLOBAL_INPUT_METHODS.md`.

## Filled assumptions and shorter outcomes in 1.18.1

The event planner now displays the selected experiment's real parameter paths alongside outside shocks. Population, education, pension contributions, tariffs and the other parameter-based examples have filled targets, timing and assumptions in the same window. A compact Effects and assumptions summary also appears under the selected question. Apply saves both paths and shocks; Cancel discards the draft.

The default downturn is offered only when there are neither parameter paths nor saved shocks. Selecting another example replaces that untouched draft, preventing an unintended downturn from remaining alongside a production/export boost. Existing edited or saved events still combine explicitly. Named examples have a Restore inputs action; new effect channels start with readable, nonzero illustrative values. Zero remains an intentional valid input. Blank, null and boolean shock/target values are rejected instead of being coerced to zero.

The long Population, pensions, education and housing outcome card and its renderer are removed. All four model mechanisms, controls, metric series, source notes and sector accounts remain. This is a presentation change, not deletion of the economic channels.

`tests/event-inputs.mjs` passed 68 paths and 1,584 annual steps, with maximum relative accounting gap 1.66e-14. All 56 pre-change valid paths retained byte-identical complete numerical rows, using 28 countries and two seeds. Thirty malformed inputs were rejected. Named-event scheduling and configuration tests also passed. These checks verify faithful input handling and accounting; no behavioral coefficient changed or forecast-error improvement is claimed. `dist/data/event_input_validation.json` retains every comparison, including unintended versus explicitly selected assumptions.

## Annual foreign productivity projections and filled examples in 1.18

Country presets now enable annual OECD EO117 long-term productivity projection proxies through 2100. US, Chinese and rest-of-world growth vary by year and six selectable scenarios; changing scenario affects future growth without resetting accumulated levels. A new Foreign productivity experiment and three event channels support positive/negative growth surprises, overlapping effects and recovery. Donor and growth charts distinguish source paths from applied shocks. Domestic adoption retains its completed-history delay.

OECD publishes trend labour efficiency, converted to a Hicks-neutral productivity multiplier using its 0.67 labour share, then linked to the PWT opening anchors. This is a cross-source TFP proxy. The rest-of-world path excludes USA/China and uses 47 covered countries representing 74.99% of the opening 118-country PWT pool's PPP output; covered evolution proxies the missing forecasts. After 2100 the last growth rate repeats as a labelled assumption. No automatic forecast revisions or domestic feedback into the source paths are invented.

The event planner opens with a populated, unsaved downturn example when there are no events. All examples have timing and nonzero effects. Apply saves the draft; Cancel preserves the experiment. Saved events reopen unchanged.

The source vintage is 2025/2026, not information available in 2023. Prior historical error comparisons keep this option off. No improvement in forecasting accuracy is claimed. Reproduction, transformation and behavior details are in `research/FOREIGN_PROJECTION_METHODS.md`; current executed checks are in `dist/data/foreign_projection_validation.json`.

## Population, education, pensions and housing in 1.17

All 28 new/reset country presets activate population change, public/household-funded education, public and funded private pensions, and housing with mortgages. The outcome panel follows the shared annual timeline and scenario/reference selector. New presets demonstrate population decline, better education, housing/rates and funded retirement saving. Assumption links open the relevant controls. Recorded net wealth now has a complete distribution alongside income and financial assets.

- Population uses observed 2023 births, deaths, net migration, age shares and mortality allocations. Three cohorts change the labor-force scale; GDP per person is separate from total GDP. Participation, age transitions and migrant composition remain assumptions.
- Education reuses funded purchases. In the historical 1.17 engine, public and household quality multipliers started equally at 1; version 1.21 replaces them with country-specific learning anchors and labels the sector-allocation fallback. Lagged learning raises incoming workers’ human capital and labor efficiency. The year 4 quality experiment first affects workers in year 14 with the 10-year default lag.
- Public pensions replace part of flat social support, while their contribution line earmarks existing worker withholding. Private funded claims have matching firm stakes and cash, with contributions, investment income, principal withdrawals, losses and liquidity limits. Most stock ratios retain an explicit 2021 source year; DB guarantees are not modeled. Investment income accrues to household saving before it is spendable.
- Dwelling structures and construction are carved out of existing capital/investment. Households can acquire homes or rental property using cash and policy-linked mortgages, subject to collateral, income and shared lending capacity. The model includes actual/noncash housing services, housing prices, rent, repayments, foreclosure and losses. Existing-house sales and appreciation are not GDP. Structures exclude land; opening term-funding residuals are paired financial claims, not invented deposits.

The separate 1.17 study (new foreign projection option off) passed 457 paths and 9,112 annual steps, maximum relative gap 6.29e-14; 10 mortgage defaults occurred in 7 paths. The new mechanisms off reproduce 63,504 shared 1.16 values. The old numerical studies isolate original mechanisms with the additions off; current full-coverage tests are separate. GDP-growth RMSE changes 4.816 → 3.878 pp, unemployment 4.145 → 2.752, inflation 1.906 → 2.171. The previously examined 2025 comparison improves two series and worsens inflation. Sector coverage differs, and there is no untouched holdout or demonstrated overall forecast validity.

Definitions, equations, funding logic, source limitations and reproducible paths are in `research/SOCIETY_METHODS.md`, `dist/data/society_benchmarks.json` and `dist/data/society_validation.json`. `scripts/integrate_society_inputs.py` follows the population/education and housing/pension extractors. No response coefficient was selected from these diagnostic errors.

## GDP income, TFP and government assets in 1.16

The outcome panel reconciles nominal GDP to gross labour income, gross capital income (operating surplus) and net production taxes. Gross wages include production and research labour. Capital income retains depreciation and can be negative; it is not household dividends or interest. Business research grants are treated as production subsidies in this model, added to operating surplus and subtracted from net production taxes. Direct income taxes, dividends, interest and debt principal do not add to GDP. These are accounting shares of GDP, not causal contributions to GDP growth.

TFP level is 100 times the existing model productivity residual, normalized before any optional settling. It uses real goods production, production hours, capital and the configured PWT accounting exponent. It differs from firms' latent technology and is not a cross-country absolute PWT TFP measure. The shared annual slider and scenario/reference selector show one identified seed; the charts retain ensemble summaries.

Government cash is not assumed to be zero. Eurostat records treasury cash and deposits used for daily payments, as well as equity and fund holdings. The frozen 2023 general-government asset selections use `nasa_10_f_bs`, non-consolidated sector S13, assets F2 and F5, percent of GDP. All 28 presets match those selections at opening. Italy has 4.7% of GDP in cash/deposits and 9.5% in equity/fund shares; EU27 has 8.7% and 17.6%. F5 is broader than ownership of non-financial public companies and is not necessarily small. Its mapping to residual book claims on modeled firms is a proxy. New household equity dilutes legacy government claims. The government receives its funded share of dividends and residual liquidation proceeds. Dividends are current income; liquidation proceeds are capital transactions.

After annual settlement, cash above the treasury liquidity target retires outstanding public bonds pro rata from household and bank holders. The target preserves the observed opening cash/GDP ratio against lagged real GDP at current producer prices. It is an assumed cash-management rule, not an estimated fiscal reaction function. The government does not borrow simply to fill the target. Repayment reduces both the treasury balance and the stock of bonds. Household principal receipts are neither income nor taxable returns; bank principal receipts do not create bank equity. Existing excess cash can finance repayments even in a current-deficit year. Once all debt is repaid, remaining cash stays recorded as an asset.

The former 'financial restructures' metric counted firms reaching payment default, not all loan write-offs. With entry/exit active, payment default normally closes a firm; with fixed firms, debt is written down while the firm continues. A numerical minimum-population constraint can also require a restructuring. These cases now have separate annual and cumulative counters and event-log entries. Cumulative counts are events, not unique firms. A zero final-year count can coexist with earlier distress. Consecutive unpaid-interest years trigger default; the probabilities and frequencies are not empirically estimated. Other firm closures can also cause loan losses. A retained failed firm's stale forced-exit flag now clears after its one restructuring.

`tests/income-fiscal.mjs` passed 371 paths and 8,372 annual steps, including 168 forty-year baseline/event paths, all 28 official opening selections, income/expenditure GDP, public principal repayments, government/household/financial ledgers, S−I=CA and annual NFA transactions=CA. The maximum relative accounting residual was 2.20e−14. The high-surplus example retired 70.27 units of bonds, reducing debt from 134 to 63.73. Severe seed-2026 tests produced 34 continuing-firm restructurings with exits off and 29 default-related exits with exits on; both final-year default counts were zero. These are stress diagnostics, not an estimated real-world failure rate.

The three-seed comparison with frozen engine 1.15 uses previously examined 2025 observations. RMSE worsened slightly: real GDP growth 4.779 → 4.816 pp, unemployment 4.116 → 4.145 pp, inflation 1.896 → 1.906 pp. The changes improve accounting coverage and reporting, and fix a demonstrated flag bug; improved forecasting accuracy is not established. Full country paths, definitions, source mappings and limitations are in `income_fiscal_validation.json` and `government_asset_benchmarks.json`. The older capital-input comparison is reproduced with frozen engine 1.15; current input and configuration checks still use the current registry.

## Time and labor

Each step represents one model year. Year 0 uses the 2023 opening snapshot when settling is zero. GDP and the active labor force each start at 100 model units. Employment and unemployment are percentage shares of that labor force.

The engine uses annual Eurostat job loss and job finding proxies conditioned on remaining employed or unemployed. Firms can transfer continuing workers between vacancies. Hires from opening unemployment depend on vacancies, the job finding rate and available payroll funding. Hours adjust after matching. A separate check verifies the firm, household and labor-force totals.

Government borrowing settles executed purchases after consumption payments and VAT receipts. The supply-shock regression test compares borrowing with goods actually delivered.

## Public purchases, interest and sector saving

**Public demand scale** changes planned government purchases after the opening snapshot. The opening composition uses the country’s public final consumption share of domestic uses. Transfers and interest have their own rules. In the country presets, the public budget base follows real government consumption growth over 2014–2023 as a trend assumption. The optional trend weight lets part of the budget respond to the preceding year’s GDP. Executed purchases remain limited by actual production and inventories.

The same current-year central bank decision feeds into the effective business loan rate and the quote for new public borrowing. The business loan quote uses a fixed opening spread and the configured policy pass-through. Older saved opening quotes convert to spreads. Standalone loan rate paths are retired with a notice. An adjustable share of the policy-related public rate change feeds into interest on the existing stock each year. Both the bank and households receive that rate on their opening public bond holdings. The default 15% repricing share is an illustrative maturity proxy.

Bank-held government bonds use shared lending capacity. Their weight ranges from 0.20 to 0.40 and rises with the public borrowing quote relative to business loan returns net of recent loan losses. The effect is measured as the reduction in new eligible business credit at the same bank equity and loan demand. The constraint can bind or leave credit unaffected. Fiscal demand can still support sales. A separate rule that changed how firms allocated output to investment was held back after worse investment forecast errors.

The sector view displays gross saving by households, firms, the financial sector and government. National saving minus gross investment, including inventory changes, equals the current account. The current account equals net goods exports plus household foreign portfolio income, signed financial-sector foreign interest, and other net foreign income/transfers. Public saving reconciles independently with borrowing, changes in government deposits and bank recapitalization.

**Public demand cut** lowers the plan by five points from year 8. The before-and-after tests and the country-level results are in `dist/data/fiscal_validation.json`. Some long-run debt paths remain implausible.

## Household deposits and financial markets

The country presets open the household investment market from year 1. **Household investment** tests a larger budget when markets are already active. Each household reserves deposits for planned spending and offers a chosen fraction of the excess for new issues. The scenario uses 50% of the excess and allocates it across venture capital, existing firms’ equity, corporate bonds and government bonds with weights of 50, 15, 15 and 20. A zero deposit share keeps all remaining deposits liquid. Money allocated to unfilled orders also stays liquid.

New securities use existing deposits. Startups raise equity to buy existing capital and fund their cash buffer. Existing firms can issue equity and then corporate bonds to cover cash needs before applying for bank credit. Corporate and bank debt share the leverage limit and use the same current policy-linked interest rate. Banks buy the public bonds left unfunded by household orders.

Equity uses paid-in stakes and shares in dividends and residual liquidation proceeds. Corporate bond principal is repaid from available cash above a firm’s buffer. At closure, corporate bond and bank creditors share recoveries in proportion to their outstanding claims. The model tracks write-offs and recoveries separately. Outstanding holdings can still earn income after new market orders are switched off. The model covers primary issuance with domestic settlement and abstracts from secondary trading and market valuation.

Shares and bond purchases are financial transactions. They enter household and issuer balance sheets, while national investment comprises fixed investment and inventory changes. In each simulated year, national saving minus gross investment equals the current account. The earlier optional-market comparison and funding outcomes are in `dist/data/finance_validation.json`.

## Opening values and foreign holdings

The opening snapshot displays the economy’s annual 2023 HICP, separately from the policy area’s opening inflation signal. Charts and CSVs leave unobserved opening flows blank. A positive settling period yields a simulated observation at year 0.

**Invest abroad** enables the household market with a foreign allocation. Gross foreign purchases use household deposits. When the current account is positive, unfilled domestic orders can go abroad up to the remaining surplus after planned foreign orders. Foreign currency securities pay a cash yield based on the assumed foreign real rate and inflation, with a zero floor. Exchange-rate valuation changes are separate from current income. Net external assets change by the current account plus valuation gains and losses.

## Prices and inflation

Country presets let prices adjust each year. The rule compares household and business currency and deposits at opening, multiplied by planned spending velocity, with the previous year's real goods production valued at the preceding price. The producer price moves partway toward the implied price level. The annual adjustment is bounded at −10% and +20%. The **Money & prices** scenario temporarily increases household spending speed.

Opening velocity is derived from output and the 2023 money stock. Planned velocity responds to spending propensities, the rate decision and scenario changes. Realized turnover is calculated separately from the value of current production and average private money. The opening calibration implies no initial money-based price pressure under identical opening inputs. New lending, repayment, other financial flows and changes in output change the balance in subsequent years.

Households forecast current-price budgets from last year's real income and their existing nominal deposits. Actual purchases remain limited by the cash available. Wages follow the producer price. Debt and deposits retain nominal balances. Households pay the producer price including VAT. CPI starts at 100. The charts separate goods produced, model GDP at base producer prices, and GDP at current prices.

The controlled 2% comparison, money and policy runs, and backtest scores are in `dist/data/money_validation.json`. The earlier results in `price_validation.json` use the retired rule. The model represents one composite good. Eurostat HICP covers a wider consumer basket. Prior saved experiments keep their explicit price toggle, and timelines that set the retired price inputs are migrated with a notice.

## Foreign opportunities, monetary policy and exchange rates

Each foreign contact draws a positive technology opportunity from a lognormal distribution with the delayed donor benchmark as its mean. The benchmark combines the PWT anchor and leader premium. The firm learns only from the part of the draw above its own technology. For a fixed dispersion, higher mean productivity makes a useful match more likely. The illustrative default spread is 0.30 in new configurations. Version 1.5 configurations keep their earlier matching rule until edited.

**Reset to economy preset** enables the central bank rule, changing exchange rate, exports and imports, and the household investment market. **Policy & currency** adds temporary depreciation pressure in years 4–6. The opening rate comes from the ECB deposit facility or six BIS national series. Bulgaria and EU27 use ECB proxies. The first decision uses 2023 HICP. Subsequent decisions use prior-year simulated inflation as a proxy for the relevant policy area. The policy rate moves toward a neutral rate adjusted for inflation above or below its editable 2% target. This reprices business debt through an editable pass-through and affects planned investment and spending velocity.

The currency strength index opens at 100. Its target responds to the difference between the domestic rate after recent inflation and an assumed foreign real rate, plus any currency shock. A lower relative return weakens the target. Depreciation raises producer-price pressure and makes foreign technology less accessible. Appreciation reverses both direct effects. These optional rules use an illustrative foreign basket.

Findings describe what happened to production, jobs, prices and firms in the completed run. The policy section suggests experiments based on those outcomes. Use the charts and exports to inspect exact values.

## Foreign trade and the real exchange rate

Goods trade is on in the country presets. **Open to trade** tests a temporary rise in foreign demand when trade is already on. Production plans include domestic and foreign orders. When production is scarce, firms divide available goods between their own investment and customer orders. Domestic and foreign buyers compete by bid price. A small group of foreign buyers offers a premium, and the rest bid at several prices. Firms accept higher bids first. Purchases require positive spending or available goods. Imports use household cash at foreign prices converted into domestic currency. Their price changes enter CPI through the base spending share. Import VAT flows to domestic government, and the import purchase itself is deducted from GDP through the external account.

Real currency strength is nominal currency strength multiplied by the domestic producer price divided by the foreign basket price. Both strength indices open at 100. Higher real strength tends to increase imports and reduce export orders. Improvements in domestic business technology relative to the foreign donor basket work in the opposite direction. A weaker nominal rate and faster domestic price growth can move real competitiveness in opposite directions.

The final-goods proxy preserves the 2023 WDI goods/services net balance and scales only offsetting common gross trade to 5%. The foreign market grows at an assumed 2% per year in real terms, and basket prices also rise 2%. The bank settles the net external flows through a signed position in domestic model units. The trade channel covers final goods. Household foreign income and currency valuation are tracked in a separate financial channel.

The results in `dist/data/trade_validation.json` include retrospective data comparisons, import-only and export-only runs, an isolated nominal exchange shock and long-run fiscal outcomes. These are archived results from the earlier trade rule. Current bid-based trade and combined stress tests are in `dist/data/live_economy_validation.json`.

## Empirical capital-input proxies in 1.15

The three formerly zero capital inputs now have documented 2023 mappings in `capital_input_benchmarks.json`. The source snapshots, SHA256 manifest and `scripts/enrich_capital_inputs.py` reproduce the extraction. These are model proxies rather than full tax schedules or estimated portfolio decisions.

- **Foreign investment weight:** ECB 2023Q4 household debt securities and listed shares, rest-of-world / world totals. VIFA includes holdings through non-MMF funds for 21 member countries. Six countries use the same directly held securities basket because comparable look-through data are unavailable. The EU27 preset uses the euro area's extra-area share, explicitly a geography proxy. A stock composition anchors annual order shares, not an estimated annual propensity. Foreign weight = sum of domestic weights × foreign share / (1 − foreign share). Weight 150.18 in Italy corresponds to 60.03% of planned orders, not a 150% portfolio. The input range now admits observed mappings without clipping; the editor shows the implied percentage.
- **Tax on financial income:** EC DG TAXUD 2026 country tables, 2023 household capital-income tax receipts, divided by Eurostat 2023 gross household property income received. The source includes broader income and tax bases (rents, insurance income, gains and relief), while the model taxes cash interest and dividends uniformly. The effective proxy for Italy is 12.0656%, not Italy's statutory 26% rate on many financial returns. Bulgaria's missing income and the Netherlands' negative net receipts use a labeled EU27 11.7933% proxy. Separately allocated capital receipts are removed from the earlier wage-tax budget proxy so they are not counted twice.
- **Wealth tax:** Italy uses a 0.20% annual financial-product levy / IVAFE proxy, applied to recorded financial wealth. Real exemptions, current-account fixed charges and other bases are not replicated. Belgium uses D59A C06 securities-account receipts; Spain uses D59A C01+C03 wealth/large-fortune receipts. Their uniform rates are receipts divided by total household financial assets. This is a budget-equivalent approximation; Spain's real tax also includes non-financial wealth, and thresholds, regional differences and other taxpayers are not reproduced. Comparable financial-wealth levies are not invented in the other 24 member presets. Zero on this channel does not mean no property, inheritance or transaction taxation. EU27 uses a GDP-weighted member proxy, 0.03396%, rather than a common EU tax law. Spanish recurring wealth receipts are also removed from the broad D5 wage-tax fallback.

The green **Set up your experiment** panel labels the question, presets, paths and events as **Inputs & assumptions**, links to **Set up your economy**, and precedes an explicit **Simulation outcomes** divider. The “Invest abroad” experiment raises an already positive weight by 25% from year 4, rather than silently producing an unchanged experiment.

Old browser configurations from 1.12–1.14 refresh the earlier zero capital defaults and matching old wage-tax proxy, on both sides, with a notice and a backup. Nonzero custom values, pinned reference labels and event/path schedules remain. Explicit values in current configurations and imported JSON remain reproducible. Reset applies the selected country's updated preset.

Executed checks in `capital_input_validation.json` cover 449 paths and 8,968 annual steps. They verify input arithmetic, market-order shares, migration, positive gross foreign positions and both S−I=CA and annual NFA transactions=CA. Same-engine before/after checks on previously examined 2025 observations retain five common seeds and all 27 countries: RMSE changes from 4.65 to 4.92 pp for annualized real GDP growth, 4.75 to 5.07 pp for unemployment and 1.67 to 1.93 pp for inflation. These errors worsen; this release does not claim improved forecasting accuracy. Coefficients were not selected to improve these scores. All 168 longer runs retain positive exports and imports; 22 end with public debt above 300% of GDP. Broader dynamic validity remains unestablished.

## Deposit interest, taxes and shocks

Household and business deposits earn interest on their opening balances. The two rates use separate shares of the positive central bank rate. Financial income tax is withheld on household interest and dividends. Worker income tax applies to wages, business income tax to positive firm profits, and VAT to household spending. Wealth tax applies to opening recorded household financial assets and is cash constrained. Financial income and wealth tax are zero at opening presets and adjustable for experiments.

Use **Open event planner** in the scenario card to create named exogenous events in a separate window. Choose a start year, duration and the percentage of each effect that remains in every following year. One period is one year; year 0 is the opening economy. An event starting in year 3 for two years applies fully in years 3–4. With 50% remaining, it has half its effect in year 5, a quarter in year 6, and so on. Zero ends it immediately after the duration; 100% keeps it in place.

Each event can combine signed changes in household demand, productive capacity, bank credit supply, public purchases, foreign demand, the central bank rate or the currency target. The help text describes which other variables may respond. The schedule preview shows the combined imposed changes for a selected year; it is not a GDP or inflation forecast. Percentage channels multiply across overlapping events; rate and currency offsets add. Existing rate and currency rules and bounds still apply. There are at most 20 direct effects in total. Events beyond the current simulation horizon are labeled and retained.

**Apply events** saves the draft without running it. **Apply & run simulation** saves it and recomputes the scenario against the unchanged reference. Cancel or Escape discards unsaved edits. Settings and full JSON exports preserve names, timing and grouping. Existing flat shock schedules open without changing their numerical effects. Parameter changes over time remain available separately for tax rates and other behavioral settings.

`tests/event-schedule.mjs` verifies scheduling, overlap, JSON replay, legacy compatibility and unchanged economic outputs with event metadata. The executed report is `dist/data/event_editor_validation.json`. This interface update does not change the economic shock equations or establish new forecasting accuracy.

## Model mechanisms

- Lower opening technology raises exit risk at the same size and arrears. A descriptive size effect comes from Eurostat size-class death rates. Mean nonfinancial hazard is normalized to the aggregate death-rate proxy; financial failure may add exits. A two-firm numerical floor and a configurable ceiling are reported when binding.
- Firms actually disappear. Cash repays creditors; unrecovered loans are written off. Funded secondhand auctions transfer real assets without adding GDP or new investment. Unsold assets remain in liquidation estates and dormant capital depreciates. Later sale proceeds repay written-off claims before owners.
- Startup opportunities are independent of exits. Startups raise funds from household deposits. In the market experiment, venture investors own the new firm in proportion to the cash they put in. The earlier rule uses common household ownership shares. New firms purchase existing capital and begin production next period. No deposits, capital or contemporaneous startup GDP are gifted.
- Firm IDs persist through turnover. Random draws and delayed knowledge refer to those IDs. Links are repaired after exits; an entrant cannot appear in pre-birth peer information.
- Firms sample technology opportunities from the USA, China or a rest-of-world pool. The pool uses fixed 2023 PPP output weights across PWT economies with comparable TFP levels and 2013–2023 growth, excluding the USA and China. The source means include an editable leader premium. Firms adopt positive realized gaps with a delay and an assumed adoption rate.
- Customer allocation accounts for capital capacity by default. The earlier size-blind rule gave tiny firms target demand comparable to large firms. This correction applies to every channel combination, including fixed populations. `capacityCompetition=0` retains the earlier rule for explicit sensitivity/replay.

Current-capital-weighted technology measures active firms. Original-cohort knowledge uses initial weights and freezes an original firm's last knowledge on exit; entrants do not enter that cohort index. The technology comparison matches IDs and includes unmatched populations. Employment measures labor used during the period; firms exit at its close.

## Reading a simulation

The firm network and Sector interactions share an annual timeline. Sector interactions shows the selected seed's settled domestic transfers and closing balances. Choose a relationship to inspect the individual flows and switch between the scenario and reference with the same seed. At an observed year zero, the view shows opening balances.

The foreign panel shows the three technology donors outside the domestic accounts, the index available when firms made their adoption decisions, the closing index, and each donor's contribution. The assumptions list uses the selected year's effective parameter values. Adoption events can recur for the same firm.

Findings describe the completed scenario against its matched reference. They use paired differences across seeds, show when output diverged most, and summarize firm turnover, foreign adoption, lending and public debt. The annual transaction fields are also included in the full experiment and seed-path downloads.

Five spending-rule variants were tested on historical paths. Smoothing the spending and investment bases jointly reduced two-year GDP growth RMSE from 5.42 to 4.95 percentage points when initialized from the published 2023 presets and scored on 2024–2025. In the 2020–2023 historical check it increased fixed investment growth MAE from 9.51 to 9.59 points. It missed the advance criterion for consistent gains and was kept out of the simulator. The underlying behavior was checked against the previous release on 56 matched paths.

## Household distributions, debt ratios and net foreign assets

The Household inequality panel shares the annual timeline with the firms and sector accounts. Income and recorded financial-wealth Gini trends summarize paired seeds. The distributions, means, medians, P10/P90, full histogram intervals and separately ranked household quintiles show the selected first seed. Full JSON retains both first-seed household vectors at each year. All-seed CSV and summary exports include the scalar inequality and debt-ratio series.

Income is annual disposable cash income after modeled direct taxes. Negative incomes are retained. Gini can exceed one with negative incomes and a positive total. Unequal values with a nonpositive total have no displayed Gini. Opening income matches Eurostat equivalised disposable-income Ginis, mapped to equally sized model households. Financial-wealth concentration matches a proxy reconstructed from ECB HFCS 2023 financial-asset participation, deciles and mean. Six presets use labeled euro-area wealth proxies. Persistent earnings ranks are assumed; later Ginis remain endogenous. Financial wealth includes deposits, bonds, paid-in equity of active firms and foreign securities at current exchange rates. Funded pension and term claims are included. Housing and mortgages appear in recorded net wealth; land, unpriced original ownership stakes and contingent estate claims are excluded. These are modeled financial-wealth distributions, not total national net-wealth estimates.

Public debt / GDP divides public bonds by annual nominal GDP. Private debt / GDP divides active business loans, corporate bonds and mortgages by nominal GDP. It excludes deposits and shares.

Separate gross settlement assets and foreign funding start at matched positive stocks, scaled to 5% of the smaller observed national foreign stock. Net foreign assets at acquisition cost equal household foreign acquisition cost plus the bank's signed settlement position. The opening matched stock rolls over while a quarter of excess offsetting positions unwinds annually. EU27 uses a labeled GDP-weighted member proxy, including intra-EU exposures, because the selected consolidated IIP series is missing. Independent changes in these assets less liabilities must equal each year's current account. Gross portfolio choices do not independently set that annual national change. Separate cumulative currency valuation bridges the transaction position to the position at current exchange rates. The model assumes no capital-account transfers or other volume changes.

`dist/data/household_trade_validation.json` records 168 fitted opening states and 140 simulation paths over 5,600 years. All four gross series stayed positive across 2,500 surplus years and 3,100 deficit years. Opening Ginis fit the empirical proxy targets to numerical precision. This is improved initial-data fit, not a macroeconomic forecast-accuracy claim. `tests/distribution.mjs` separately checks household vectors and net transaction accounting. The earlier 1.13 reporting-only comparison remains archived in `distribution_validation.json` and `research/distribution_regression.json`.

Use **Import tariff** to test a duty from year 4, or edit its rate in Essentials. Households pay duty domestically, VAT applies after duty, and only the border value is sent to foreign suppliers. The current account excludes domestic duty, government revenue includes it, and nominal GDP includes it as a product tax. Real GDP uses opening tax rates, so neither a duty-rate nor VAT-rate change is mechanically counted as extra real production. The rate is an experiment parameter, not a national tariff schedule. Imported intermediate inputs and retaliation are outside this model.

Goods trade stays enabled in the website. Opening volumes are positive, expenditure-consistent benchmarks. Later quantities depend on funded demand and available production as well as prices and competitiveness. Offline autarky counterfactual tests remain supported by the engine. The model cannot create physical exports during a complete halt in production.

## Data and reproducibility

2023 is the common opening year. The official data reflect revisions as of November 2026. The frozen source files and their exact URLs, flags, dates and SHA256 hashes are in `dist/data/official_data_manifest.json` and `research/source_snapshots/`.

The new observations are Eurostat `bd_size` enterprise births/deaths, employment shares and size-class enterprise/employment totals, plus the official PWT 11.0 workbook. The mappings preserve 28 country/EU observations for each new input family. Size dispersion uses between-class log employment variation and maps it to synthetic capital dispersion. The size/exit slope is a grouped descriptive correlation, not causal identification. Startup employment size maps to capital under an assumed common capital/labor scale. The EU foreign-gap denominator is a cgdpo-weighted national TFP mean, not an observed EU aggregate TFP.

Earlier audited inputs remain: PWT capital/output, labor scale and depreciation; Eurostat unemployment, fiscal accounts, R&D performance/funding/costs, capacity and sector financial stocks; matched ECB outstanding corporate-loan rates. Non-labor GERD, full R&D capitalization, foreign holdings, public production and detailed firm/household balance-sheet instruments remain simplified or absent. No unobserved behavioral response is relabeled as a measured statistic.

Offline regeneration requires Python with pandas and openpyxl:

```sh
python scripts/enrich_profiles.py
python scripts/enrich_demography.py
python scripts/enrich_open_economy.py
python scripts/enrich_households_trade.py
python scripts/build_benchmarks.py
node scripts/build_audit.mjs
```

Then rerun the numerical checks and package command above. `enrich_profiles.py` resets the old base mappings; always run `enrich_demography.py` afterward to restore 1.4 inputs. It is idempotent and uses frozen files. An intentional source refresh is a new data vintage, not the frozen experiment.

## Executed experiments and limitations

`dist/data/VALIDATION_REPORT.md` is generated from executed reports. It documents the unsuccessful first turnover variant, the capacity-allocation correction, final four-way controlled simulations, the size-moment discrepancy, and remaining debt/employment/population-bound failures. No coefficient was selected by optimizing a final holdout or a desired GDP sign.

`turnover_experiments.csv` retains every final factorial outcome: 28 presets × five common seeds × four channel combinations × 40 steps. `research/turnover_experiments.json` contains the richer audit. The initial failed engine/results and the intermediate capacity variant are frozen under `research/failed_turnover_v1_3_initial/` and `research/capacity_share_variant/`. Frozen 1.0, 1.1 and 1.2 engines remain available. To replay 1.2, use its frozen registry/inputs; the current engine's compatibility test also selects its earlier size distribution and allocation rule.

The 560 opening-state size checks are separate from simulated paths. Their employment-exit discrepancy is in-sample and is not forecast RMSE/MAE. Archived TFP forecasts belong to the original statistical layer, not this ABM, and their years were already examined. No untouched holdout or forecast improvement is claimed for this site.

Exports retain model version, both configurations, seeds, interventions, row paths, source manifest and accounting checks. Full JSON also retains household distribution vectors, network/firm histories and event logs for the displayed seed on each side. Older imports recompute with the current engine. Version 1.4 configurations keep their settings and start with fixed producer prices. Earlier migrations add labor transition and rest-of-world inputs to both configurations. Korea-only growth paths are retired and earlier settings are backed up in the browser. Opening employment is bounded at 99.9%.

Further empirical validation requires linked firm size/productivity/adoption/entry/exit/finance panels, calibrated demand/wage/investment/credit responses, independent response targets and a predeclared untouched evaluation set. Balanced accounts and plausible mechanism directions do not establish these properties.

PWT attribution: Feenstra, Robert C., Robert Inklaar and Marcel P. Timmer (2015), *The Next Generation of the Penn World Table*, American Economic Review 105(10), 3150–3182. PWT 11.0 is CC BY 4.0. Eurostat and ECB sources are acknowledged with exact dataset URLs.

## Monetary and employment corrections in 1.19.0

- Zero nominal policy-rate floor, including scheduled negative rate shocks. Negative real rates remain possible. This is a requested scenario convention; real central banks have used negative nominal rates.
- Corrected CPI chaining: the non-rent goods basket is stored independently and housing rent enters the headline basket once. No positive inflation anchor was introduced.
- Emergency secondary-market government bond purchases require sustained very low inflation and policy rates near zero. The default trigger is two readings at or below0.5% and a policy rate at most 0.25%, with annual purchases at most3%of last nominal GDP and holdings capped at 50% of outstanding bonds. Limits are scenario assumptions, not an estimated monetary rule.
- Commercial-bank reserve swaps, household deposits, public debt ownership, coupons, added-reserve interest, retained central-bank losses, net remittances and principal redemption reconcile separately. The legacy opening reserve backing is an unobserved model residual.
- All 28 presets use Eurostat 2023 employment/population and labour-force participation rates ages 15–64. Published population percentages reproduce exactly; internal E/LF is their ratio. Older 15–74 transition rates remain explicit proxies; participation is fixed within changing age cohorts.
- Education funding per child and effectiveness are now separately visible. The existing elasticity 0.2,10-year lag and labour-productivity channel are unchanged. Sensitivity tests do not establish a more accurate education coefficient.

Run `node tests/macro-policy.mjs` for current stock-flow, CPI, QE, opening-data and education-timing checks. `dist/data/macro_policy_validation.json` records 168 baseline/stress paths and retrospective diagnostics. The 2025 diagnostic has been used before and later foreign projections introduce look-ahead information; it is not an independent forecast score. Old fingerprint replays use the archived 1.18.1 engine, since current CPI and rate rules intentionally differ.

## Public budget allocations in 1.19.1

Select Government in Sector interactions for healthcare, education services, old-age, survivor and sickness/disability cash benefit categories. Every country uses its own source percentages within the matching existing budget. Values include current nominal GDP and current expense shares, with the broader official 2023 budget shown separately. All 28 old-age inputs already match; full pension-system and public old-age measures are not interchangeable.

The other sector views expose existing country targets and current configured portfolio/research/housing allocations, with unmatched targets labelled assumptions. This update does not change the school learning coefficient, public budget growth rule, payments or forecasting dynamics. All 168 baseline/stress fingerprints preserve every prior numerical row value across 6,720 years. See research/SOCIAL_SPENDING_METHODS.md and data/social_spending_validation.json.


## Final website wording

The ten approved text edits are built directly into the HTML and the custom-experiment heading. The website text editor, its controls, draft import/export and browser-local text overrides are removed. Economic settings, experiment controls and saved economic configurations remain supported. The approved wording is recorded in `research/FINAL_WEBSITE_WORDING.json`.


## Essentials and manual simulation start

Essentials shows exactly 37 controls covering innovation and diffusion, firm renewal, knowledge links, initial labour and inequality, demand and investment, finance, trade, public policy and simulation design. The full registry remains under All parameters. The selection prioritizes coverage of this model’s main channels; it is not an empirically estimated ranking.

Opening or refreshing the website, switching economies or presets, and importing experiment settings do not start simulations. Use Run simulation to compute the configured experiment. Apply & run simulation in the event planner and Check assumption sensitivity remain explicit buttons for their respective calculations.


## Configuration and results layout

The idle Ready prompt and opening audit notice are removed. Run simulation and Stop simulation sit after the section 02 assumptions and comparison, followed by a distinct full-width experiment-results section. Loading progress and execution errors remain available during an actual task. Simulation startup is manual, Essentials retains 37 controls, and the finalized wording stays in place.
