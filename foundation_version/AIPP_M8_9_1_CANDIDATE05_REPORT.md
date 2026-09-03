# AIPP M8.9.1 Candidate 05 Report

## Shared tabular editor
- Promoted the accepted Pyro table appearance to semantic shared classes: `aipp-tabular-editor`, `aipp-tabular-toolbar`, `aipp-tabular-table`, and `aipp-tabular-help`.
- Retained `aipp-m88-*` compatibility aliases so the accepted Pyro editor does not regress.
- Updated both Pyro tabular geometry and Orifice Cd tables to consume the same shared contract.
- Removed the conflicting visual effect of the Candidate 04 Cd-specific rules through explicit shared-component overrides.
- Standardized blue Add row, Import CSV, and Remove actions, cell sizing, table borders, spacing, and help text.
- Hardened Cd unit rendering so table headers and CSV guidance use the selected GUI unit.

## Responsive vertical workspace
- Replaced the fixed minimum-height behavior with a viewport-filling flex layout.
- Uses `100dvh` when available and `100vh` as a compatibility fallback.
- Header, main tabs, toolbar, and footer remain fixed-size regions; the editor frame receives the remaining height.
- The contextual editor body is the intentional internal scroll region.
- Added compact spacing for short displays and a document-flow fallback for narrow/mobile viewports.

## Validation
- JavaScript syntax: PASS.
- Development/test/production builds: PASS.
- Build validator and source hashes: PASS.
- Declared test IDs: 402 unique.
- Added AIPP-M891-029 through AIPP-M891-032.
- Production contains shared table and viewport contracts and excludes test registrations: PASS.

## Live qualification
Pending full Scilab/JCEF acceptance. Expected final result count: 403, consisting of 402 declared tests plus one synthetic inventory result.
