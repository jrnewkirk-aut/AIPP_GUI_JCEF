# AIPP M8.8 Candidate 06.10 - Pyro Quantity Mode Correction

## Baseline
Candidate 06.9.

## Changes
- Added an Amount type selector with exactly Mass and Number.
- Mass mode presents a non-negative value with g/kg unit selection.
- Number mode presents a positive-integer, dimensionless piece count and hides the mass unit selector.
- Mass and Number working values are retained while switching modes; only the selected mode is validated and displayed.
- Assigned-pyro summaries display either mass with units or a piece count.
- Added a persistent dropdown arrow to the Triggering event Tom Select control.
- Expanded AIPP-M4-008 and AIPP-M4-011 coverage for quantity validation, conditional controls, persistence, summaries, and both dropdown affordances.

## Local validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validation: PASS
- Static source and rebuilt-bundle contract checks: PASS

## Required acceptance
Run the full live Scilab/JCEF suite in Scilab 2026.1.0 or newer.
