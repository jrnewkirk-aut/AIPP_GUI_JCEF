# Candidate 06.0 Live Scilab/JCEF Checklist

Run with Scilab 2026.1.0 or newer using `app/main.sce`.

## Inventory
- [ ] Declared executable tests: 345
- [ ] Executed executable tests: 345
- [ ] Passed: 345
- [ ] Failed: 0
- [ ] Skipped: 0
- [ ] Missing IDs: 0
- [ ] Unexpected IDs: 0
- [ ] Duplicate IDs: 0
- [ ] Synthetic `MF-INVENTORY-RESULT`: PASS
- [ ] Exported result rows: 346 when the synthetic row is included

## Phase 2 chamber editor
- [ ] Selecting a chamber opens one chamber-scoped isolated working copy.
- [ ] Properties, Pyros, Filters, and Raw panes are available in one contextual editor.
- [ ] Pyro and filter panes continue to use the existing model services.
- [ ] Controlled chamber quantities display numeric text and units separately.
- [ ] Editing one quantity does not reformat untouched quantities.
- [ ] Revert restores all original native scalar text.
- [ ] Validate reports negative or non-finite controlled quantities.
- [ ] Apply commits exactly one chamber atomically and marks the deck dirty.
- [ ] Unknown chamber sibling properties survive Apply.
- [ ] Mixture presets do nothing until a preset button is explicitly used.
- [ ] Raw pane reflects the current chamber working copy.
- [ ] One-field save/open round trip preserves untouched precision text.

## Regression
- [ ] Candidate 05.1 geometry tests remain green.
- [ ] No production test API or test registration leakage.
- [ ] Final active requests and transfers are zero.
- [ ] JCEF console/runtime errors are empty.
- [ ] No horizontal overflow in the standard qualification viewport.
