# Candidate 06 Correction 01 Report

## Live evidence reviewed

The Candidate 06 Scilab/JCEF run executed all 497 declared tests with no missing, unexpected, or duplicate IDs. It reported three failures: AIPP-C06-FORM-001, AIPP-C06-FORM-002, and AIPP-M3-003.

## Corrections

1. `aippPyroEditor.load()` now restores `phase` to `ready` when returning an already-loaded cached formulation library. This fixes the sequence where the intentional unknown-formulation test leaves the editor in `error` before the later live-load integration test.
2. AIPP-C06-FORM-001 now verifies that every one of the 79 protected formulations is present. It permits exactly one additional option only when the current imported formulation is not protected. This matches the production preservation contract already proven by AIPP-C06-FORM-007.
3. AIPP-C06-FORM-002 now reacquires each live pyro-row node after every click-triggered full rerender. The previous test retained detached DOM nodes and therefore did not perform the second live click.

## Validation

- Modified JavaScript syntax: PASS
- Development, test, and production rebuild: PASS
- Deterministic rebuild: PASS
- Static build validation: PASS
- M8.10 Phase 0.5B validation: PASS
- Manifest synchronization: PASS
- Declared inventory remains 497 tests

A new full live Scilab/JCEF run under Scilab 2026.1.0 or newer is required to close the three corrected tests.
