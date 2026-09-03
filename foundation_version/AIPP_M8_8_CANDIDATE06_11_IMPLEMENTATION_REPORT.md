# AIPP M8.8 Candidate 06.11 - Tabular CSV Import

## Baseline
Candidate 06.10 supplied by the user.

## Implemented behavior
- Added an Import CSV button and local `.csv` file chooser for tabular pyro geometry.
- CSV row 1 contains exactly two units: burn distance first and surface area second.
- The two CSV units must exactly match the units currently selected in the GUI.
- Numeric burn-distance and surface-area pairs begin on CSV row 2.
- Import remains atomic: parsing, unit, numeric, column-count, or tabular-geometry errors leave the existing table unchanged.
- Existing tabular validation remains authoritative, including minimum row count, equal arrays, zero initial burn distance, monotonic distances, and zero final surface area.
- Added an inline error surface without replacing the existing geometry table.

## CSV example
```csv
mm,mm2
0,100
0.5,75
1,0
```

## Local validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validator: PASS
- Source and rebuilt bundle consistency: PASS

## Required acceptance
Run the full live Scilab/JCEF acceptance suite using Scilab 2026.1.0 or newer.
