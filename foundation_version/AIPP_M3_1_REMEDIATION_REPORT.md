# AIPP Foundation Integration M3.1 Remediation

## Reason for remediation
The M3 live run completed 196 tests with 193 passed and 3 failed. The generic recursive editor also exposed implementation-oriented dotted property names and did not preserve the recognizable AIPP editing presentation.

## Corrections
- Replaced the raw recursive field presentation with a grouped, source-faithful formulation editor.
- Added Thermochemical properties, Gas yields, and Wild-card gas sections.
- Replaced dotted implementation paths with human-readable labels while preserving the same model paths internally.
- Added a structured editor header, formulation selector, explicit state chips, Reset changes action, grouped responsive form layout, and visible error region.
- Added accessible labels to every generated property input and every editor/qualification control.
- Made AIPP-M3-005 and AIPP-M3-006 self-contained asynchronous tests. Each test now loads and selects its own formulation before exercising edit/reset behavior.
- Preserved the accepted M2 host adapter, 79-formulation source, working-copy isolation model, and modular source layout.
- Advanced the active AIPP milestone identity to 0.3.1-m3.1.

## Qualification target
Run the complete live Scilab/JCEF suite and require 196 passed, 0 failed, 0 skipped, exact inventory reconciliation, and zero active requests/transfers.
