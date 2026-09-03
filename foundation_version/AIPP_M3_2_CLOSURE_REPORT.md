# AIPP Foundation Integration M3.2 Visual-Token Closure

## Scope
M3.2 is a narrowly scoped correction based on the M3.1 live result of 195 passed and 1 failed. The sole failure was `VIS-BASE-001`, caused by the AIPP ready-badge color differing from the approved Foundation visual baseline.

## Correction
- Changed the ready badge background from `#dff6dd` (`rgb(223, 246, 221)`) to the approved `#dcf7e7` (`rgb(220, 247, 231)`).
- Applied the correction in the modular AIPP stylesheet and the qualification test-surface source.
- Rebuilt generated bundles from modular source; generated bundles were not edited directly.
- Updated source hashes and application milestone identity to `0.3.2-m3.2`.
- Preserved all M3.1 editor behavior, layout, accessibility, working-copy isolation, reset behavior, and the 79-formulation data path.

## Acceptance target
Run the complete live Scilab/JCEF suite and require 196 passed, 0 failed, 0 skipped, exact inventory reconciliation, no runtime errors, and zero active requests/transfers.
