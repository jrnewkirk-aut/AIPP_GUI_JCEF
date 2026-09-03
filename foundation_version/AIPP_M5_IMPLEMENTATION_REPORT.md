# AIPP M5 Chamber Filter Management

## Scope
M5 migrates the legacy chamber filter subsystem into modular Foundation-native browser operations.

## Features
- Optional multi-filter collection for the active chamber.
- Stable filter identifiers and deterministic add/select/duplicate/remove behavior.
- Editable name, material, mass, density, specific heat, method, and coefficient.
- Supported heat-loss methods: `PERCENTAGE` and `KNTU`.
- Multi-orifice assignment restricted to orifices whose `from` chamber is the active chamber.
- Filter-to-orifice dependency scanning and deterministic index remapping after orifice removal.
- Responsive master/detail presentation with uninterrupted incremental field editing.

## Modular files
- `browser_files/js/application/10_aipp_chamber_filter_model.js`
- `browser_files/js/application/11_aipp_chamber_filter_view.js`
- `browser_files/js/testing/04s_aipp_m5_tests.js`

## Boundaries
No Foundation protocol, transport, plotting, observability, or bootstrap module was modified. Generated bundles were rebuilt from modular source.
