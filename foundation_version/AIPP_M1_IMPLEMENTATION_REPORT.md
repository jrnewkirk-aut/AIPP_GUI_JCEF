# AIPP Foundation Integration M1

## Scope

This derivative proves the Foundation application-extension path with an AIPP-branded shell and `application.aipp.status.request`. The verified AIPP modular source is preserved under `application/legacy_source_baseline/` but not loaded at runtime.

## Active implementation

- AIPP Scilab application registry, state, and status handler
- Request and response payload schemas
- Browser status service and shell controller
- AIPP shell component and application-owned CSS
- AIPP pyrolist copied to application-owned data
- Additive M1 browser tests
- Dev/test/prod dependency-manifest entries

## Intentionally inactive

The existing AIPP editors, graph, topology workflows, file operations, deck conversion, and legacy transport remain staged unchanged. They will be migrated incrementally after M1 validation.

## Live acceptance

Run with Scilab 2026.1.0 or newer. Use `app/main.sce` for the qualification harness and `app/starter_main.sce` for production.
