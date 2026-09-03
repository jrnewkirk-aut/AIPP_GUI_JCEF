# AIPP M4.1 Remediation Report

## Live failure addressed
The M4.0 live run produced 204 passed and 17 failed. M4.0 is rejected.

## Corrections
- Replaced the invalid `testId` keys in the 12 M4 manifest records with the required `id` keys.
- Synchronized the authoritative test/feature manifests with the embedded runtime manifests.
- Added the complete chamber-pyro manager surface to the authoritative qualification component consumed by the live Scilab builder.
- Preserved the chamber-pyro manager in development and production application surfaces.
- Changed **Add chamber pyro** to load the live 79-formulation library automatically when needed.
- Corrected malformed qualification-surface markup.
- Aligned AIPP-owned status, shell, and application-manifest identity to `0.4.1-m4-remediation`.
- Added static gates for nonempty unique test IDs, all 12 M4 IDs, required GUI IDs in production and qualification surfaces, and bundle inclusion.

## Required live acceptance
Run `app/main.sce`, select Full Acceptance, and require exactly 208 declared/executed/passed tests, zero failures/skips, no inventory differences, and zero active requests/transfers.
