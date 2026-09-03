# Pre-P2 Stabilization Candidate 05 Repair Report

## Purpose
Repair stale chamber pyro and filter editor identities without removing established AIPP functionality.

## Preserved behavior
- Multiple ordered pyros per chamber.
- Full formulation inventory loaded from application/data/pyrolist.json.
- Pyro add, select, duplicate, remove, move/reorder, independent geometry, burn-rate, ignition, and quantity edits.
- Chamber filter creation, selection, duplication, removal, material editing, mass conversion, and orifice assignment.
- Existing Orifice, Wall, Piston, topology, hover-card, native round-trip, and package behavior.

## Repairs
1. Added stable transient ID alias resolution to chamber pyro operations.
2. Added stable transient ID alias resolution to chamber filter operations.
3. Preserved selection across projection replacement when a logical record remains at the corresponding projected position.
4. Added chamber-content token guarding so unrelated authoritative deck revisions do not destructively rehydrate the active chamber managers.
5. Rebuilt development, test, and production bundles deterministically.
6. Updated dependency-manifest source hashes for the three modified application modules.

## Validation performed
- Node syntax validation passed for all three modified modules.
- P6.3 deterministic build and reproducibility passed.
- Build dependency/source validation passed after source-hash regeneration.
- Test and production bundles contain the repaired source.
- Production forbidden-marker checks passed through validate_build.py.
- Full live Scilab/JCEF execution remains required in the target environment.

## Modified source files
- browser_files/js/application/08_aipp_chamber_pyro_model.js
- browser_files/js/application/10_aipp_chamber_filter_model.js
- browser_files/js/application/27a_aipp_master_json_working_projection.js
- browser_files/build/dependency_manifest.json

## Acceptance target
Re-run the complete 489-test manifest. The prior 17 failures should now reach their intended CSV, burn-rate, rendering, mass-conversion, and orifice-assignment assertions instead of failing on stale pyro or filter IDs.
