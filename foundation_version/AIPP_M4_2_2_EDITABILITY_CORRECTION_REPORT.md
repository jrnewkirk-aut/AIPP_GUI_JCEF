# AIPP M4.2.2 Editability Correction

## Observed defect
The M4.2.1 chamber-pyro workspace rendered correctly, but clicking any form control triggered the manager's delegated click handler, which unconditionally rebuilt the entire detail panel. The active input was destroyed before normal editing could continue, making enabled fields behave as if read-only.

## Correction
- Full rendering now occurs only for structural actions: selecting, duplicating, removing, and reordering pyros.
- Text, numeric, trigger, and geometry fields update the model through incremental `input` handling without replacing the active DOM control.
- The selected list card, selected heading, and validation output update incrementally while focus and caret remain intact.
- Formulation and shape changes retain full rendering because those choices replace protected working-copy or shape-dependent structures.
- Existing M4 test `AIPP-M4-011` now enters a multi-character name and verifies the full value, retained focus, stable pyro ID, updated model, and exactly one name editor.

## Expected behavior
Name, mass, piles, triggering event, delay, and geometry values are directly editable. Formulation and shape selectors remain editable and may refresh the detail panel after selection.
