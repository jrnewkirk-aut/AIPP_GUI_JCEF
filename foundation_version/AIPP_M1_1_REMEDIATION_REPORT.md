# AIPP Foundation M1.1 Remediation Report

## Reason M2 is blocked

The uploaded M1 live result reported 145 passed and 37 failed. The failures were not acceptable for promotion to M2.

## Root causes corrected

1. Inherited reference ping and sum browser services and Scilab routes had been removed. Foundation integration tests still require these inherited operations.
2. The Scilab unit-runner cascade was caused by the removed inherited application routes.
3. AIPP browser tests were not declared in the test manifest.
4. The AIPP shell test returned a nested `pass` value instead of using Foundation assertions, allowing a false positive.

## Corrections

- Restored `application.example.ping.request` and `application.example.sum.request` in browser and Scilab application extensions.
- Retained `application.aipp.status.request` as an additional route.
- Restored inherited browser service dependencies before the AIPP status service.
- Added AIPP test IDs to `tests/manifests/test_manifest.json`.
- Added the AIPP M1 feature mapping to `tests/manifests/feature_manifest.json`.
- Rewrote AIPP tests to use `P4.assert`.
- Rebuilt dev, test, and production bundles.
- Re-ran static build validation successfully.

## Promotion gate

Run the full live acceptance suite again. M2 may begin only when the inherited Foundation suite and the additive AIPP tests complete with zero failed and zero skipped tests and clean final protocol state.
