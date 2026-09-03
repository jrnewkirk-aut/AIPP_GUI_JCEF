# AIPP M8.8 Candidate 04.6 - Canonical formulation selection correction

- Canonicalizes formulation names to primitive trimmed strings at the chamber-pyro model boundary.
- Canonicalizes formulation lookup, creation, and assignment.
- Selects native options by canonical text equality rather than strict object identity.
- Initializes Tom Select from the correctly selected native option when switching pyros.
- Repairs tests 008 and 009 so every expected and actual operand is canonicalized.
- Keeps test 010 deterministic and fixes the underlying option-selection behavior.
- Rewrites test 011 to use a supported bubbling `input` event rather than Tom Select's nonexistent `onSearchChange()` API.
- Declared cumulative inventory remains 311 tests.
