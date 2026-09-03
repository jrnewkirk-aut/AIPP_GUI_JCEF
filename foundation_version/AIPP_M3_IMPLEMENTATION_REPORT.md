# AIPP Foundation Integration M3

## Scope
M3 activates a modular pyro formulation editor on the accepted M2 Foundation-native pyrolist boundary.

## Implemented
- Added a working-copy editor model with explicit `idle`, `loading`, `ready`, `selected`, `modified`, `invalid`, and `error` states.
- Loads all 79 formulations through `P2.application.aippHostAdapter`.
- Selects formulations without mutating the master pyrolist.
- Recursively renders scalar formulation properties, including nested gas-yield and wild-card values.
- Supports working-copy edits and reset to the selected source formulation.
- Validates required fields and finite numeric burn-rate exponent values.
- Rejects unknown formulations with `AIPP_UNKNOWN_FORMULATION`.
- Added accessible M3 editor controls to the production application shell and a canonical qualification surface.
- Advanced the AIPP application/status identity to `0.3.0-m3`.

## Modular source
- `browser_files/js/application/06_aipp_pyro_editor_model.js`
- `browser_files/js/application/07_aipp_pyro_editor_view.js`
- `browser_files/js/testing/04q_aipp_m3_tests.js`

The preserved legacy editor remains unchanged under `application/legacy_source_baseline/`; M3 does not load that monolithic module.

## Acceptance
M3 adds 10 tests to the accepted 186-test M2 baseline for an expected live inventory of 196 tests. Full live Scilab/JCEF acceptance requires 196/196 passed, zero skipped, exact inventory reconciliation, and clean final request/transfer state.
