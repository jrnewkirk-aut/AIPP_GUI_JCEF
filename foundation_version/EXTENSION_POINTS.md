# Approved Extension Points

## Application-owned roots
- `application/`
- `application/scilab/`
- `application/browser/`
- `browser_files/js/application/`

These roots are preserved during a foundation-only upgrade unless a declared application migration explicitly changes them.

## Expected edits for a new application
- Application identity and operation list in `application/application_manifest.json`
- Domain state and services under `application/scilab/`
- Browser application services under `browser_files/js/application/`
- Application UI components and application-specific styles
- Public schemas
- Application-specific tests and fixtures

## Do not use as extension points
- `scilab/protocol_callback.sci`
- Browser protocol/request/transfer internals
- Foundation bootstrap files
- Generated bundles under `browser_files/dist/`
- Vendor/minified dependencies
- Evidence or exported result files
