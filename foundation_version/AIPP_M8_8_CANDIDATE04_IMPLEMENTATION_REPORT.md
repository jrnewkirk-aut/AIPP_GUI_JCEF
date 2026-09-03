# AIPP M8.8 Candidate 04 - Direct Integration

Candidate 04 is rebuilt from the uploaded M8.7.1 Candidate 02 baseline.

- The cumulative `bundle.test.html` remains the only test application.
- No M8.8 iframe or standalone sample model is included.
- The existing chamber-pyro model/view are upgraded in place.
- The obsolete formulation-only interface is retained as a hidden test fixture, not a competing visible editor.
- Pyro geometry now renders sphere, tablet, wafer, grain, cylinder, disk, tabular, and custom shape controls.
- Tabular geometry provides matched burn-distance/surface-area rows with add/remove actions.
- Tom Select 2.6.2 is vendored and assembled offline.
- The native inspector protects missing array state instead of calling `.join()` on undefined input.
- The runner normalizes missing requirements and applies a per-test timeout so a failed asynchronous test records a failure and the suite continues.
- Four M8.8 direct-integration regression tests are added to the cumulative registry.

Live Scilab/JCEF execution remains required to confirm the complete final count and any host-specific test behavior.
