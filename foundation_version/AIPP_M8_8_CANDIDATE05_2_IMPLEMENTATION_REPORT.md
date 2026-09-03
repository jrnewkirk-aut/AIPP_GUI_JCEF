# AIPP M8.8 Candidate 05.2 - Candidate 05.1 Phase 1 Correction

## Baseline and authority

- Sole implementation baseline: AIPP M8.8 Direct Integration Candidate 05.1.
- Historical `.patch_rollback` and `application/legacy_source_baseline` content was not used as implementation source.
- Domain contract: `AIPP3_UserGuide.html` supplied separately by the user.
- Minimum live host: Scilab 2026.1.0.

## Authoritative implementation paths

- Geometry model and quantity conversion: `browser_files/js/application/08_aipp_chamber_pyro_model.js`
- Active chamber-pyro geometry view: `browser_files/js/application/09_aipp_chamber_pyro_view.js`
- Quantity rendering helpers: `parseGeometryQuantity`, `dimensionalGeometryField`, and `integerGeometryField` in the active view; parsing and unit conversion remain model-owned.
- Application CSS: `application/browser/styles/aipp_m1.css`
- Candidate geometry tests: `browser_files/js/testing/04ze_aipp_m88_candidate051_geometry_tests.js`
- Embedded browser manifests: `browser_files/js/testing/03_manifests.js`, sourced from `tests/manifests/feature_manifest.json` and `tests/manifests/test_manifest.json`
- Inventory reconciliation/export: `browser_files/js/testing/05_runner_ui.js`
- Build graph: `browser_files/build/dependency_manifest.json`
- Build tools: `tools/build/build_p63.py` and `tools/build/validate_build.py`

## Corrections

1. Geometry selector now exposes exactly `sphere`, `tablet`, `grain`, `wafer`, and `tabular`, in documented order.
2. Imported unsupported geometry is represented by a disabled preserved-status option and cannot be newly selected.
3. All supported dimensional geometry fields use one canonical numeric-value plus unit-selector renderer.
4. Unit changes call the model-owned conversion path and preserve physical size.
5. `num_fins` uses a dedicated integer input (`type=number`, `step=1`) and has no unit selector.
6. Candidate 05.1 tests are embedded in the runtime test manifest; declared executable inventory is 333.
7. The inventory result is always emitted as one synthetic PASS/FAIL row while executable comparison remains 333-to-333.
8. Existing Candidate 05.1 regression tests were strengthened without increasing the declared count.

## Test-count reconciliation

- Candidate 04.7 cumulative baseline: 311 executable tests.
- Candidate 05.1 additive tests: 22 executable tests.
- Candidate 05.2 declared executable total: 333.
- Synthetic `MF-INVENTORY-RESULT`: excluded from declared/executed executable counts.
- A complete exported results array may contain 334 rows: 333 executable rows plus one synthetic inventory row.

## Validation boundary

Static validation passed in this environment. Live Scilab/JCEF qualification is not claimed by this package and remains required before release promotion.
