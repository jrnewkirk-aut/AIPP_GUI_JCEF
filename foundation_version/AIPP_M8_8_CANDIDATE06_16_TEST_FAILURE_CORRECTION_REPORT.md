# AIPP M8.8 Candidate 06.16 - Test Failure Correction

Reviewed protocol_results_M8-8_06_15.json: 361 results, 348 passed, 13 failed.

## Corrections
- Aligned nine stale Candidate 05.1 CSV tests with the accepted Candidate 06.11 exact-units-row contract; production CSV behavior was not rolled back.
- Restored the selected-row `.aipp-pyro-formulation` compatibility marker.
- Replaced the destructively moved Add button with a stable dynamically rendered toolbar button and delegated handling.
- Added all 15 Candidate 06.11/06.13/06.15 test IDs to the declared inventory, bringing the declared target to 360.

## Validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validator: PASS
- Static root-cause closure checks: PASS
- Full live Scilab/JCEF acceptance: REQUIRED
