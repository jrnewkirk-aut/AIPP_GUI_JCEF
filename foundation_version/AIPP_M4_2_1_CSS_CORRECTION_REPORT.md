# AIPP M4.2.1 Live CSS Assembly Correction

## Observed defect
The live Scilab qualification GUI loaded the M4.2 HTML and JavaScript structure, but rendered it with native/foundation styling rather than the approved application styling.

## Root cause
`scilab/buildHTML.sci` assembled its active `<style>` element from only `browser_files/styles/main.css`. The required application-owned stylesheet was declared in the dependency manifest and included by the Python artifact builder, but the live Scilab builder did not concatenate `application/browser/styles/*.css`.

## Correction
- Updated the live Scilab HTML builder to append all application-owned stylesheets in deterministic case-insensitive filename order.
- Kept `application/browser/styles/aipp_m1.css` as the authoritative AIPP stylesheet; no duplicate copy was placed in the Foundation stylesheet.
- Strengthened existing test `AIPP-M4-011` to validate computed styles, not merely element visibility.
- Added computed-style gates for white workspace/detail surfaces, CSS grid layout, block pyro cards, and the red destructive action.
- Rebuilt development, test, and production bundles from modular source.

## Required acceptance
Run `app/main.sce` from a fresh extraction. The chamber-pyro workspace must visually match the approved master/detail design and the full 208-test suite must pass with clean final protocol state.
