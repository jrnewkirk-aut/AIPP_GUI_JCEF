# AIPP M8.8 Candidate 04.4 - Tom Select feedback-loop correction

- Removes `setValue()` from the formulation `onChange` synchronization path.
- Normalizes Tom Select scalar/array values before model comparison.
- User changes now flow one way: Tom Select -> authoritative model -> Assigned-pyro summary.
- Full rerenders initialize Tom Select from the selected native `<option>` and authoritative pyro record.
- Reworks M8.8 tests 002-010 to create their own loaded pyro fixtures; no deferred successes remain.
- Test 008 exercises the real user event route with `TomSelect.setValue(target)` and checks model, native source, API value, visible item, and summary.
- Confirms the existing `INT-HEALTH-001` runtime-error assertion remains active.
- Declared cumulative inventory remains 310 tests.
