# AIPP M8.8 Candidate 06.13 - Burn-Rate Modifications Integration

## Baseline
Candidate 06.12 supplied by the user.

## Implemented
- Added Burn-rate model selection between Formulation power law and Pressure / burn-rate table.
- Made Use formulation value, Override, and Scale functional for reference burn rate, burn-rate exponent, and temperature sensitivity.
- Override initializes from the protected formulation working copy.
- Scale initializes to 1 and removes the corresponding override.
- Imported override/scale conflicts are displayed and resolvable.
- Added pressure and burn-rate unit selectors, matched arrays, editable cells, Add row, and Remove row.
- Model switching removes inactive-model fields deterministically.
- Temperature sensitivity remains available in table mode.
- Removed the non-guide synthetic mode field from new records.

## Validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validator: PASS
- Production/test bundle checks: PASS
- Five focused browser regression tests added.

## Required acceptance
Run the full live Scilab/JCEF suite with Scilab 2026.1.0 or newer.
