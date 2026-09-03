## P5.4 Reusable Starter Baseline Report

### Authoritative source

P5.4 is built from the live-accepted P5.3.2 package, which completed 95 of 95 automated tests on Scilab 2026.1.0 with exact test inventory and clean final state.

### Starter boundary

- `app/starter_main.sce` is the reusable production starter launcher.
- `app/main.sce` remains the qualification launcher.
- Starter profile excludes plotting, testing, test routes, test UI, and JCEF debugging.
- Host extension point: `scilab/handlers/application_handlers.sci`.
- Browser extension point: `browser_files/js/application/01_example_service.js`.
- Protocol, build, lifecycle, and ownership infrastructure remain foundation-owned.

### Added qualification

Eight tests cover canonical entrypoints, required modules, production profile, production exclusion, extension points, release identity, live starter operation, and clean protocol state. Expected total is 103.

### Rollback

Restore `scilab_jcef_foundation_p5.3.2_v0.1.zip` and its accepted `protocol_results_5.3.2.json` evidence.
