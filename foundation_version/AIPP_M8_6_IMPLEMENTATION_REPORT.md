# AIPP M8.6 Semantic Topology Layout — Candidate 01

## Baseline

Implemented on the qualified M8.5 Candidate 04 package. The original `014_AIPP_JSON_GUI` layout was used as the behavioral reference without copying its global-state architecture.

## Implemented

- New modular semantic layout service: `23_aipp_topology_semantic_layout.js`.
- Tank chamber resolution from native `assembly.tank_id`.
- Tank-rooted, leftward Cytoscape breadth-first layout.
- Deterministic native-path depth ordering.
- Tank-right post-layout enforcement.
- Walls removed from the flow-layout pass and repositioned semantically:
  - one associated chamber: below that chamber;
  - two associated chambers: below their midpoint;
  - no association: deterministic separate wall lane.
- Deterministic preset fallback positions if Cytoscape layout fails.
- Parallel orifices remain separate inline graph nodes.
- Layout positions remain transient and never enter native serialization.
- Selection is preserved across relayout and deck refresh.
- Added Relayout, Reset zoom, and Fit to view controls.
- Added eight additive M8.6 qualification tests.

## Validation

- JavaScript syntax checks: PASS
- Deterministic dev/test/prod build: PASS
- Build validator: PASS
- Test inventory: 290 declared, 290 unique
- M8.6 tests included only in the test bundle: PASS
- Semantic layout service included in dev/test/prod: PASS
- Production controls included: PASS

## Live qualification target

290 executed, 290 passed, 0 failed, 0 skipped.
