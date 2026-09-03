# AIPP M8.9.2 Candidate 04.1 Correction

## Evidence reviewed
The live Candidate 04 run executed all 453 declared tests and produced 444 passes and 10 failures. Every failure was in AIPP-M892-023 through AIPP-M892-032. AIPP-M892-033 and AIPP-M892-034 passed, and all earlier Wall editor tests passed.

## Root cause
The persistence-test helper reopened the native deck correctly but returned the complete `assembly` object. The tests then indexed that object as though it were the `walls` array. Consequently, `reopen()[0]` was undefined in every affected test. This was a qualification-fixture defect, not loss of persisted Wall data.

## Correction
- The helper now returns `snapshot.native.aipp_calculation.assembly.walls`.
- The helper asserts that the reopened Wall collection is an array.
- The helper asserts that at least one Wall record survived reopening.
- No production Wall editor behavior was changed.
- No test was removed, skipped, weakened, or renumbered.

## Static qualification
- JavaScript syntax: PASS
- P6.2 build: PASS
- Source-hash validation: PASS
- P6.3 reproducibility: PASS
- Declared tests: 453 unique
- Wall tests: 34
- Corrected persistence block: AIPP-M892-023 through AIPP-M892-032

## Required live verification
Run Full Acceptance in Scilab/JCEF. Expected result: 454 total, 454 passed, 0 failed, 0 skipped.
