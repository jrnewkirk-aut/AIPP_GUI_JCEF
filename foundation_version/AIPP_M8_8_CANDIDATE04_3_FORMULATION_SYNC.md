# AIPP M8.8 Candidate 04.3 - Formulation synchronization

- Removes the synchronous full editor rerender from the Tom Select formulation `onChange` callback.
- Updates the authoritative pyro model and Assigned-pyro summary without destroying the active selector.
- Explicitly synchronizes the Tom Select value from the selected pyro record.
- Retains full rerender behavior for structural changes and geometry changes.
- Adds AIPP-M88-008 through AIPP-M88-010 for model/control/summary agreement, rerender persistence, and independent pyro formulations.
- Declared cumulative inventory: 310 tests.
