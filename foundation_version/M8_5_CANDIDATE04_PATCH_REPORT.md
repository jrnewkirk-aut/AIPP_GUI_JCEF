# AIPP M8.5 Candidate 04 Patch Report

## Confirmed Candidate 03 failure location

The Candidate 03 stack column points to `P4.assert.true(C().render(true))`, not the subsequent path-selection assertion.

## Root cause

The qualification test bundle does not include the production AIPP workspace component, so there is no `#aippTopologyCanvas` element in the test DOM. The production canvas API intentionally returns `false` when its host element is absent. Candidate 03 therefore failed before selection was attempted.

## Correction

`AIPP-M85-003` now creates an off-screen, test-only `#aippTopologyCanvas` host when the production host is absent. It then:

1. Installs a deterministic one-chamber native deck fixture.
2. Renders Cytoscape into the temporary host.
3. Subscribes to the canvas selection event.
4. Selects the deterministic native document path.
5. Verifies the selected path and resolved native chamber record.
6. Clears selection, restores the prior authoritative deck, rerenders, unsubscribes, and removes the temporary host in `finally`.

No application production code, visual styling, or manual selection behavior was changed.

## Static validation

- JavaScript syntax: PASS
- Deterministic build and reproducibility: PASS
- Build validator: PASS
- Temporary host is attached before render: PASS
- Native selection and resolved-record assertions remain present: PASS
- Temporary host cleanup is present: PASS
- `AIPP-M85-003` registration is unique: PASS
