# AIPP M8.10 Phase 0.5B Close Implementation Report

## Identity

- Application: `0.8.10-phase0.5b-close.candidate.1`
- Foundation: `P6.4.0-0.1`
- Baseline: Phase 0.5B Candidate 07

## Scope

This package is a bounded stabilization checkpoint before Piston development. It does not add a new editor or graph entity.

## Changes

- Adds a presentation-change event and closes stale hover cards when Current/Proposed mode changes.
- Closes hover cards when the authoritative document is replaced.
- Exposes read-only hover lifecycle diagnostics for qualification.
- Enforces a single reusable hover-card DOM identity.
- Adds long-label and many-Pyro fixtures.
- Adds constant and tabular Orifice summary fixtures.
- Adds all supported Wall boundary-summary fixtures.
- Verifies serialization, revision, and dirty state remain unchanged by summary generation.
- Retains temporary JCEF debugging in qualification and production.

## New tests

- `AIPP-M810-CLOSE-001` through `AIPP-M810-CLOSE-008`
- Total declared inventory: 475 tests

## Promotion rule

Do not describe this package as live-qualified until the full Scilab/JCEF suite and the included manual repaint exercise pass under Scilab 2026.1.0 or newer.
