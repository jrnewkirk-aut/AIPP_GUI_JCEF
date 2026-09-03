# AIPP Foundation Integration M2

## Scope

M2 replaces the preserved legacy `request_pyrolist` / ASCII callback path with a Foundation-native request/response operation and a browser adapter compatible with the staged AIPP editor contract.

## Implemented behavior

- Added `application.aipp.pyrolist.request` and `application.aipp.pyrolist.response`.
- The Scilab host reads the application-owned `application/data/pyrolist.json`, validates that it is present and parseable, and returns deterministic metadata.
- Callers can request metadata only or include the complete formulation map.
- Added `P2.application.aippPyrolist` as the browser request service.
- Added `P2.application.aippHostAdapter` with load, cache, clear, and legacy-global installation methods.
- Added an M2 shell action that loads the pyrolist and reports its count, source, and first formulation names.
- Aligned the AIPP status response and application manifest to `0.2.0-m2`.

## Public operation

```text
application.aipp.pyrolist.request
```

Request payload:

```json
{"include_formulations": true}
```

Successful response payload includes:

```text
source
count
names
formulations (when requested)
application_version
```

## Failure behavior

- Invalid `include_formulations`: `INVALID_APPLICATION_PAYLOAD`
- Missing data file: `AIPP_PYROLIST_NOT_FOUND`
- Empty data file: `AIPP_PYROLIST_EMPTY`
- Invalid JSON: `AIPP_PYROLIST_INVALID`

## Tests added

- `AIPP-M2-001` service and adapter registration
- `AIPP-M2-002` M2 shell controls
- `AIPP-M2-003` live metadata request
- `AIPP-M2-004` full formulation load and legacy-contract adapter
- `AIPP-M2-005` invalid request rejection
- `AIPP-M2-006` clean protocol state

## Protected files

No runtime protocol, transfer, callback, bootstrap, plotting, observability, or release foundation module was changed. The generated runtime manifest source under `browser_files/js/testing/03_manifests.js` was synchronized with the authoritative test and feature manifests so the live Scilab build carries the M2 inventory.

## Intentionally deferred

The preserved chamber/pyro editor UI, model file loading, graph, topology, and save workflows remain staged. M2 provides the Foundation-native pyrolist boundary required by those later migrations.
