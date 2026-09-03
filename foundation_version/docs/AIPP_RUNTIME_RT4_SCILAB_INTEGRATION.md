# AIPP Runtime RT-4 Scilab Integration

**Verified:** September 3, 2026

## Scope

`application/scilab/runtime_bridge.sci` owns the Scilab-side Runtime Bridge lifecycle. It does not execute the simulation through Scilab `host()`; it starts the bridge as a detached Windows process and leaves long-running process ownership to Python.

## Startup behavior

Production startup loads the lifecycle module from `app/aipp_main.sce` and calls `pAippRuntimeBridgeStart(APP_ROOT)` after application route registration. The lifecycle module:

1. Performs a short `curl.exe` request to `http://127.0.0.1:8765/health`.
2. Reuses a healthy bridge and records `owned=%f`.
3. Otherwise starts `tools/runtime/runtime_bridge.py` detached with `start "" /b python`, bound to `127.0.0.1:8765`.
4. Records bridge state, script path, log path, endpoint, and ownership in Scilab global state.

The browser can request `application.aipp.runtime.bridge.request` to receive the current Scilab lifecycle snapshot. Request and response schemas are declared in `application/schemas/`.

## Boundary

Scilab performs only short health/startup operations. It does not block on AIPP and does not accept arbitrary commands from the browser. The bridge remains localhost-only and owns the RT-1/RT-3 process lifecycle.

## Verification

- Bridge `/health` endpoint test passes.
- RT-1/RT-2/RT-3/bridge tests pass: 11/11.
- Python compilation passes.
- Application manifest and public schemas parse successfully.
- Repository validators pass.

Scilab itself is not installed on the current command environment, so live execution of `aipp_main.sce` and verification of Scilab `unix_g` behavior remain a required manual JCEF acceptance check. The next phase is RT-5 browser Runtime tab integration.
