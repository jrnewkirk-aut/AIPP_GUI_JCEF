# Cytoscape.js vendor file

Place the pinned Cytoscape.js browser build here as:

```text
browser_files/vendor/cytoscape.min.js
```

Recommended candidate from the evaluation phase:

```text
cytoscape@3.33.4
```

Security policy for this project:

1. Do not load Cytoscape from a CDN at runtime.
2. Do not run `npm install` in the deliverable workflow.
3. Vendor one pinned, reviewed browser build locally.
4. Record the version, source URL, license, and checksum in `THIRD_PARTY_NOTICES.md`.
5. Keep the existing SVG engine as the default until feature parity is approved.

This patch intentionally does not overwrite the current SVG graph implementation.
