# P8.0 Ownership and Change Policy

## Application-owned roots

- `application/`
- `browser_files/js/application/`

These roots must be preserved during foundation upgrade and rollback qualification unless an application migration explicitly declares a change.

## Foundation-owned roots

Foundation-owned code includes `app/`, `scilab/`, protocol and observability browser modules, build definitions, shared schemas, and foundation tooling. Changes require an explicit change package and regression evidence.

## Generated roots

- `browser_files/dist/`
- `results/`
- `diagnostic_exports/`

Generated output must never be treated as the authoritative development source.

## Prohibited states

- Mixing modules or manifests from different accepted releases
- Rebuilding from an older scaffold
- Replacing modular source with only a generated bundle
- Overwriting application-owned roots during a foundation-only upgrade
- Accepting a candidate because it builds without functional regression evidence
