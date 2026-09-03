# AIPP M8.8 Production Shared Chamber Candidate 08.2

## Corrections

### Quaff-safe filter mass

- Replaced the combined mass text field with separate numeric value and unit controls.
- Allowed mass units are sourced from the shared Quaff-safe unit catalog: `kg` and `g`.
- Changing units converts the numeric value while preserving physical mass.
- Negative and non-finite mass values are rejected.
- The native filter record continues to store one Quaff-compatible quantity string.

### Exact outlet-orifice synchronization

- Filter changes now synchronize the currently selected filter into the selected chamber working copy.
- The synchronized native fields are limited to `mass`, `material`, `method`, `coefficient`, and `orifices`.
- Checkbox changes rebuild `orifices` from the currently checked controls, pass the list through the model's allowed-from-side validation, and then replace the chamber working-copy filter.
- Therefore, selecting only Outlet 1 produces `"orifices": [1]`; stale imported entries such as `2` are removed from the working copy.
- The change remains unapplied until the chamber-level Apply action is used, preserving the existing atomic working-copy contract.

## Validation

- JavaScript syntax checks: PASS
- Development/test/production build: PASS
- Build source/content hashes: PASS
- Quaff mass unit controls present in production: PASS
- Physical mass conversion present: PASS
- Checkbox-to-chamber working-copy synchronization present: PASS
- Exact selected-filter native replacement present: PASS
- ZIP integrity: PASS

## Live checks

1. Open a chamber filter whose native JSON initially contains `"orifices": [1, 2]`.
2. Leave only Outlet 1 checked.
3. Verify Raw shows `"orifices": [1]` before Apply.
4. Click Apply and verify the authoritative deck revision increments once.
5. Change mass from `76 g` to `kg`; verify the display becomes `0.076 kg`.
6. Change back to `g`; verify the display returns to `76 g`.
7. Save and reopen the deck and verify both mass and orifice assignment persist.
