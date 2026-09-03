# AIPP M8.8 Candidate06_8 Fix Report

## Live evidence reviewed

The Candidate06_7 live Scilab/JCEF run completed 346 results: 345 passed, 1 failed, and 0 skipped. The sole failure was `AIPP-M4-011`, `Chamber pyro controls are visible and reachable`, with `Values differ: 1 !== 0`.

## Root cause

The unified chamber validation stylesheet intentionally hid `.aipp-chamber-header` inside the validation environment. After the existing chamber-pyro manager was remounted into the Pyros tab, that rule also hid the manager header containing `aippChamberPyroAdd`. The list and detail regions remained visible, so exactly one of the three tested controls had zero rendered dimensions.

## Correction

Candidate06_8 restores the chamber-pyro manager header only within the unified validation environment and gives the Add chamber pyro action an explicit reachable size. The filter-header behavior is unchanged.

## Validation

- JavaScript syntax checks: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build/source-hash validation: PASS
- Generated test bundle ordering check: PASS; the scoped visible-header override appears after the older hidden-header rule
- Live Scilab/JCEF rerun required to close `AIPP-M4-011`
