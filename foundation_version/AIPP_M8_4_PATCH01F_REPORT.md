# AIPP M8.4 Patch 01f

## Confirmed root cause

The live launcher invokes `buildProtocolStarterHTML(APP_ROOT)` before creating JCEF. That Scilab-side builder rebuilt all HTML artifacts from directory globs but never included `browser_files/js/vendor/*.js`. It therefore replaced the correct prebuilt Patch 01e bundles with smaller bundles that again lacked Cytoscape. The uploaded live result proves this: production measured 148,878 bytes rather than the expected embedded-runtime size, and only AIPP-M84-009 failed.

## Correction

`scilab/buildHTML.sci` now includes the vendor directory in dev, test, and production and places it immediately before application modules. This fixes the artifact actually executed by the live launcher, rather than only the offline Python-generated artifact.

## Validation

- Uploaded live evidence analyzed: 275/276, sole failure AIPP-M84-009.
- Same-realm Cytoscape 3.33.4 headless smoke: 2 nodes, 1 edge, PASS.
- Python deterministic build and validation: PASS.
- Simulated Scilab runtime rebuild includes vendor before graph runtime: PASS.
- Modular sources retained: PASS.

Live Scilab/JCEF confirmation remains required. Expected result: 276/276 PASS.
