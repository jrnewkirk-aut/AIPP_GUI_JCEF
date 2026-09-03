# AIPP M8.8 Candidate 06.15 - Empty Pyro and Filter Actions

## Baseline
Candidate 06.14.

## Change
- Added an Add chamber pyro button to the zero-pyro detail state.
- Added an Add chamber filter button to the zero-filter detail state.
- Both buttons create and select the new entity immediately, then render the normal editor.
- The pyro uses the first protected formulation, mass quantity, one pile, SimStart ignition, zero delay, sphere geometry, and formulation burn-rate defaults.
- The filter uses the first available material (falling back to steel), zero mass, PERCENTAGE method, zero coefficient, and no orifice assignments.
- Added styling for clear, accessible zero-state primary actions.

## Validation
- JavaScript syntax: PASS
- P6.3 deterministic build and reproducibility: PASS
- Build validator: PASS
- Production bundle inclusion: PASS
- ZIP integrity: PASS

Full live Scilab/JCEF acceptance remains required.
