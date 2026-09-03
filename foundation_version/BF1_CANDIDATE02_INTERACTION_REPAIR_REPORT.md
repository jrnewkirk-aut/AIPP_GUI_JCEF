# BF-1 Candidate 02 Interaction Repair

## Root cause
The piston editor attached handlers individually to transient controls after each full DOM replacement. In the production drawer lifecycle those handlers were not dependable, leaving native select behavior visible without a working-copy mutation.

## Repair
- Replaced per-control handlers with stable event delegation on `aippInspectorBody`.
- Restored Add/select/remove body-force interactions.
- Restored basis transitions for mass, area, and friction laws.
- Restored Table/CSV source transitions, travel controls, unit controls, Apply, and Revert through the same delegated event layer.
- Added six browser interaction tests that dispatch real click/change events and verify both model and DOM changes.
