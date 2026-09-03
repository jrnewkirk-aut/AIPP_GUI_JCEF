# Pre-P2 Stabilization Candidate 03 Implementation Report

Candidate 03 corrects the chamber-editor working projection while retaining `P2.application.aippDeckDocument.native` as the sole canonical model.

## Corrections

- Native pyros and the native filter hydrate into transient editor projections on chamber selection or accepted master revision only.
- Selecting rows no longer causes master-document rehydration.
- Add, duplicate, remove, reorder, and field edits remain in the working projection until Chamber Apply.
- Each working mutation synchronizes the complete chamber working copy without mutating the master JSON.
- Chamber Apply remains the atomic commit boundary. The accepted master revision then becomes the source for fresh hydration.
- The Formulation selector uses the union of library formulations and the selected native formulation, so imported formulations remain visible even before or outside library matching.
- GUI-only IDs and row-selection state remain transient.
- Unknown native pyro and filter fields are preserved by the projection adapters.
- Candidate 01 layout stabilization and native wall association behavior are retained.
- Six interaction and authority regression tests were added.
