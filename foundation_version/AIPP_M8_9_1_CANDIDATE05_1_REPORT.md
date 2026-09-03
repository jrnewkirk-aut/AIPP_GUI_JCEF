# AIPP M8.9.1 Candidate 05.1 Report

## Root cause
The continuity dropdown visually selected its first option, `Discrete`, when the native discharge-coefficient object had no `continuity` property. The browser display therefore disagreed with the coordinator state. Validation correctly inspected the state, found `continuity` undefined, and reported the error.

Changing the basis to time or pressure could also leave the corresponding coordinate and Cd arrays absent, producing the simultaneous equal-length/nonempty-array error.

## Correction
- Added coordinator-level discharge-coefficient normalization.
- Time- and pressure-dependent bases now initialize `continuity` to `discrete` in the working state.
- New dependent tables initialize with two valid rows: coordinates `[0, 1]` and Cd values `[0, 0]`.
- Missing or invalid selected units normalize to the first Quaff-safe unit for the selected dimension.
- Existing imported dependent Cd data with missing continuity normalizes both original and working copies, so opening the editor does not falsely mark the entity dirty.
- Basis transitions initialize defaults atomically before validation.
- The visible dropdown and coordinator state now use the same value.

## Regression coverage
- AIPP-M891-033: basis transition initializes continuity and rows.
- AIPP-M891-034: imported data with missing continuity normalizes cleanly.
- AIPP-M891-035: visible continuity agrees with coordinator state.

## Validation
- JavaScript syntax: PASS.
- Development/test/production builds: PASS.
- Build validator and source hashes: PASS.
- Declared test IDs: 405 unique.
- Production includes normalization and excludes test registration: PASS.

## Live qualification
Pending full Scilab/JCEF acceptance. Expected final result count: 406, consisting of 405 declared tests plus one synthetic inventory result.
