# AIPP Foundation M5.1 Test Fix Report

## Source evidence
The M5 live acceptance run executed all 218 declared tests: 216 passed, 2 failed, and none were skipped. The failures were AIPP-M5-002 and AIPP-M5-009.

## Root cause
The production application shell contained the chamber-filter manager, but the canonical live Scilab qualification build consumes HTML from `browser_files/components_test/`. The M5 qualification DOM therefore lacked the four required chamber-filter controls, and the visibility/editability test subsequently attempted `querySelector` on a null detail container.

## Correction
- Added `browser_files/components_test/04_aipp_m5_filter_test_surface.html`.
- Registered the test-only component in `browser_files/build/dependency_manifest.json`.
- Preserved the modular production chamber-filter implementation unchanged.
- Bumped the derivative application identity to `0.5.1-m5.1` without changing the foundation identity.
- Rebuilt development, test, and production bundles from modular source.
- Verified exactly one occurrence of each required chamber-filter ID in both test and production bundles.

## Static validation
- Foundation build validation: PASS.
- JavaScript syntax checks: PASS.
- Canonical live test-component DOM simulation: PASS.
- Generated bundles edited directly: false.

## Required live acceptance
Run `app/main.sce` with Scilab 2026.1.0 or newer and require 218 passed, zero failed, zero skipped, complete inventory, and clean final protocol state.
