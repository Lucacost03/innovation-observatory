# Innovation Observatory

Interactive agent-based economic simulator, engine 1.31.0, published at [Innovation Observatory](https://lucacost03.github.io/innovation-observatory/).

The preserved `source/innovation_observatory_source.zip` is the verified engine 1.30.0 base (SHA256 `7f27eb8de94e035c53c63732bbe6e34a49b20f8be400265276242ddfcc0f4b68`). It remains unchanged. Reviewed source overlays are applied in order from `patches/engine-1.30.1/` and `patches/engine-1.31.0/`, followed by `patches/website-final-wording/`, using original project-relative paths.

GitHub Actions verifies the base, retains the 1.30 and 1.30.1 engines and inputs, reproduces the historical retirement study, tests the current tax corrections, and builds the complete current source download. Deployments do not require the original host. The website ZIP includes code, frozen baselines, source observations, methods, executed comparisons and tests.

Engine 1.31 corrects worker-tax payment allocation: preliminary withholding is returned to its payers, and additional worker-tax requests respect each worker's own payroll and cash. Uncollected requests are disclosed instead of reassigned to unrelated asset holders. A separate fix makes EU business-income-tax controls affect fiscal coverage despite their legacy zero reference. Opening data, preset values, baseline tax targets and behavioural response coefficients are unchanged.

The controlled audit covers all 30 presets, five common seeds, 120/12-year baseline comparisons and retirement/worker-tax/business-tax interventions. GDP, external accounts, sector cash, public/private debt and pension funding reconcile. The retrospective macro results are mixed: the correction is retained for its verified payment and control logic, not as proof of general forecasting accuracy. The website reports all errors and remaining inequality and long-run weaknesses.

The deployed module graph and simulation worker use a shared release identifier, with a cache-regression integration test against the prior engine. The clean source is packaged before deployment-only URL versioning.

Saved 1.30 and 1.30.1 controls and schedules are retained. Personal browser-local experiments are not stored in this repository. Statistical intervals describe model seed uncertainty, not uncertainty about empirical model validity.


The final `patches/website-final-wording/` overlay keeps the ten approved wording edits directly in the page and custom-experiment heading. The text editor and all draft/import/export controls are removed, and browser-local wording drafts are no longer read. Visitors can change economic assumptions and run experiments. The approved wording is recorded in the source download's `research/FINAL_WEBSITE_WORDING.json`. Earlier editor source remains in repository history; it is not applied or shipped in the current website.


Essentials now highlights exactly 37 initial controls covering the main innovation, diffusion, firm-renewal, financial and macroeconomic channels, with the full registry under All parameters. Opening/refreshing the site and importing an experiment restore inputs without starting a simulation. Runs begin through the Run simulation button or an explicit calculation button in the event planner or sensitivity panel.

The Run simulation controls follow the section 02 experiment setup and comparison. A separate, full-width 03 / EXPERIMENT RESULTS section marks where outputs begin. The idle Ready prompt and opening audit notice are removed; actual loading progress and execution errors remain available.
