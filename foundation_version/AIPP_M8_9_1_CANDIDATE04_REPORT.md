# AIPP M8.9.1 Candidate 04 Report

## Implemented
- Replaced time-dependent and pressure-dependent discharge coefficient text areas with structured editable tables.
- Added Add row, per-row Remove, and Import CSV controls.
- Preserved the native time_array, pressure_array, and Cd_array schema.
- CSV row 1 must exactly match the selected independent-variable unit and Cd, such as `s,Cd` or `MPa,Cd`.
- CSV imports are atomic and reject unit mismatches, invalid column counts, nonnumeric values, non-increasing coordinates, and Cd outside 0 to 1.5.
- Added inline CSV error feedback and AIPP-M891-023 through AIPP-M891-028 coverage.

## Static validation
- JavaScript syntax: PASS.
- Development, test, and production build: PASS.
- Build validator: PASS.
- Production contains structured Cd tables and excludes the former textarea contract: PASS.

## Live qualification
Pending full Scilab/JCEF acceptance.
