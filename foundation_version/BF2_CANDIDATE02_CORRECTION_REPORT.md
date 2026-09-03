# BF2 Candidate 02 Correction

## Corrected
- Fixed body-force CSV splitting for LF, CRLF, and CR line endings.
- Preserved UTF-8 BOM removal, trailing blank-line handling, unit-header validation, signed force values, and increasing independent-variable checks.
- Added regression coverage using the reported `bodyForce_time.csv` content.
- Mass lookup laws now always use `continuity: "interpolate"`.
- Removed the mass-law Continuity selector from the structured editor.
- Basis and source transitions deterministically retain interpolate continuity.
- Imported mass laws using discrete continuity are rejected by validation.
