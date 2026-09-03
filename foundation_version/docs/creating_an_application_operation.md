# Creating an Application Operation

1. Add a handler under `application/scilab/`.
2. Register the request type in `application_registry.sci`.
3. Add a browser service under `browser_files/js/application/`.
4. Add a public payload schema.
5. Update `application/application_manifest.json`.
6. Add browser, Scilab, integration, failure-path, and cleanup tests.
7. Rebuild both bundles and run full acceptance.

The P5.6 sum example demonstrates this flow without editing the central callback or transport library.
