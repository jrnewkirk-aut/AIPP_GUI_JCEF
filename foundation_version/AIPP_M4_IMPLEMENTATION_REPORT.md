# AIPP Foundation Integration M4

## Scope
M4 adds chamber-level pyro assignment and management on the accepted M3.2 baseline.

## Implemented
- Stable chamber pyro identifiers and deterministic selection.
- Add, duplicate, remove, and reorder operations.
- Assignment from the 79-formulation master library.
- Independent formulation working copies per chamber pyro.
- Mass, pile quantity, triggering event, delay, and shape-specific defaults.
- Validation and accessible responsive management controls.
- Twelve additive browser/integration qualification tests.

## Boundaries
The M3 formulation editor remains unchanged and reusable. Foundation protected modules are unchanged. Generated bundles are rebuilt from modular source.

## Acceptance
The live suite must pass all 208 declared tests with zero failures/skips and clean final protocol state.
