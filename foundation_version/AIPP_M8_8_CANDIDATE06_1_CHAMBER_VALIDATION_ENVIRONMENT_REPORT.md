# AIPP M8.8 Candidate 06.1 — Chamber Validation Environment

## Scope

Candidate 06.1 updates the test harness so chamber validation occurs in a unified chamber-scoped editor rather than in disconnected pyro and filter areas.

## Implemented changes

- Added the test-only `Chamber editor validation` environment.
- Added chamber editor tabs for **Properties**, **Pyros**, **Filters**, and **Raw JSON**.
- Reused the accepted chamber pyro and chamber filter managers by mounting them into the chamber-scoped tab panes; no duplicate editor models were created.
- Added chamber selection/path and modified-state summaries to the validation environment.
- Preserved the authoritative native chamber working-copy model and apply/revert/validate workflow.
- Corrected the M8.8 phase-2 fixture to call the actual authoritative deck API, `aippDeckDocument.replace(...)`, instead of the nonexistent `replaceNative(...)` method.
- Regenerated dev, test, and production bundles and manifests.

## Validation performed

- `node --check browser_files/js/application/28_aipp_chamber_editor_view.js` — PASS
- `node --check browser_files/js/testing/04zf_aipp_m88_phase2_chamber_editor_tests.js` — PASS
- `python3 tools/build/build_p63.py` — PASS, including reproducibility
- `python3 tools/build/validate_build.py` — PASS, no build errors
- Generated test manifest — 123 declared modules / 123 emitted modules, no validation errors or warnings
- Test bundle inspection — unified chamber validation environment and all four tabs present

## Live-runtime note

The package is statically and structurally qualified here. The final real Scilab/JCEF run must still be executed in Scilab 2026.1.0 or newer to capture live protocol and GUI evidence.
