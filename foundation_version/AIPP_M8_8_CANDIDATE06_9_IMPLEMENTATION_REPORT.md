# AIPP M8.8 Candidate 06.9 — Chamber Pyro Formulation Identity Correction

## Baseline

Candidate 06.8, supplied after a 346/346 passing live Scilab/JCEF run.

## Implemented changes

- Removed the editable **Name** field from the chamber-scoped pyro editor.
- The selected pyrolist **Formulation** is now the visible identity in the assigned-pyro list and selected-pyro heading.
- Preserved the stable internal pyro ID and the existing native/working-copy data contracts.
- Added a persistent downward arrow to the locally packaged Tom Select formulation control. The arrow rotates while the dropdown is open.
- Updated `AIPP-M4-011` to verify that the Name field is absent, exactly one formulation selector exists, the arrow is visible, the selector focuses and opens, formulation selection updates the model and list, and the stable internal ID does not change.

## Local validation

- JavaScript syntax checks: PASS
- P6.3 deterministic build and reproducibility: PASS
- Source and rebuilt-bundle contract checks: PASS

## Required acceptance

Run the full live Scilab/JCEF acceptance suite. Candidate 06.9 is not considered accepted until the full suite passes in the qualified Scilab 2026.1.0+ environment.
