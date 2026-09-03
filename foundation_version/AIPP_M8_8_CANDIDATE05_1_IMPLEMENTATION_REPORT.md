# AIPP M8.8 Candidate 05.1 - User-Guide-Compliant Pyro Geometry

Built from Candidate 04.7.

## Implemented
- Exact documented shapes: sphere, tablet, grain, wafer, and tabular.
- Separate numeric value and unit controls for dimensional geometry fields.
- Physical-size-preserving length-unit conversion.
- Correct sphere, tablet, six-field grain, and wafer contracts.
- Transactional two-column CSV import with optional unit declarations, dimensional validation, and conversion.
- Tabular endpoint, row-count, finite-number, non-negative, equal-length, and monotonicity validation.
- Unsupported imported geometry is preserved unchanged but cannot be selected for new records.
- Twenty-two additive Candidate 05.1 qualification tests.

## Baseline
- Candidate 04.7 cumulative baseline: 311 tests.
- Candidate 05.1 additive tests: 22.
- Expected cumulative inventory: 333 tests.

## Live validation
Run the complete Scilab 2026.1.0+ / JCEF acceptance suite. Live host execution remains required for final promotion evidence.
