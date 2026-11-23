# Innovation Observatory

Interactive agent-based economic simulator, engine 1.30.1, published at [Innovation Observatory](https://lucacost03.github.io/innovation-observatory/).

The preserved `source/innovation_observatory_source.zip` is the verified engine 1.30.0 release (original source commit `73eda1b518c677f9eec6d1826bd84e313e211b8f`; SHA256 `7f27eb8de94e035c53c63732bbe6e34a49b20f8be400265276242ddfcc0f4b68`). It remains unchanged for reproduction. Deployments do not require the original host.

Reviewed UTF-8 source changes live in `patches/engine-1.30.1/`, with their original project-relative paths. GitHub Actions verifies and restores the base, freezes its engine and presets, overlays the changes, runs the current checks and builds a complete updated source download. The website's downloaded ZIP contains the current full source, retained baseline, executed cases and methods.

This release corrects pension funding reporting to use final collected worker taxes after fiscal reconciliation. It adds retirement-age comparisons and exact GDP spending breakdowns without changing economic transactions, source data or behavioral coefficients. The audit executes 594 paths and 25,200 annual steps; 5,611,410 values apart from the two corrected pension memos exactly reproduce the prior engine. Saved 1.30.0 settings and schedules are retained.

The workflow also checks fiscal/tariff accounting, source migration, 95% inference, participation/import-cost channels, credit policy and noncash pension claims before publishing the static website. Browser-local personal experiment settings are not stored in this repository.

Accounting and software checks do not establish macroeconomic forecast accuracy or causal policy effects. Long-run stress cases and the limitations of the pension, participation and financing rules remain visible in the website and source download.
