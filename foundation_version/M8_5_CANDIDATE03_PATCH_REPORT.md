# AIPP M8.5 Candidate 03 Patch Report

## Root cause corrected

Candidate 02 replaced the authoritative deck but assumed the topology canvas had already installed its DOMContentLoaded subscription. During the browser test phase, the suite can execute before that binding is installed. The deck fixture therefore existed, but the Cytoscape instance still contained the prior graph, so `selectPath()` returned false.

Candidate 03 makes the browser test lifecycle-independent:

1. Replace the authoritative deck with a deterministic one-chamber fixture.
2. Explicitly rebuild the topology canvas with `render(true)`.
3. Subscribe directly to the canvas selection event before selection.
4. Select the native path and validate the resolved record from the emitted selection detail.
5. Unsubscribe, restore the prior deck, and explicitly rebuild the canvas again in `finally`.

No production selection behavior or visuals were changed.

## Validation

- JavaScript syntax: PASS
- Deterministic build: PASS
- Build validation: PASS
- AIPP-M85-003 appears exactly once in the test bundle
- Candidate 03 test no longer depends on DOMContentLoaded ordering or navigation binding state
