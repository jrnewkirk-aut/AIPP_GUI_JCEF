# AIPP M7.6 Production Validator Correction

## Root cause
The production bundle contains `aippTabEditor`, `aippTabRuntime`, and `aippTabOutputs`, but Scilab runtime text reconstruction does not reliably expose markers located in the large generated application line. The validate-only launcher gate therefore produced a false missing-marker failure.

## Correction
The Scilab launch gate now validates stable Foundation and application service markers only. Workspace DOM markers remain verified by the deterministic build/static validation process and are not redundantly scanned through Scilab text reconstruction.

## Preserved M7.5 corrections
- Guarded `window.toScilab` bridge access
- Material-list production path correction
- Reference Ping UI removal while retaining service and route
- Runtime and Outputs placeholder cleanup
- Topology grammar correction
- M7 window identity

## Required live verification
Run `app/aipp_main.sce` with Scilab 2026.1.0 or newer and confirm the production workspace opens.
