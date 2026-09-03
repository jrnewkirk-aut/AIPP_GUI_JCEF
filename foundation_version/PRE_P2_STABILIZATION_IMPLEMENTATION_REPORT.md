# Pre-P2 Stabilization Candidate Implementation Report

## Scope

This candidate stabilizes the Cytoscape topology layout before P2 by applying the proven layout strategy from the preserved legacy GUI to the current modular semantic-layout implementation.

## Implemented changes

- Retained tank-rooted, leftward breadth-first topology flow.
- Increased breadth-first spacing factor from 0.9 to 1.15 for the current larger semantic cards.
- Enabled label-aware node dimensions.
- Increased final fit padding from 70 to 100.
- Restored the legacy-derived tank terminal margin of 260.
- Restored the legacy-derived wall placement baseline of 230 vertical units and 115 horizontal units.
- Added deterministic multi-row wall placement for more than five walls sharing an anchor.
- Changed tank-right enforcement to use rendered bounding boxes instead of node center positions.
- Added a deterministic rendered-bounding-box collision pass after semantic positioning.
- Preserved transient layout geometry. No position data is serialized into the native AIPP deck.
- Preserved modular source ownership and rebuilt development, test, and production bundles.

## Validation status

Static package validation passed. Live Scilab/JCEF visual acceptance remains required for the BPS fixture and a large production deck.
