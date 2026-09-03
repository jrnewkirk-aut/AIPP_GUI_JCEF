# Scilab–JCEF Foundation Specification

**Document status:** Draft v0.2  
**Purpose:** Define the reusable architecture, engineering rules, validation strategy, and implementation roadmap for robust Scilab GUI applications built with the JCEF browser control.  
**Initial scope:** High-performance plotting applications, with requirements intended to remain broadly applicable to other Scilab–JCEF tools.

---

## 1. Purpose and Vision

Scilab–JCEF applications should be built on a reusable platform rather than as isolated, one-off GUI implementations. The foundation defined in this specification is intended to make future applications:

- Reliable during normal use and failure conditions
- Efficient with both small control messages and large numerical datasets
- Maintainable through modular source organization
- Testable across the Scilab and browser runtimes
- Observable through consistent logging and diagnostics
- Reproducible through deterministic builds
- Resistant to feature regressions during human- or AI-generated code changes
- Adaptable to future Scilab, JCEF, plotting-library, and application requirements

The foundation is organized into eight pillars:

1. Transport characterization and selection
2. Message protocol and robust data handling
3. Scalable plotting and data reduction
4. Cross-runtime automated testing
5. Reference architecture and ownership boundaries
6. Deterministic build and dependency management
7. Observability, diagnostics, and performance measurement
8. Compatibility, release, and AI-change governance

---

## 2. Governing Architectural Principles

### 2.1 Treat Scilab and JCEF as separate runtimes

The Scilab host and the JCEF browser must be treated as separate systems communicating through a defined protocol. The architecture must assume that:

- Messages can be malformed or incomplete.
- Large transfers can fail or time out.
- Either runtime can encounter an error independently.
- Browser modules can load in the wrong order if the build is incorrect.
- Protocol versions can diverge.
- Large datasets require explicit memory and lifecycle management.

Communication must therefore be designed as a message-based interface, not as an informal function-call bridge.

### 2.2 Runtime ownership model

#### Scilab owns

- Native file and directory dialogs
- Local file reads and writes
- Native path handling
- Computational and numerical services
- Full-resolution datasets when those datasets are too large for practical browser ownership
- Import and export conversion helpers
- Session-level native dialog directory memory
- Host-side logging and diagnostics

#### Browser owns

- GUI rendering
- User interaction
- Browser-side application state
- Editing workflows
- Plot display state
- Current axis ranges and visual configuration
- Browser-side validation and status presentation
- Browser-side logging and diagnostics

### 2.3 Source-of-truth rules

Each application must explicitly identify the authoritative owner of every important state category.

For editor-oriented applications, the browser may own the active in-memory document while Scilab provides file and calculation services.

For very large plotting applications, Scilab should normally own full-resolution numerical data while the browser owns plot configuration, visibility, selection, and the currently displayed reduced dataset.

State must not be mutated independently in both runtimes. Cross-runtime changes must be communicated through explicit protocol messages.

### 2.4 Modular development and self-contained runtime

Development source must remain modular. The application must not be developed as one large HTML file or one large JavaScript file.

The runtime should load a generated, self-contained HTML bundle:

```text
Modular HTML/CSS/JavaScript
    -> deterministic build step
    -> browser_files/dist/bundle.html
    -> Scilab JCEF browser control
```

No internet connection or CDN dependency should be required during normal application use.

---

## 3. Requirement Language and Identifiers

The terms **must**, **should**, and **may** are used as follows:

- **Must:** Required for foundation compliance.
- **Should:** Recommended unless a documented reason justifies an alternative.
- **May:** Optional capability.

Requirement identifiers use these prefixes:

- `ARC` — Architecture and ownership
- `TRN` — Transport
- `PRO` — Protocol and message handling
- `PLT` — Plotting and data reduction
- `TST` — Testing
- `BLD` — Build and dependency management
- `OBS` — Observability and diagnostics
- `CMP` — Compatibility and releases
- `AIG` — AI-assisted change governance

---

# Pillar 1: Transport Characterization and Selection

## 4. Objective

Determine through repeatable measurement which data representations can pass reliably between Scilab and JCEF, in both directions, and establish the limits and intended use of each representation.

ASCII-encoded JSON is the conservative baseline for hierarchical messages, but it must not be assumed to be the optimal representation for all large numerical transfers until benchmarking is complete.

## 5. Control Plane and Data Plane

### 5.1 Control-plane messages

Control-plane messages are relatively small and communicate instructions, state changes, metadata, and outcomes. Examples include:

- Browser initialization
- File operation requests
- Plot requests
- Axis-range changes
- User setting changes
- Success, warning, and error responses

The default control-plane representation should be structured JSON transported in an ASCII-safe form.

### 5.2 Data-plane messages

Data-plane messages carry large numerical or textual payloads. Examples include:

- Plot curve arrays
- Large model documents
- Imported result datasets
- Decimated viewport data
- Large save payloads

The data plane may use a representation different from the control plane, provided the transfer is still governed by the common protocol and lifecycle rules.

## 6. Transport Requirements

- **TRN-001:** A minimal transport probe application must be created independently of production application features.
- **TRN-002:** Transport behavior must be tested separately in the Scilab-to-browser and browser-to-Scilab directions.
- **TRN-003:** Candidate types must include scalar numbers, numeric vectors, matrices, strings, string arrays, nested JSON, ASCII-encoded JSON, direct numeric arrays, empty values, Unicode text, and special numeric values where supported.
- **TRN-004:** Tests must cover small, medium, large, repeated, and failure-inducing payloads.
- **TRN-005:** ASCII payloads emitted from Scilab must be normalized to the validated orientation, currently expected to be a row vector.
- **TRN-006:** Transport tests must measure encoding, transfer, decoding, total round-trip time, memory behavior, payload expansion, and maximum reliable payload.
- **TRN-007:** Failure behavior must be characterized, including malformed input, incomplete input, timeout, cancellation, and oversize payloads.
- **TRN-008:** A documented threshold must define when chunking is required.
- **TRN-009:** Transport diagnostics must be optional development modules and excluded from production unless deliberately enabled.
- **TRN-010:** Transport choices must be recorded in a versioned decision document supported by benchmark results.

## 7. Transport Benchmark Matrix

At minimum, test representative payload sizes near:

- 1 KB
- 10 KB
- 100 KB
- 1 MB
- 5 MB
- 10 MB
- Progressively larger payloads until a failure or unacceptable latency threshold is observed

Numerical tests should include:

- One long curve
- Many short curves
- Many long curves
- Repeated incremental updates
- Viewport-sized subsets from a much larger backing dataset
- Transfers while the GUI remains interactive

## 8. Pillar 1 Deliverables

```text
docs/transport/
  transport_test_plan.md
  transport_matrix.md
  transport_decision.md
  known_limits.md
  benchmark_results.csv
```

## 9. Pillar 1 Definition of Done

The foundation must be able to state, with measured evidence:

1. Which types can be transferred
2. In which direction each type works
3. The reliable payload size range
4. Typical and worst-case latency
5. Memory and payload-expansion costs
6. Failure and recovery behavior
7. The standard representation for each message category

---

# Pillar 2: Message Protocol and Robust Data Handling

## 10. Objective

Create one reusable cross-runtime communication library that provides encoding, decoding, validation, routing, request correlation, chunking, error handling, and logging for all applications.

## 11. Standard Message Envelope

All normal protocol messages should use a common envelope similar to:

```json
{
  "protocol": "scilab-jcef",
  "protocol_version": "1.0",
  "type": "plot.data.request",
  "request_id": "unique-request-id",
  "source": "browser",
  "data": {},
  "meta": {}
}
```

A response should preserve the request ID:

```json
{
  "protocol": "scilab-jcef",
  "protocol_version": "1.0",
  "type": "plot.data.response",
  "request_id": "same-request-id",
  "status": "success",
  "data": {},
  "error": null
}
```

The literal initialization message `loaded` may be handled as a special pre-protocol handshake if required by the JCEF interface.

## 12. Protocol Requirements

- **PRO-001:** Every protocol message must contain a message `type`.
- **PRO-002:** Every protocol message must identify the protocol and protocol version after initialization.
- **PRO-003:** Request/response workflows must use a unique `request_id`.
- **PRO-004:** Responses must preserve the originating `request_id`.
- **PRO-005:** Incoming data must be treated as untrusted and decoded inside guarded error handling.
- **PRO-006:** Unknown message types must produce a structured warning or error and must not crash either runtime.
- **PRO-007:** The central Scilab callback must decode, validate, route, and convert failures to structured responses; it must not contain application business logic.
- **PRO-008:** Browser transport code must be isolated from rendering, editing, and application-state modules.
- **PRO-009:** Requests must support timeout handling and cleanup of pending-request state.
- **PRO-010:** Long-running or chunked operations should support cancellation.
- **PRO-011:** Error responses must distinguish cancellation, invalid input, timeout, unsupported operation, host failure, browser failure, filesystem failure, and incomplete transfer where practical.
- **PRO-012:** Protocol schemas or equivalent machine-readable message definitions must be maintained for public message types.
- **PRO-013:** Unknown optional fields should normally be ignored for forward compatibility.
- **PRO-014:** Unsupported major protocol versions must produce an explicit incompatibility error.

## 13. Chunked Transfer Lifecycle

A generic transfer should use a state model such as:

```text
created
  -> receiving
  -> validating
  -> complete

receiving
  -> timed_out
  -> cancelled
  -> invalid
```

Each transfer should support:

- Transfer ID
- Request ID
- Expected chunk count
- Expected total size
- Chunk index
- Duplicate detection
- Missing-chunk detection
- Timeout
- Cancellation
- Cleanup after success or failure
- Per-chunk and whole-transfer integrity checks where practical

Partial files or partial application-state mutations must not be committed when transfer validation fails.

## 14. Suggested Module Organization

```text
scilab/transport/
  jcef_transport_encode.sci
  jcef_transport_decode.sci
  jcef_transport_send.sci
  jcef_transport_router.sci
  jcef_transfer_assembler.sci
  jcef_protocol_validate.sci
  jcef_transport_log.sci

browser_files/js/transport/
  transport_codec.js
  transport_client.js
  transport_router.js
  transport_requests.js
  transport_chunks.js
  transport_validation.js
  transport_log.js
```

## 15. Pillar 2 Definition of Done

A new application must be able to add a host-side handler and browser-side caller without rewriting:

- Encoding or decoding
- Routing
- Request correlation
- Timeout handling
- Chunk assembly
- Structured errors
- Transport logging

---

# Pillar 3: Scalable Plotting and Data Reduction

## 16. Objective

Select and validate a plotting architecture that remains interactive with very large source datasets.

For a target on the order of 500 curves with 500,000 points per curve, the system should not assume that all full-resolution points can be transferred to and rendered in the browser simultaneously.

## 17. Plot Data Ownership

Scilab should normally retain:

- Full-resolution source data
- Derived numerical results
- Data indexes and range-query structures
- Multiresolution representations, if precomputed host-side

The browser should normally retain:

- Curve metadata
- Visibility and styling state
- Current viewport
- Current reduced display data
- Cursor and selection state
- Plot interaction state

## 18. Viewport-Driven Data Requests

The browser should request only the data required for the current visual resolution. A request may include:

```json
{
  "type": "plot.viewport.request",
  "data": {
    "x_min": 0.0,
    "x_max": 0.25,
    "pixel_width": 1600,
    "curve_ids": ["curve-1", "curve-2"]
  }
}
```

## 19. Data Reduction Strategies to Evaluate

- Min/max envelopes per horizontal pixel bucket
- First/last/min/max bucket representations
- Largest-Triangle-Three-Buckets or similar visual downsampling
- Multiresolution data pyramids
- Incremental viewport loading
- Curve virtualization
- Progressive refinement after interaction stops
- Cached viewport responses

## 20. Plotting Requirements

- **PLT-001:** Plot-library selection must be based on a common benchmark harness rather than subjective feature comparison alone.
- **PLT-002:** Candidate libraries must be wrapped behind a common adapter interface.
- **PLT-003:** The selected approach must not require internet access or a CDN.
- **PLT-004:** The browser must not retain unnecessary full-resolution copies of large host-owned datasets.
- **PLT-005:** Hidden curves should not be transferred or rendered unless required for a specific calculation or interaction.
- **PLT-006:** Data reduction must preserve important extrema and transient features to an explicitly tested degree.
- **PLT-007:** Full-resolution data must remain available for calculations, export, and precise queries even when reduced data is displayed.
- **PLT-008:** Pan, zoom, initial rendering, update latency, memory use, and interaction responsiveness must be measured.
- **PLT-009:** Plotting performance targets must be defined before selecting the production library.
- **PLT-010:** Plot rendering must be replaceable through the adapter boundary without redesigning the protocol or application state.

## 21. Common Plot Adapter

Candidate adapters should expose an interface conceptually similar to:

```javascript
initialize(container, options)
setSeries(series)
setViewport(bounds)
updateSeries(series)
destroy()
```

## 22. Plot Candidate Evaluation Criteria

- Initial render time
- Pan and zoom latency
- Memory consumption
- Maximum practical visible point count
- Maximum practical visible curve count
- Incremental update performance
- Tooltip and cursor performance
- Legend performance
- Axis features and formatting
- Annotation support
- Export capability
- Offline packaging
- Licensing
- JCEF rendering stability
- Ease of maintenance

## 23. Pillar 3 Definition of Done

- A plotting library is selected through benchmark evidence.
- A data-reduction strategy is selected and validated.
- Browser memory remains bounded under representative workloads.
- Pan and zoom meet documented responsiveness targets.
- Full-resolution data remains available for precise operations.
- The plotting library is isolated behind a replaceable adapter.

---

# Pillar 4: Cross-Runtime Automated Testing

## 24. Objective

Provide layered automated testing for Scilab code, browser code, the shared protocol, real JCEF integration, GUI behavior, and key visual states.

## 25. Testing Layers

### 25.1 Pure Scilab unit tests

Test at minimum:

- Encoding and decoding
- Envelope validation
- Router behavior
- Chunk assembly
- Missing and duplicate chunks
- Timeout cleanup
- Path normalization
- Dialog-directory fallback logic
- File helpers
- Data-reduction algorithms
- Plot range queries

### 25.2 Pure browser JavaScript tests

Test at minimum:

- Codecs
- Message validation
- Request correlation
- Timeout behavior
- State transitions
- Chunk assembly
- Plot adapters using mock renderers
- GUI formatting and validation helpers

### 25.3 Contract tests

Both runtimes must be tested against shared fixtures:

```text
tests/protocol_fixtures/
  valid_messages/
  invalid_messages/
  chunk_sequences/
  expected_responses/
```

### 25.4 JCEF integration tests

Test inside the actual Scilab/JCEF environment:

- Browser startup
- `loaded` handshake
- Bidirectional communication
- Malformed messages
- Unknown types
- Large and repeated payloads
- Browser reload behavior
- Callback failures
- Layout at multiple window sizes
- Browser console startup errors

### 25.5 GUI behavioral tests

A test-only browser API may expose stable test operations:

```javascript
window.__JCEF_TEST_API__ = {
  clickAction,
  getState,
  getStatus,
  getVisibleDialogs,
  getPlotMetrics,
  runScenario
};
```

This API must be excluded from production builds unless explicitly justified.

### 25.6 Visual regression tests

Stable screenshots should cover:

- Startup
- Main layout
- Popup or modal views
- Small and large viewports
- Known plot states
- Error states
- Loading states

Comparison should use tolerances rather than requiring universal pixel-perfect equality.

## 26. Testing Requirements

- **TST-001:** Every production feature must map to at least one test or a documented manual validation when automation is not practical.
- **TST-002:** Protocol fixtures must be shared across the Scilab and browser implementations.
- **TST-003:** Failure paths must be tested, not only successful workflows.
- **TST-004:** Production builds must not accidentally include test hooks.
- **TST-005:** Build validation must run before JCEF integration tests.
- **TST-006:** The regression suite must detect missing active modules and accidentally enabled optional modules.
- **TST-007:** Small-viewport tests must verify that critical actions remain reachable.
- **TST-008:** Test reports must identify the foundation version, application version, protocol version, Scilab version, and build manifest hash.
- **TST-009:** Important GUI visual states must be covered by deterministic automated visual contracts, screenshot comparison with documented tolerances, or a documented manual visual-validation fallback when reliable automated capture is unavailable.

## 27. Feature Manifest

A machine-readable feature inventory should map capabilities to tests:

```json
{
  "features": [
    {
      "id": "FILE-OPEN-001",
      "name": "Open JSON file",
      "scilab_tests": ["test_open_json.sce"],
      "browser_tests": ["open-json.test.js"],
      "integration_tests": ["scenario_open_json.json"]
    }
  ]
}
```

## 28. Pillar 4 Definition of Done

Every production feature maps to:

- A requirement
- An implementing module
- One or more tests
- A regression scenario
- A documented manual fallback when automation is not practical

---

# Pillar 5: Reference Architecture and Ownership Boundaries

## 29. Objective

Create a canonical application skeleton so future applications inherit the same startup, ownership, transport, build, logging, and test patterns.

## 30. Recommended Repository Structure

```text
scilab-jcef-foundation/
  app/
    main.sce
  scilab/
    bootstrap/
    transport/
    handlers/
    services/
    logging/
    tests/
  browser_files/
    index.html
    components/
    styles/
    js/
      core/
      state/
      transport/
      views/
      components/
      diagnostics/
    js_optional/
    vendor/
    dist/
  protocol/
  tests/
  docs/
  tools/
```

## 31. Architecture Requirements

- **ARC-001:** Top-level Scilab launch scripts must establish a known state and anchor relative paths to the application location.
- **ARC-002:** The browser control must have explicit layout constraints.
- **ARC-003:** Development builds should enable JCEF debugging.
- **ARC-004:** Applications should use one primary browser control per main window unless a documented use case requires more.
- **ARC-005:** The central callback must not contain application business logic.
- **ARC-006:** Native dialogs and filesystem operations must remain on the Scilab side.
- **ARC-007:** Browser JavaScript must not assume direct access to native file dialogs.
- **ARC-008:** Graph or plot model creation must be separated from rendering.
- **ARC-009:** Layout configuration must remain separate from unrelated editor or transport code.
- **ARC-010:** Every shared foundation module must have a documented responsibility and public interface.

## 32. Pillar 5 Definition of Done

A new application can be started from the reference skeleton by adding application-specific handlers, state, services, and views without rebuilding the communication, build, logging, or testing infrastructure.

---

# Pillar 6: Deterministic Build and Dependency Management

## 33. Objective

Generate a self-contained JCEF runtime bundle from modular source in a deterministic, validated, and auditable manner.

## 34. Build Modes

```text
browser_files/dist/
  bundle.dev.html
  bundle.test.html
  bundle.prod.html
  build_manifest.json
```

- Development builds may include verbose logging and optional diagnostics.
- Test builds may include fixtures and the internal test API.
- Production builds must exclude optional diagnostic and test modules unless explicitly approved.

## 35. Build Requirements

- **BLD-001:** Source HTML, components, CSS, JavaScript, and local vendor files must remain modular.
- **BLD-002:** The build must sort components and JavaScript files explicitly; filesystem return order must not be trusted.
- **BLD-003:** The build must fail when required placeholders or referenced files are missing.
- **BLD-004:** The build must detect duplicate module identifiers or conflicting declared exports where practical.
- **BLD-005:** Production bundles must not contain CDN dependencies.
- **BLD-006:** The build must identify unresolved local links, imports, or placeholders.
- **BLD-007:** Optional diagnostic modules must be excluded by default.
- **BLD-008:** The build must generate a manifest describing included files, order, category, dependency status, and hashes.
- **BLD-009:** The build should generate a stable bundle hash for test and release reporting.
- **BLD-010:** The launcher must rebuild or validate the bundle according to the selected development workflow.
- **BLD-011:** A suspiciously empty or unexpectedly changed bundle must cause a clear build warning or failure.
- **BLD-012:** Two builds from the same source and configuration should produce functionally identical output and ordering.

## 36. Dependency Manifest Contents

The manifest should record:

- File path
- Load order
- Module category
- Required or optional status
- Declared dependencies
- Public symbols or interface
- Reason for inclusion
- Content hash
- Version, when applicable

## 37. Pillar 6 Definition of Done

Missing, duplicate, unresolved, or incorrectly activated dependencies fail during the build or validation process rather than appearing as an unexplained blank browser or runtime error.

---

# Pillar 7: Observability, Diagnostics, and Performance Measurement

## 38. Objective

Provide coordinated, structured visibility into startup, transport, protocol, file, state, rendering, plotting, and performance behavior across both runtimes.

## 39. Standard Log Record

A common conceptual record should include:

```json
{
  "timestamp": "...",
  "runtime": "browser",
  "level": "error",
  "category": "transport",
  "event": "message_decode_failed",
  "request_id": "...",
  "transfer_id": "...",
  "details": {}
}
```

## 40. Logging Categories

- `startup`
- `build`
- `transport`
- `protocol`
- `file_io`
- `state`
- `render`
- `plot`
- `performance`
- `test`

## 41. Observability Requirements

- **OBS-001:** Both runtimes must use consistent log levels and categories.
- **OBS-002:** Logs should carry request and transfer identifiers where applicable.
- **OBS-003:** Unknown message types and decode failures must be logged with sufficient context for diagnosis without dumping unsafe or excessively large payloads.
- **OBS-004:** File open/save failures must identify the operation and failure stage.
- **OBS-005:** Performance instrumentation must distinguish encoding, transfer, decoding, calculation, reduction, and rendering time.
- **OBS-006:** The system must monitor or expose pending requests and active transfers in development mode.
- **OBS-007:** Large payload logging must use summaries, sizes, hashes, or samples instead of full content by default.
- **OBS-008:** Diagnostic UI modules must remain optional and must not be active accidentally in production.
- **OBS-009:** Browser startup must be checked for console errors.
- **OBS-010:** Logs should support export or collection into a combined diagnostic package when practical.

## 42. Recommended Performance Metrics

- Serialization time
- Transfer time
- Deserialization time
- Message queue depth
- Pending request count
- Active transfer count
- Decimation time
- Plot render time
- Visible source-point count
- Delivered display-point count
- Browser-held dataset size
- Failed, cancelled, and timed-out request counts

## 43. Development Diagnostic Panel

A development-only panel may show:

- Foundation, application, and protocol versions
- Build manifest hash
- Loaded/connected state
- Last message summary
- Pending requests
- Active transfers
- Payload counts and sizes
- Plot point counts
- Render timings
- Recent warnings and errors

## 44. Pillar 7 Definition of Done

A developer can determine whether a failure originated in startup, build order, encoding, transport, routing, a host service, browser state, or rendering without adding one-off logging throughout the application.

---

# Pillar 8: Compatibility, Release, and AI-Change Governance

## 45. Objective

Protect the reusable foundation from undocumented incompatibilities and regressions introduced by application work, dependency updates, or AI-generated modifications.

## 46. Compatibility Matrix

The project should track:

- Scilab version
- Operating system
- JCEF behavior and known limitations
- Supported transport modes
- Maximum verified payloads
- Required workarounds
- Plot-library version
- Foundation version
- Protocol version
- Application version

## 47. Versioning

Version these elements independently:

```text
Foundation: 1.2.0
Application: 0.8.0
Protocol: 1.0
```

Protocol compatibility guidance:

- Adding optional fields may be a minor revision.
- Changing an existing field's meaning requires a major revision.
- Removing or renaming a public message type requires a major revision.
- Unknown optional fields should normally be tolerated.
- Unknown major versions must fail explicitly.

## 48. Architecture Decision Records

Important decisions should be captured in short records:

```text
docs/adr/
  ADR-001-browser-state-ownership.md
  ADR-002-control-message-transport.md
  ADR-003-chunked-transfer-protocol.md
  ADR-004-plot-decimation-strategy.md
```

Each record should include:

- Context
- Decision
- Alternatives considered
- Consequences
- Validation evidence
- Conditions for revisiting the decision

## 49. Governance Requirements

- **CMP-001:** Every release must identify the tested compatibility matrix.
- **CMP-002:** Scilab functions must be verified against the target Scilab version before being adopted.
- **CMP-003:** External dependencies must be vendored or locally available and must not require runtime internet access.
- **CMP-004:** Foundation, application, and protocol versions must be recorded in test reports and diagnostic output.
- **CMP-005:** Breaking protocol changes require a major protocol version change and migration notes.
- **CMP-006:** Known workarounds must identify the affected version and removal criteria.

- **AIG-001:** Code changes must be based on the latest working source bundle, not an older scaffold.
- **AIG-002:** Modular source files must not be collapsed into one large JavaScript or HTML file.
- **AIG-003:** Every change package must identify changed files, affected features, protocol impacts, tests, known limitations, and rollback instructions.
- **AIG-004:** Feature parity must be verified before recommending replacement of working modules.
- **AIG-005:** The dependency manifest and feature manifest must be updated when relevant.
- **AIG-006:** AI-generated changes must include a regression checklist or validation report.
- **AIG-007:** A change must not be accepted solely because the bundle builds; functional and regression tests must also pass.

## 50. Pillar 8 Definition of Done

A release or patch can be traced to its source modules, protocol version, dependency manifest, test results, compatibility assumptions, and rollback path.

---

# 51. Implementation Roadmap

## Phase 0: Normalize the Documentation

Actions:

- Consolidate existing Scilab/JCEF integration, HTML handling, and pillar documents.
- Separate mandatory requirements from recommendations.
- Assign stable requirement identifiers.
- Repair incomplete or damaged examples.
- Establish the initial glossary and version history.

Deliverable:

```text
docs/Scilab_JCEF_Foundation_Spec.md
```

Exit criterion: Foundation specification v0.1 is reviewed and usable as the authoritative planning document.

## Phase 1: Build the Minimal Reference Shell

Implement only:

- Scilab bootstrap
- Explicit browser layout
- Modular browser source
- Deterministic bundler
- `loaded` handshake
- Structured logger
- Empty protocol router

Exit criterion: The shell starts repeatedly without browser-console or Scilab startup errors.

## Phase 2: Complete the Transport Laboratory

Implement the transport probe and automated benchmark sweeps.

Deliverables:

- Capability matrix
- Benchmark results
- Control-plane transport decision
- Data-plane transport decision
- Chunk threshold
- Known payload limits

Exit criterion: Transport decisions are supported by repeatable measurements.

## Phase 3: Build Protocol Library 1.0

Implement:

- Envelope and validation
- Routing
- Request IDs
- Structured errors
- Timeout handling
- Chunking
- Cancellation
- Logging
- Shared contract fixtures

Exit criterion: Bidirectional success and failure scenarios pass in the reference shell.

## Phase 4: Establish the Test Harness

Implement:

- Scilab unit-test integration
- Browser test runner
- Shared contract tests
- JCEF self-test page
- Feature and regression manifests
- Test-report generation

Exit criterion: Deliberately broken codecs, routes, module ordering, and schemas produce clear failures.

## Phase 5: Build the Plotting Laboratory

Use representative synthetic benchmark datasets, clearly identified as synthetic, to evaluate:

- Candidate plotting libraries
- Transport representations
- Data-reduction algorithms
- Multiresolution storage
- Viewport requests
- Curve virtualization

Exit criterion: A plotting architecture decision is supported by benchmark evidence and documented performance targets.

## Phase 6: Create the Reusable Starter Repository

Package:

- Foundation modules
- Example message handler
- Example browser component
- Example native dialog workflow
- Example chunked transfer
- Example plot adapter
- Full regression suite
- Build and dependency manifests
- Documentation

Exit criterion: A small new GUI can be created by adding application-specific state, handlers, services, and views rather than rebuilding infrastructure.

---

# 52. Initial Deliverable Backlog

Recommended order:

1. `Scilab_JCEF_Foundation_Spec.md`
2. `protocol_v1.md`
3. `transport_test_plan.md`
4. Minimal reference application
5. Transport benchmark application
6. Cross-runtime feature and test manifest
7. Plotting evaluation specification
8. AI contribution and regression checklist

---

# 53. Foundation-Wide Acceptance Criteria

The foundation is ready for routine application development when:

- The reference shell builds and launches deterministically.
- Bidirectional communication is benchmarked and documented.
- The protocol library handles success, malformed input, unknown types, timeouts, cancellation, and chunk failures.
- The testing stack validates Scilab, browser, contract, JCEF, and important GUI behavior.
- Plotting performance has been tested with representative large datasets.
- Logs and diagnostic tools can localize cross-runtime failures.
- Compatibility and version information is available for every release.
- AI-assisted changes are governed by feature parity and regression evidence.
- A new application can reuse the foundation without duplicating its infrastructure.

---

# 54. Source Documents

This specification consolidates and extends the following project documents:

- `JCEF_Pillars.md`
- `Scilab_JCEF_rules.md`
- `HTML_Handling.md`

When a conflict is discovered, the conflict should be resolved explicitly in this specification and recorded in an architecture decision record when the decision is significant.

---

# 55. Open Decisions

The following decisions require experimental evidence or further design work:

1. Final control-plane representation and maximum recommended size
2. Final bulk numeric data-plane representation
3. Reliable JCEF payload ceiling by Scilab version
4. Chunk size, timeout, retry, and integrity-check policy
5. Browser test framework and method for running it in the real JCEF environment
6. GUI automation strategy for JCEF
7. Plot-library shortlist
8. Data-reduction algorithm and acceptable fidelity criteria
9. Performance targets for initial render, pan, zoom, and updates
10. Combined diagnostic-package format
11. Supported Scilab and operating-system matrix
12. Release packaging and foundation update strategy

---

# 56. Revision History

## Draft v0.1

- Consolidated the original four pillars.
- Added architecture, deterministic build, observability, and governance pillars.
- Added stable requirement identifiers.
- Added implementation phases, deliverables, and acceptance criteria.
- Established the document as the initial authoritative foundation plan.
