# BF-1 Body Force Implementation

- Added nested body-force master/detail collection inside Piston properties.
- Added deterministic constant-force creation, selection, removal, and empty state.
- Added constant magnitude editor with QUAFF-safe force units and physical-value-preserving conversion.
- Preserved unknown fields during ordinary magnitude edits.
- Kept all changes isolated in the piston working copy until Apply.
- Revert restores the complete original collection.
- Displacement/time body forces remain BF-2 scope.
