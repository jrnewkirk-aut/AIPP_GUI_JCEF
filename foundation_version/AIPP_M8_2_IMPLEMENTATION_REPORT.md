# AIPP M8.2 Implementation Report

## Scope
M8.2 implements the JSON file lifecycle on top of the accepted M8.1 authoritative deck document.

## Delivered
- New deck with unsaved-change guard and clean deterministic default state.
- Open JSON via Scilab-owned `uigetfile`, parse/contract validation before atomic replacement, and cancellation/error preservation.
- Save and Save As via Scilab-owned `uiputfile`/file write, deterministic M8.1 serialization, revision-race protection, and saved filename/path tracking.
- Modular browser service/controller modules; no monolithic source collapse.
- Host routes for `application.aipp.deck.open.request` and `application.aipp.deck.save.request`.
- M8.2 regression coverage and updated deterministic bundles.

## Acceptance constraints
A live Scilab/JCEF run is still required on Scilab 2026.1.0+ to qualify native file dialogs and filesystem I/O. Static, build, archive, and browser harness validation are included in the package.

## Governance reconciliation
The uploaded M8.1 baseline carried three stale protected-file hashes. M8.2 reconciles the unchanged `app/app_config.sci` and `browser_files/js/protocol/06_protocol_transport.js` hashes to their uploaded bytes, and advances the dependency-manifest hash for the approved application-extension modules. No foundation source code was modified in those two unchanged files.
