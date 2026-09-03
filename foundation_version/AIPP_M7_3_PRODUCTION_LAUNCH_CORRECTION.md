# AIPP M7.3 Production Launch Correction

## Root cause
The P6.3 validate-only production gate required the obsolete JavaScript marker `P2.application.ping`. The current modular application registry emits `P2.application.registry.register("ping"...)`, so the valid production bundle was rejected before JCEF window creation.

## Correction
- Replaced the obsolete marker with the exact current registry marker.
- Added stable AIPP production markers for the status operation and all three primary workspace tabs.
- Retained the P6.4 identity, reference request route, minimum bundle size, and production-forbidden checks.
- Did not edit generated bundles because the production bundle was already correct.

## Expected launch
`app/aipp_main.sce` should validate `browser_files/dist/bundle.prod.html` and continue to `p52CreateMainWindow`.
