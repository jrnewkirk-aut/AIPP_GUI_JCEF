# AIPP M8.8 Candidate 08.3 Qualification Update

## Purpose

Candidate 08.3 is a qualification-focused update built on Candidate 08.2. Production behavior is unchanged. The formal test inventory now covers the production shared chamber corrections introduced in Candidates 08 through 08.2.

## New formal tests

Ten browser qualification tests were added:

1. `AIPP-M88-C083-001` Chamber label remains in the working copy until Apply.
2. `AIPP-M88-C083-002` Revert restores the original chamber label.
3. `AIPP-M88-C083-003` Typing preserves the active label input node and focus.
4. `AIPP-M88-C083-004` Filter mass exposes only Quaff-safe mass units.
5. `AIPP-M88-C083-005` Filter mass conversion preserves physical mass.
6. `AIPP-M88-C083-006` Filter assignment replaces stale orifice indices.
7. `AIPP-M88-C083-007` Filter synchronization updates the chamber working copy exactly and applies atomically.
8. `AIPP-M88-C083-008` Complete Pyro and Filter manager contracts are mounted.
9. `AIPP-M88-C083-009` Chamber Pyros exposes no manual formulation-load control.
10. `AIPP-M88-C083-010` Runtime material service is available to chamber filters.

## Manifest and build updates

- Formal test inventory increased from 360 to 370 declared tests.
- Added feature mapping `AIPP-M88-PRODUCTION-QUALIFICATION-C083`.
- Added the Candidate 08.3 test module to the test-only dependency graph.
- Regenerated the embedded browser manifests.
- Rebuilt development, test, and production bundles.
- Confirmed the ten qualification IDs are present in the test bundle and absent from production.

## Validation completed in packaging environment

- New test JavaScript syntax: PASS
- Declared test IDs are unique: PASS
- New feature-to-test mapping: PASS
- Test bundle contains all ten tests: PASS
- Production bundle excludes all qualification IDs: PASS
- P6.2 build: PASS
- Build validation: PASS
- ZIP integrity: PASS

## Required live Scilab/JCEF qualification

Run the full suite using the normal qualification launcher. Expected inventory before the synthetic audit result:

- Declared: 370
- Executed: 370
- Missing: 0
- Unexpected: 0
- Duplicate IDs: 0

With the synthetic inventory-audit result included, the expected final total is 371 results. Acceptance requires 371 passed, 0 failed, and 0 skipped.
