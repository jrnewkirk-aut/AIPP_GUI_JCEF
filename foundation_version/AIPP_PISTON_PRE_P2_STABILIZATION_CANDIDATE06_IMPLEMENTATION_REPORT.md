# AIPP Piston Pre-P2 Stabilization Candidate 06 Implementation Report

## Scope

Candidate 06 is a narrow mounted formulation-selector repair built only from Candidate 05. It preserves the master native AIPP JSON document as the sole canonical model and does not replace the current Orifice, Wall, Piston, topology, hover-card, native-round-trip, stable identity, or test-suite implementation.

## Corrected behavior

- The chamber formulation selector now builds an explicit Tom Select inventory from the complete loaded formulation library.
- The bundled runtime library remains unchanged at 79 protected formulations.
- An unmatched imported formulation is retained as an additional current option without replacing or restricting the protected inventory.
- Tom Select now explicitly searches both `text` and `value` fields with partial, case-insensitive matching.
- Formulation library loading is idempotent and exposes a subscriber notification when loading completes.
- A mounted selector is refreshed after asynchronous library completion without changing the selected pyro or committing the chamber.
- Refresh operations reject stale pyro identities and preserve active working edits.
- Selecting a result continues to update only the selected pyro working projection.
- The master document remains unchanged until Chamber Apply.

## Modified modular source

- `browser_files/js/application/06_aipp_pyro_editor_model.js`
- `browser_files/js/application/09_aipp_chamber_pyro_view.js`
- `browser_files/js/testing/04zzf_aipp_candidate06_formulation_selector_tests.js`
- `browser_files/build/dependency_manifest.json`
- `tests/manifests/feature_manifest.json`
- `tests/manifests/test_manifest.json`
- `browser_files/js/testing/03_manifests.js`
- application identity files and generated build artifacts

## Regression coverage

Eight mounted-UI regression tests were added. They cover the 79-name mounted inventory, actual pyro-row clicks, typed mixed-case `pNp` search, visible dropdown results, result clicking, selected-pyro isolation, pre-Apply master immutability, working-copy synchronization, Apply and reopen persistence, clearing search, unmatched imported formulations, duplicate-wrapper prevention, and stale-refresh rejection.

The declared test inventory increases from 489 to 497 tests.

## Validation status

Container-based syntax, static build, manifest synchronization, M8.10 Phase 0.5B validation, bundle rebuilding, and deterministic rebuild checks passed. Final live Scilab/JCEF execution of the 497-test Candidate 06 suite is still required using Scilab 2026.1.0 or newer.
