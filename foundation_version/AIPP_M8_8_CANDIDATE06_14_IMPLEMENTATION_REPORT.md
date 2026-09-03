# AIPP M8.8 Candidate 06.14 - Pyro Action Toolbar Placement

## Baseline
Candidate 06.13.

## Change
- Moved Add chamber pyro, Duplicate, Move up, Move down, and Remove pyro into one toolbar at the top of the selected-pyro detail editor.
- Removed the former bottom action row.
- Preserved the original Add button ID and event behavior by moving the existing DOM control into the top toolbar.
- Added accessible labels and titles to the move controls.
- Added responsive wrapping for narrow windows.

## Validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validator: PASS
- Production/test bundle checks: PASS
- Focused toolbar-placement regression: PASS (static inclusion; full live suite required).
