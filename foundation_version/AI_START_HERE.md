# AI_START_HERE — Scilab–JCEF AI Foundation Template

## Purpose
Use this package as the required baseline when creating a modular Scilab–JCEF GUI application.

## Supported baseline
- Scilab: **2026.1.0 or newer**
- Accepted source release: **P8.5.0-0.1**
- Runtime foundation: **P6.4.0-0.1**
- Observability: **P7.5.0-0.1**
- Protocol: **1**

## Start here
- Production starter: `app/starter_main.sce`
- Qualification harness: `app/main.sce`
- Application manifest: `application/application_manifest.json`
- Application Scilab extensions: `application/scilab/`
- Application browser extensions: `browser_files/js/application/`

## Non-negotiable rules
1. Preserve modular source. Do not combine maintained JavaScript into one manually edited file.
2. Do not edit files under `browser_files/dist/`; rebuild them from modular source.
3. Keep full-resolution engineering datasets and engineering calculations in Scilab.
4. Use safe structured JSON for control messages and direct numerical batches for bulk finite-double data.
5. Use the existing request, transfer, cancellation, supersession, logging, and cleanup services.
6. Do not place application business logic in the central protocol callback.
7. Do not modify protected foundation modules for an application-only feature.
8. Add a public schema and tests for every new public operation.
9. Add application-specific tests without deleting, skipping, weakening, or relabeling foundation tests.
10. Run full live Scilab/JCEF acceptance and require a clean final state before release.

## Standard implementation workflow
1. Update application identity in `application/application_manifest.json`.
2. Add a Scilab handler under `application/scilab/`.
3. Register the operation in `application/scilab/application_registry.sci`.
4. Add the browser service under `browser_files/js/application/`.
5. Add or update the public payload schema.
6. Update the application manifest.
7. Add browser, Scilab, integration, expected-failure, cancellation, and cleanup tests as applicable.
8. Rebuild the requested profiles.
9. Run static validation.
10. Run the live qualification harness in Scilab/JCEF.
11. Produce a change manifest, regression report, known-limitations note, and final clean-state diagnostics.

## Required completion report
Every AI-generated application must state:
- Requested features and implemented behavior
- Files created and changed
- Protected files changed, if any, and justification
- New public operations and schemas
- Foundation and application test results
- Browser-console errors
- Final active requests, active transfers, retained transfers, and last error
- Known limitations and manual checks

Read `FOUNDATION_API.md`, `EXTENSION_POINTS.md`, `PROTECTED_FILES.json`, and `GENERATED_FILES.md` before making changes.
