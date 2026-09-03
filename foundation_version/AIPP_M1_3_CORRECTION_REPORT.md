# AIPP Foundation M1.3 Correction Report

## Corrected failures

- `AIPP-APP-004`: the live Scilab builder only consumes `browser_files/components_test/*.html`; the M1.2 component was outside that authoritative directory.
- `MF-INVENTORY-RESULT`: the runtime inventory comes from `P4.testManifest` embedded in `browser_files/js/testing/03_manifests.js`; its generated copy had not been synchronized with `tests/manifests/test_manifest.json`.

## Corrections

- Added the AIPP qualification surface to `browser_files/components_test/03_aipp_m1_test_surface.html`.
- Synchronized the embedded runtime test manifest from the authoritative JSON manifest.
- Declared all three AIPP tests in the live inventory.
- Aligned the dependency manifest with the canonical live component path.
- Rebuilt development, test, and production bundles from modular source.
- Preserved the full AIPP shell in development and production.

## Static and live-build-path validation

- Foundation static build validation: PASS.
- Simulated the exact component and JavaScript directory rules used by `scilab/buildHTML.sci`.
- Required live DOM IDs: exactly one occurrence each.
- Declared operational tests: 180.
- AIPP tests declared: 3.
- Expected exported result count: 181, including the synthetic inventory result.

## Required live acceptance

Run `app/main.sce`, select Full Acceptance, and require zero failed, zero skipped, no missing or unexpected test IDs, and a clean final protocol state.
