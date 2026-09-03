# Foundation API and Supported Extension Surface

## Browser public services
The reusable browser foundation provides protocol constants/errors, safe codec, envelope validation, request registry, transport, client, router, host lifecycle, transfer registry, numeric transfer, transfer handles, runtime configuration, diagnostics, viewport service, logging, schemas, capability negotiation, data adapters, library lifecycle, and generic transfer support.

Application code should consume these public services through the existing global library contracts rather than importing internal implementation details or duplicating registries.

## Scilab public services
The reusable Scilab foundation provides bootstrap/path resolution, runtime state, window creation, protocol encoding/validation/routing, structured errors, numeric and generic transfers, observability records/logging/performance metrics, common plotting/reduction services, production validation, and the central browser callback.

Application operations must be registered through the application registry and application handler modules. Do not add application branches directly to the central callback.

## Lifecycle contract
- Initialize the foundation before submitting requests.
- Keep request and transfer identities unique.
- Settle requests/transfers exactly once.
- Support cancellation for long-running work.
- Reject stale or superseded viewport data.
- Clean terminal records after the configured grace period.
- Require zero active requests/transfers at final acceptance.

## Data ownership contract
- Scilab owns authoritative full-resolution data, calculations, reduction, export, and host state.
- The browser owns presentation state, interaction, viewport, styling, and current rendered data.
- Bulk finite-double data uses the numerical transfer path; structured control uses the safe control codec.

## Public application extension contract
A new operation requires:
1. Application request/response schema
2. Scilab handler
3. Registry entry
4. Browser service caller
5. Manifest entry
6. Success, expected-failure, recovery, and cleanup tests
