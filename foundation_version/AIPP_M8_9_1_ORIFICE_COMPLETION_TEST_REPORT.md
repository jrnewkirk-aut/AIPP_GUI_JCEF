# AIPP M8.9.1 Orifice Completion Test Report

## Completion decision
The Orifice editor is accepted as feature-complete for the current GUI milestone. Candidate 05.2 establishes the durable regression baseline for all behavior accepted through Candidate 05.1.

## Regression scope
The M8.9.1 feature now maps 45 tests covering:

- Editor, coordinator, and contextual-workspace registration
- Isolated working-copy behavior, Apply, Revert, dirty state, and authoritative revision control
- Preservation of native precision and unknown extension fields
- Endpoint validation and one-based `number: label` chamber options
- Orifice geometry, initial state, one-way flow, viscous factor, opening criteria, events, and time delay
- Filter dependency impact and deterministic cleanup on Apply
- Constant, time-dependent, and pressure-dependent discharge coefficients
- Continuity initialization and state/display synchronization
- Structured Cd tables, row addition, row removal, cell editing, and matched arrays
- CSV unit headers, valid imports, atomic rejection, nonnumeric values, column counts, coordinate ordering, and Cd range validation
- Apply/reload persistence for time and pressure table contracts
- Shared Pyro/Orifice tabular CSS classes, accessible controls, and selected-unit rendering
- Correct Orifice identity, contextual panes, and viewport-filling layout activation
- Apply disabling for validation failures and proper Apply/Revert enablement for dirty valid state
- Clean document, request registry, and transfer registry after the completed workflow

## New closure tests
- AIPP-M891-036: pressure-dependent native contract persistence
- AIPP-M891-037: time CSV import persistence through Apply and reload
- AIPP-M891-038: invalid dependent rows disable Apply
- AIPP-M891-039: return to constant Cd after dependent editing
- AIPP-M891-040: row removal preserves matched arrays
- AIPP-M891-041: endpoint labels retain one-based native values
- AIPP-M891-042: all accepted contextual panes are active
- AIPP-M891-043: CSV failure remains atomic
- AIPP-M891-044: Apply/Revert state follows dirty and validation state
- AIPP-M891-045: completed workflow leaves document and protocol state clean

## Static validation
- JavaScript syntax: PASS
- Development, test, and production build: PASS
- Build validator and source hashes: PASS
- Declared tests: 415
- Unique declared IDs: 415
- M8.9.1 Orifice tests declared and mapped: 45 of 45
- Test bundle includes AIPP-M891-045: PASS
- Production contains the Orifice editor, shared table contract, and viewport contract: PASS
- Production excludes test registration: PASS

## Live qualification gate
Run Full Acceptance in Scilab 2026.1.0 or newer. Require:

- 415 declared tests executed
- 416 final results including the synthetic inventory result
- 0 failed
- 0 skipped
- 0 missing test IDs
- 0 unexpected test IDs
- 0 duplicate result IDs
- 0 active requests
- 0 active transfers
