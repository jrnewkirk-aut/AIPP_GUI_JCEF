# AIPP M8.8 Candidate 05.2 - Live Scilab/JCEF Regression Checklist

Use Scilab 2026.1.0 or newer and the canonical qualification launcher `app/main.sce`.

## Automated acceptance

- [ ] Host-ready handshake completes.
- [ ] Runtime reports Scilab 2026.1.0 or newer.
- [ ] Declared executable tests = 333.
- [ ] Executed executable tests = 333.
- [ ] Passed = 333; failed = 0; skipped = 0.
- [ ] Missing, unexpected, and duplicate test IDs are all empty.
- [ ] Synthetic `MF-INVENTORY-RESULT` is PASS.
- [ ] Final active requests = 0 and active transfers = 0.
- [ ] Console/runtime errors are empty.

## Focused geometry UI

- [ ] New geometry selector shows only sphere, tablet, grain, wafer, tabular in that order.
- [ ] Sphere shows Radius as separate numeric value and unit controls.
- [ ] Tablet shows diameter, total_height, dome_height with paired controls.
- [ ] Grain shows inner_diameter, outer_diameter, fin_diameter, num_fins, fin_thickness, cylinder_height.
- [ ] `num_fins` accepts integers only and has no unit control.
- [ ] Wafer shows inner_radius, outer_radius, height with paired controls.
- [ ] Changing mm to cm converts the number while preserving physical size.
- [ ] Geometry values survive pyro switching and full rerender.
- [ ] Imported cylinder/disk/custom geometry remains unchanged and is not newly selectable.
- [ ] Deliberately selecting a supported geometry replaces the unsupported geometry.

## Tabular and preservation

- [ ] Valid two-column CSV import succeeds transactionally.
- [ ] Cancelled, malformed, wrong-column, and wrong-dimensionality imports leave the model unchanged.
- [ ] First burn distance is zero; distances strictly increase; final surface area is zero.
- [ ] Unknown sibling properties and untouched native precision survive save/round trip.

## JCEF viewport

- [ ] No horizontal document overflow at 1728x887, 1366x768, 1280x720, and 1024x768.
- [ ] Geometry value/unit controls remain reachable and aligned.
- [ ] Apply/Revert/Validate and test export controls remain reachable.
