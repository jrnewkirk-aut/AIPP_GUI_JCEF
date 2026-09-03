# Candidate 06 Validation Report

**Status:** Static validation passed. Live Scilab/JCEF validation remains required.

## Passed checks

- JavaScript syntax checks for all modified JavaScript files
- Complete protected formulation inventory count: 79
- Dependency-manifest source hashes
- Development, test, and production bundle rebuild
- Static build validation
- M8.10 Phase 0.5B validation
- Feature/test/embedded manifest synchronization
- Declared test inventory: 497
- Deterministic second rebuild with identical dev, test, and production bundle hashes
- Candidate 06 mounted-interaction test source includes real input events, visible dropdown inspection, and result clicks

## Deterministic bundle hashes

- Development: `b3c2ed48858a669afbccfb2d19fe656f56a5a3d241bb09f26306e3e5ee316aff`
- Test: `d498708f65bf55dc75f15ad40d31821e34eba788dc73ef03f8a2bed6ade71354`
- Production: `bcbd4d41ee92e4f6ace99eab9bbcea1b1431b7a559490698e1759dabe85d63f9`

## Required live validation

Run the Candidate 06 test bundle through the supported Scilab/JCEF launcher under Scilab 2026.1.0 or newer. Confirm all 497 declared tests execute, capture the resulting protocol JSON, and manually reproduce a `pnp` formulation search in an imported chamber with multiple pyros.

No Candidate 06 live-suite pass is claimed by this report.
