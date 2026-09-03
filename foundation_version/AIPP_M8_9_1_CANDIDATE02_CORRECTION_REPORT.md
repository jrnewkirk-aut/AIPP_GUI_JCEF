# AIPP M8.9.1 Candidate 02 Correction Report

## User-visible defect in Candidate 01
Candidate 01 packaged new orifice modules but the production contextual drawer continued to expose only the generic Properties and Raw surfaces. Dedicated Opening and Discharge Coefficient surfaces were absent.

## Root cause
- The production component contained no Opening or Discharge Coefficient tabs or panes.
- Routing inferred entity kind from the generic inspector instead of the authoritative topology selection.
- The coordinator was not explicitly loaded before contextual rendering.
- Candidate 01 rendered into the generic Properties host, allowing a competing generic render to replace it.
- Tests did not verify the actual mounted production DOM.

## Candidate 02 corrections
- Added Properties, Opening, Discharge Coefficient, and Raw tabs for orifices.
- Added dedicated Opening and Discharge pane hosts.
- Routed using authoritative topology selection kind.
- Explicitly loaded the orifice working copy before rendering.
- Rendered each surface into its own production pane.
- Added physical-value-preserving unit conversion.
- Added mounted-DOM tests AIPP-M891-016 through AIPP-M891-019.

## Expected visible result
Double-clicking an orifice exposes four tabs. Properties contains separate diameter value and unit controls. Opening contains pressure/event controls. Discharge Coefficient contains basis and constant/table controls.

## Static qualification
JavaScript syntax, dependency validation, all three builds, and build validation passed. The package contains 389 unique declared tests. Live Scilab/JCEF qualification remains pending; expected final results are 390, including the synthetic inventory result.
