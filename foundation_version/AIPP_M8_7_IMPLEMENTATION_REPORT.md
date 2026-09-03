# AIPP M8.7 Context-Aware Native Property Inspector — Candidate 01

## Baseline

Implemented directly on the user-supplied, live-qualified M8.6 Candidate 01 package.

## Implemented

- Structured inspector for selected chamber, orifice, and wall native records.
- Isolated working-copy lifecycle: select, edit, validate, Apply, and Revert.
- Atomic single-revision commits through the authoritative deck document.
- Scalar field editors with type-aware number, boolean, and text controls.
- Chamber selectors for native orifice `from` and `to` endpoints.
- Validation that rejects missing, out-of-range, and self-connected endpoints.
- Preservation of unknown nested properties and untouched precision-bearing strings.
- Modified/unmodified status and inline validation feedback.
- Collapsible Advanced / Raw record display.
- Selection restoration through the existing topology navigation service after Apply.
- Ten additive M8.7 qualification tests.

## Validation

- JavaScript syntax checks: PASS
- Deterministic dev/test/prod build: PASS
- Build validator: PASS
- Test inventory: 300 declared, 300 unique
- M8.7 test code included only in the test bundle: PASS
- Inspector model and view included in dev/test/prod: PASS
- Production surface includes structured inspector controls: PASS

## Live qualification target

300 executed, 300 passed, 0 failed, 0 skipped.
