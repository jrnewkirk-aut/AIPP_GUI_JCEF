# AIPP M8.8 Candidate 06.12 - Quaff Surface-Area Unit Correction

## Baseline
Candidate 06.11 supplied by the user.

## Correction
- Replaced compact area-unit selector values `mm2`, `cm2`, and `m2` with Quaff spellings `mm^2`, `cm^2`, and `m^2`.
- Changed the default tabular `surface_area_units` value to `mm^2`.
- Preserved caret spelling in the working model and imported tabular geometry.
- Kept internal dimensional normalization for conversion and validation only.
- Enforced exact CSV-to-GUI spelling before normalization, so `mm2` cannot satisfy a GUI selection of `mm^2`.
- Retained the atomic CSV import behavior from Candidate 06.11.

## Accepted CSV example
```csv
mm,mm^2
0,0.33
1,0.15
2,0
```

## Validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validator: PASS
- Production and test bundle consistency: PASS

## Required acceptance
Run the full live Scilab/JCEF suite using Scilab 2026.1.0 or newer.
