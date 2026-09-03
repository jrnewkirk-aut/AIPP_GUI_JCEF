# AIPP M8.9.1 Shared Orifice Editor Candidate 01 Report

## Requested behavior
Implement a robust production-owned native orifice editor opened from the topology, using working-copy Apply/Revert semantics and exact Quaff-safe units.

## Root cause
Candidate 08.3 routes non-chamber entities through the generic native property inspector. That inspector edits only top-level scalar values and cannot model nested `opens_at` or `discharge_coefficient` union records.

## Changed modular source
- `browser_files/js/application/26_aipp_contextual_workspace.js`
- `browser_files/js/application/26a_aipp_quaff_units.js`
- `browser_files/js/application/29_aipp_orifice_editor_coordinator.js`
- `browser_files/js/application/30_aipp_orifice_editor_view.js`
- `application/browser/styles/aipp_m1.css`
- `browser_files/js/testing/04zk_aipp_m891_orifice_editor_tests.js`
- application, dependency, feature, and test manifests
- regenerated development, test, and production artifacts

## Implemented contract
- Isolated orifice working copy with explicit Apply/Revert.
- Endpoint selectors use current chambers and reject self-connections.
- `num_orif` is an integer of one or more with no artificial upper bound.
- Diameter uses Quaff length units.
- `Cd_value`, tabular Cd values, and `viscous_flow_factor` accept 0 through 1.5.
- `open=true` retains `opens_at`.
- Pressure thresholds are nonnegative.
- Event opening uses model-derived events and a Quaff time delay.
- Constant, time-dependent, and pressure-dependent discharge coefficients are supported.
- Unsupported basis values remain preserved and available through Raw mode.
- Changing `from` identifies and atomically removes newly invalid Filter assignments.
- Unknown native fields and untouched quantity strings are retained.

## Architecture implications
The production contextual workspace remains canonical. New editable source remains modular. Generated bundles are rebuilt artifacts only. The expanded Quaff service is shared and backward-compatible with the chamber editor API.

## Validation performed
- JavaScript syntax checks: PASS for all changed/new modules.
- Dependency graph and hashes: PASS.
- P6.2 development/test/production build: PASS.
- Build validator: PASS.
- Modular source-authority scan: baseline-policy exception noted. The scanner flags the pre-existing locally packaged Cytoscape vendor file above 200 KB; no authored M8.9.1 module exceeds 200 KB.
- Production contains the orifice editor modules: PASS.
- Production excludes M8.9.1 test registrations and IDs: PASS.
- Test bundle contains the M8.9.1 qualification module: PASS.
- Test IDs unique: PASS.

## Expected live inventory
- Previous declared tests: 370
- New formal tests: 15
- Expected declared/executed tests: 385
- Synthetic inventory-audit result: 1
- Expected final results: 386
- Acceptance target: 386 passed, 0 failed, 0 skipped, 0 missing, 0 unexpected, 0 duplicates

## Manual smoke test
1. Open a native deck containing at least two chambers and one orifice.
2. Double-click the orifice node.
3. Verify endpoint, quantity, opening, and discharge-coefficient controls appear.
4. Change diameter units and verify physical value preservation.
5. Test constant, time, and pressure coefficient modes.
6. Revert and confirm the native record is unchanged.
7. Apply and confirm a single deck revision and updated topology.
8. Change `from` where a Filter references the orifice; verify the impact warning and atomic assignment cleanup.
9. Save/reopen and confirm unknown fields and untouched precision strings remain intact.

## Qualification status
Static/package validation passed. Candidate is not fully qualified until the complete live Scilab/JCEF suite passes.
