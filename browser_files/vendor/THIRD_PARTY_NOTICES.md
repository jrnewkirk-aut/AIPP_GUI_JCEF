# Third-party notices

## Cytoscape.js

- Intended local file: `browser_files/vendor/cytoscape.min.js`
- License: MIT
- Project: https://js.cytoscape.org/
- Package: https://www.npmjs.com/package/cytoscape
- Status in this patch: integration scaffold only; place reviewed/pinned minified build locally before enabling runtime prototype.

Rationale: the current app is used in an embedded browser context, so the prototype is designed for local vendoring instead of CDN loading.
