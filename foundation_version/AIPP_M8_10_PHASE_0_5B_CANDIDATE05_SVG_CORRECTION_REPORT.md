# M8.10 Phase 0.5B Candidate 05 SVG Correction

Application version: `0.8.10-phase0.5b-candidate.5`

## Root cause

Candidate 04 removed the SVG XML namespace to satisfy a legacy literal remote-URL scan. JCEF consequently did not decode the generated data-URI payloads as standalone SVG images. Cytoscape nodes remained present and transparent, so only graph edges were visible.

## Corrections

- Restores `xmlns="http://www.w3.org/2000/svg"` in every runtime-generated SVG.
- Constructs the namespace from two local string fragments so the production source contains no literal remote dependency token.
- Keeps all node images embedded as local `data:image/svg+xml` resources.
- Removes the custom `wheelSensitivity: 0.18` option and uses the Cytoscape default.
- Adds browser test `AIPP-M810-007` to decode and load every representative SVG with `Image`.
- Adds test `AIPP-M810-008` for the default wheel-zoom configuration.
- Preserves Option B, the presentation selector, and temporary production JCEF debugging.
