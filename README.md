# Innovation Observatory

Interactive agent-based economic simulator, engine 1.31.0, published at [Innovation Observatory](https://lucacost03.github.io/innovation-observatory/).

The preserved `source/innovation_observatory_source.zip` is the verified engine 1.30.0 base (SHA256 `7f27eb8de94e035c53c63732bbe6e34a49b20f8be400265276242ddfcc0f4b68`). It remains unchanged. Reviewed source overlays are applied in order from `patches/engine-1.30.1/` and `patches/engine-1.31.0/`, using original project-relative paths.

GitHub Actions verifies the base, retains the 1.30 and 1.30.1 engines and inputs, reproduces the historical retirement study, tests the current tax corrections, and builds the complete current source download. Deployments do not require the original host. The website ZIP includes code, frozen baselines, source observations, methods, executed comparisons and tests.

Engine 1.31 corrects worker-tax payment allocation: preliminary withholding is returned to its payers, and additional worker-tax requests respect each worker's own payroll and cash. Uncollected requests are disclosed instead of reassigned to unrelated asset holders. A separate fix makes EU business-income-tax controls affect fiscal coverage despite their legacy zero reference. Opening data, preset values, baseline tax targets and behavioural response coefficients are unchanged.

The controlled audit covers all 30 presets, five common seeds, 120/12-year baseline comparisons and retirement/worker-tax/business-tax interventions. GDP, external accounts, sector cash, public/private debt and pension funding reconcile. The retrospective macro results are mixed: the correction is retained for its verified payment and control logic, not as proof of general forecasting accuracy. The website reports all errors and remaining inequality and long-run weaknesses.

The deployed module graph and simulation worker use a shared release identifier, with a cache-regression integration test against the prior engine. The clean source is packaged before deployment-only URL versioning.

Saved 1.30 and 1.30.1 controls and schedules are retained. Personal browser-local experiments are not stored in this repository. Statistical intervals describe model seed uncertainty, not uncertainty about empirical model validity.


Website wording can be drafted directly with **Edit website text**. The `patches/website-text-editor/` overlay adds local drafts, search, undo, restoration and text-only JSON import/export. Drafts never write to the public website or alter model settings. To publish a downloaded wording file, apply it with `scripts/apply_site_text.mjs`, review the preview, and update the overlay's `dist/site-copy-data.mjs`. Details are in the source ZIP's `research/WEBSITE_TEXT_EDITING.md`.
