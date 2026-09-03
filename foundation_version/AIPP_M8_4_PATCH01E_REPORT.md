# AIPP M8.4 Patch 01e

## Correction

Patch 01e rebuilds the development, test, and production artifacts from the current Patch 01d source tree so the offline Cytoscape 3.33.4 runtime is physically embedded before the graph runtime and topology view execute.

## Root cause

The Patch 01d source tree and build manifests declared Cytoscape, but the shipped generated HTML bundles were stale and remained approximately 147 KB in production. The executing JCEF artifact therefore had the topology adapter and entity hydration but no `cytoscape` global.

## Prevention

`tools/build/build_p63.py` now fails if any active JavaScript module lacks its `// SOURCE:` marker in the generated artifact. Production acceptance also requires the Cytoscape vendor, graph-runtime adapter, and Cytoscape topology-view source markers.

## Validation

- Deterministic two-pass build: PASS
- Build validation: PASS
- Cytoscape source embedded in dev/test/prod: PASS
- Graph runtime embedded after declared dependency resolution: PASS
- Production acceptance contract updated: PASS
- Existing modular application sources preserved: PASS

The live Scilab/JCEF acceptance suite must be rerun in the target environment; expected closure is AIPP-M84-009 changing from FAIL to PASS.
