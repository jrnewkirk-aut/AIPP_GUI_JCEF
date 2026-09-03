# AIPP M8.9.1 Orifice Complete Correction 02

## Evidence reviewed
The live Scilab/JCEF run executed all 417 declared tests and produced 418 final results. Inventory and runtime health were clean, but 12 M8.9.1 browser tests failed.

## Root causes
1. The qualification workspace fixture was only a minimal M7 shell. It did not contain the Orifice Opening pane, Discharge Coefficient pane, contextual tabs, Raw pane, or the production workspace CSS class. Nine failures were therefore fixture failures, not missing production behavior.
2. The endpoint dependency test changed `from` from chamber 1 to chamber 2 while `to` was already chamber 2. Validation correctly rejected that self-connection before dependency cleanup could be tested.
3. The scrolling correction had not been represented by a production-equivalent workspace class in the qualification fixture. The document scroll test passed, but the workspace containment assertion observed `visible` overflow on the incomplete fixture.

## Corrections
- Replaced the minimal M7 qualification fragment with a production-shaped test workspace containing the complete Orifice contextual DOM contract.
- Added the `aipp-workspace`, `aipp-main-panel`, `aipp-editor-frame`, and contextual layout classes required for computed-style qualification.
- Added Properties, Opening, Discharge Coefficient, and Raw test panes with the production IDs used by the Orifice view.
- Retained normal qualification document scrolling while constraining only `.aipp-workspace`.
- Expanded the endpoint fixture with a third chamber and changed the dependency cleanup transition to chamber 3, preserving a valid `from != to` relationship.
- Added explicit tests for the complete qualification fixture and valid alternate-chamber dependency cleanup.

## Added tests
- AIPP-M891-046: qualification document remains vertically scrollable.
- AIPP-M891-047: workspace containment does not lock the document.
- AIPP-M891-048: qualification fixture mounts the complete Orifice pane contract.
- AIPP-M891-049: dependency cleanup uses a valid alternate chamber.

## Validation
- JavaScript syntax: PASS
- Development/test/production builds: PASS
- Build validator and hashes: PASS
- Declared tests: 419 unique
- Complete Orifice feature mapping: 49 of 49
- Test bundle contains all required contextual pane IDs: PASS
- Test bundle contains production-equivalent workspace class: PASS
- Production excludes test registration: PASS

## Live target
Expected Full Acceptance result: 420 total, consisting of 419 declared tests and one synthetic inventory result, with zero failures and zero skipped tests.
