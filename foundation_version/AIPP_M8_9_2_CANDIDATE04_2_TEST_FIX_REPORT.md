# AIPP M8.9.2 Candidate 04.2 Test Fixture Correction

## Scope
Corrects the qualification fixture for `AIPP-M892-024`, "All boundary subtypes survive serialization."

## Root cause
The `WALL` subtype case changed Wall 1 right connection to reference Wall 2 while the shared fixture already had Wall 2 referencing Wall 1. This created a 1 -> 2 -> 1 cycle, so the production cycle validator correctly rejected Apply.

## Correction
For the `WALL` subtype case only, the test now starts with an acyclic fixture in which Wall 2 has a terminal `CONSTANT_TEMPERATURE` left connection before Wall 1 references Wall 2. All other subtype cases retain the original fixture.

The production Wall editor, cycle detection, serialization, and native document contracts were not weakened or changed.

## Validation
- Rebuilt development, test, and production bundles with `tools/build/build_p63.py`.
- Ran `tools/build/validate_build.py` successfully.
- Confirmed the corrected test source is included in `bundle.test.html`.
- Confirmed the production bundle remains free of test registration code.
- Rerun the live Scilab/JCEF acceptance suite with Scilab 2026.1.0 or newer for final 454/454 evidence.
