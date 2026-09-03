# AIPP M8.8 Candidate 06.2 - Chamber Validation Interaction Fix

## Evidence reviewed

Candidate 06.1 live results executed 345 declared tests in Scilab 2026.1.0. The run reported 342 passes and four failures. The screenshot also showed a loaded Phase 2 chamber summary while the editor header and properties pane remained uninitialized.

## Root cause

The Candidate 06.1 validation component supplied standalone tab markup, but the chamber editor view still delegated tab visibility to the production contextual-workspace controller. The standalone validation environment therefore had no authoritative scoped tab switcher. The view also rendered properties only into `aippInspectorBody`, which does not exist in the test-only validation component.

## Corrections

- Added a validation-environment-scoped tab controller for Properties, Pyros, Filters, and Raw JSON.
- Added active-tab styling, `aria-selected`, roving `tabIndex`, and one-visible-pane enforcement.
- Added keyboard navigation with Left, Right, Home, and End.
- Rendered chamber properties into `aippChamberProperties` when the production `aippInspectorBody` host is absent.
- Synchronized chamber title, native path, and modified-state summary.
- Made the chamber card reload the first native chamber fixture when clicked.
- Kept existing pyro and filter managers composed inside their chamber-scoped tabs.
- Updated the existing M8.8 P2-002 regression to click every tab and verify exactly one matching pane becomes visible.
- Corrected P2-010 to read the authoritative revision from `snapshot().meta.revision`.
- Updated legacy M4 and M5 visibility tests to activate their composed tab before checking geometry and editability.

## Local validation

- JavaScript syntax checks: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validation: PASS, zero errors
- Generated test bundle contains the scoped interaction controller and revised regression coverage.

## Required live validation

Run the full test suite in Scilab 2026.1.0 or newer. Confirm that clicking each chamber editor tab changes the visible pane and that the four Candidate 06.1 failures are cleared.
