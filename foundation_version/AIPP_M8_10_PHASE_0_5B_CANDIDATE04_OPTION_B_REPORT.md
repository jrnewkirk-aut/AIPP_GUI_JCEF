# M8.10 Phase 0.5B Candidate 04: Option B Integration

Application version: `0.8.10-phase0.5b-candidate.4`

- Replaces the proposed presentation card primitives with Cytoscape-native SVG background images for Chamber, Tank, Orifice, and Wall.
- Adds Pyro and Filter count badges inside each Chamber image without adding Pyro or Filter graph nodes.
- Adds one transient interactive Chamber hover card in development, qualification, and production.
- Individual Pyro and Filter rows expose read-only native properties on hover or keyboard focus.
- Hides the card on graph pan, zoom, resize, background tap, and pointer departure.
- Keeps production JCEF debugging enabled temporarily.
- Preserves the Current / Phase 0.5B proposed selector.
- Adds tests AIPP-M810-004 through AIPP-M810-006.
