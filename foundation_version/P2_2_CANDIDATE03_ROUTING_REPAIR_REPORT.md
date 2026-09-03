# P2.2 Candidate 03 Routing Repair

## Root causes corrected
- Corrected `aippQuaFFUnits` to the registered `aippQuaffUnits` service name.
- Prevented the generic native inspector from loading or rendering piston selections.
- Made piston rendering exclusive to the piston editor.
- Moved piston tab filtering before piston rendering so Pyros and Filters are hidden even if a renderer reports an error.

## Qualification
- Added five routing and rendered-DOM ownership tests.
- Confirmed the production bundle contains the three-column piston renderer and corrected service name.
- JavaScript syntax, reproducibility build, build validation, and ZIP integrity pass.
