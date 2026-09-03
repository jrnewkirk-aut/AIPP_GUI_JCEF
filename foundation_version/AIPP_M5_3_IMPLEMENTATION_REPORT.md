# AIPP Foundation M5.3 Runtime Material Editor Update

## Runtime behavior
The chamber-filter material list is now requested from the Scilab host at editor startup. The host reads `application/data/material_list.json` on every request, so replacing that file before launching or reloading the editor changes both the dropdown and the complete read-only property panel without editing JavaScript. Property rows are generated from every key/value pair in the selected material record.

## Styling
The material select, field grid, orifice fieldset, read-only panel, property cards, focus treatment, spacing, borders, typography, and responsive behavior now use the existing chamber-filter design language.

## Public operation
- `application.aipp.materials.request`
- `application.aipp.materials.response`

## Protected files
None.

## Acceptance
Static syntax and package checks were performed. Full live Scilab/JCEF acceptance remains required.
