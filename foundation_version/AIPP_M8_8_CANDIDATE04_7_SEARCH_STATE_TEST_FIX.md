# AIPP M8.8 Candidate 04.7 - Deterministic search-state qualification

This is a narrow testability correction derived from Candidate 04.6.

- Adds an application-owned `setFormulationSearchState(instance, query)` helper.
- Adds `clearFormulationSearchState(instance)` for dropdown close, blur, and completed selection.
- Tom Select `onType` now delegates to the application-owned helper.
- Rewrites AIPP-M88-011 to test the helper directly instead of relying on synthetic JCEF keyboard/input routing.
- Continues to verify selected-item hiding, query visibility, model non-mutation, search cleanup, and selected-item restoration.
- Does not add or remove tests; the cumulative inventory remains 311.
