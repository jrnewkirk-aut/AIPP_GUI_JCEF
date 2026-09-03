# AIPP Piston P2.0 Architecture and Schema Contract

## 1. Purpose and status

This document freezes the architecture, native-data contract, milestone plan, and qualification strategy for the P2 piston editor program. P2.0 is an architecture package only. It does not add a visible piston editor or modify piston simulation physics.

The accepted source baseline is **AIPP Piston Pre-P2 Stabilization Candidate 06 Correction 01**. Its live Scilab/JCEF suite contains 497 declared tests and is accepted with 497 passing, zero failures, and no missing, unexpected, or duplicate IDs under Scilab 2026.1.0.

## 2. Scope boundaries

### Included in P2

- First-class piston topology projection and selection.
- Production piston contextual editor.
- Isolated piston working copies with Apply and Revert.
- Core piston properties and chamber connections.
- Constant, time-dependent, and displacement-dependent legal lookup laws.
- Inline-array and external `csv_file` representations where documented.
- Left and right damping laws.
- Body-force collection editing.
- Travel targets and generated piston events.
- Orifice piston-modulator integration.
- Cross-reference protection, reorder remapping, persistence, and live qualification.

### Excluded from P2.0

- Production GUI changes.
- New piston physics or solver behavior.
- New native JSON fields not described by the user guide.
- Temperature-dependent or pressure-dependent viscous damping.
- Converting external CSV references into embedded arrays without an explicit user action.
- Making a view, topology graph, or chamber editor canonical.

## 3. Governing architectural rules

1. The native master JSON document is the sole canonical source for `aipp_calculation.assembly.pistons` and every piston reference.
2. Piston editing occurs in an isolated working projection. Ordinary edits do not immediately replace the canonical piston.
3. Apply validates the complete working piston, commits exactly one canonical piston atomically, increments the document revision once, preserves unknown data and untouched precision, then rehydrates from the accepted native record.
4. Revert discards unapplied edits and rehydrates from the current canonical native piston without changing the master revision.
5. Editor-only piston identities remain stable through rerenders and reorder operations but are never serialized.
6. Native piston array order remains semantically significant because cross-references use one-based `piston_idx` and generated event names.
7. Reordering must atomically remap piston indices and piston-generated event references throughout the canonical document.
8. Deletion is blocked while references exist unless an explicit dependency-resolution workflow is later approved.
9. Unknown fields, unsupported legal variants, external CSV references, and untouched dimensional strings must survive Apply, Save, and reopen.
10. Piston source remains modular. Collection, editor coordination, law handling, reference handling, view rendering, and tests must not be collapsed into one file.
11. Pistons are first-class topology entities. Pyros and filters remain chamber-owned and are not added as topology nodes.
12. Every implementation milestone requires modular source, rebuilt bundles, updated manifests, deterministic packaging, focused tests, and a live Scilab/JCEF validation checklist.

## 4. Existing P1 foundation to retain

The current `33_aipp_piston_collection_model.js` already provides the collection layer that later milestones must extend rather than replace:

- Hydration from `assembly.pistons`.
- Stable editor-only identities.
- Deterministic default piston creation.
- Deep-copy duplication.
- Selection, reorder, and removal.
- Lossless preservation of unknown native fields.
- Canonical document mutation and dirty-state propagation.
- Dependency scanning for `flow_area_modulators[].piston_idx` and piston-generated event names.
- Protected deletion of referenced pistons.
- Deterministic reference remapping when pistons are reordered.

P1 writes collection mutations directly through the deck document. P2 field editing must add a separate isolated editor working-copy layer so field changes are not committed until Apply.

## 5. Physical and coordinate contract

A piston connects two different chambers and exchanges pressure work between them. Positive piston displacement is directed from the left chamber toward the right chamber. The pressure contribution to force is conceptually:

\[
F_{pressure}=P_L A_L-P_R A_R
\]

Rightward motion increases the free volume of the left chamber and decreases the free volume of the right chamber. The left maximum-displacement value is stored as a positive magnitude but defines the negative coordinate limit. The right maximum displacement defines the positive limit.

The first production surface must display left and right explicitly. It must not silently reorder chamber connections because reversing them changes coordinate orientation, force sign, target interpretation, and chamber-volume behavior.

## 6. Top-level native piston schema

Every piston is expected to support these top-level sections:

- `mass`
- `left_connection`
- `right_connection`
- `left_damping_force`
- `right_damping_force`
- `body_forces`
- `travel_units`
- `travel_targets`

A `label` or unknown extension field may be present and must be preserved. Fields not yet editable remain preservation-only and must stay visible through expandable raw working JSON.

## 7. General lookup-law contract

Lookup-driven piston properties use one of these bases where the specific property permits it:

- `constant`
- `time`
- `displacement`

Dependent laws may be represented by paired arrays in the main JSON or by `csv_file`. Paired arrays must have equal lengths. Independent values must be in increasing order. Values outside the listed range use the nearest endpoint.

Continuity values are:

- `discrete`: hold the previous listed value between points.
- `interpolate`: linearly interpolate between adjacent points.

The first row of a lookup CSV contains units. Remaining rows contain paired numeric values. An external `csv_file` remains an external native reference and must not be rewritten as arrays unless the user explicitly imports and chooses to embed the data.

## 8. Mass schema matrix

### Constant mass

Required native keys:

```json
{
  "basis": "constant",
  "mass": "100.0 g"
}
```

### Displacement-dependent mass using arrays

Required keys:

- `basis: "displacement"`
- `displacement_units`
- `displacement_array`
- `mass_units`
- `mass_array`
- `continuity: "interpolate"`

### Time-dependent mass using arrays

Required keys:

- `basis: "time"`
- `time_units`
- `time_array`
- `mass_units`
- `mass_array`
- `continuity: "interpolate"`

### CSV mass laws

Both time and displacement laws may use:

```json
{
  "basis": "time or displacement",
  "csv_file": "path/to/file.csv",
  "continuity": "interpolate"
}
```

### Mass validation

- Constant mass must be a valid mass quantity and nonnegative.
- Paired arrays must have equal lengths and enough points for evaluation.
- Time and displacement arrays must be finite and strictly increasing.
- Mass values must be finite and nonnegative.
- Mass continuity is always `interpolate`; the GUI must not offer `discrete` for mass.
- A CSV reference must be preserved exactly when untouched.

## 9. Piston connection schema

Each side contains:

- `chamber_idx`: one-based index of the connected chamber.
- `area_law`: pressure-exposed area law for that face.
- `max_displacement`: positive dimensional magnitude for that side's travel limit.

Validation requirements:

- Both chamber references must resolve.
- Left and right chambers must differ.
- Maximum-displacement magnitudes must be valid, finite, and nonnegative.
- Chamber selectors display both index and label, for example `2: Tank`.
- Connection edits remain working-copy-only until Apply.
- Topology projection uses the accepted canonical values, with an optional noncanonical working preview only if clearly identified.

## 10. Area-law schema matrix

Each `left_connection.area_law` and `right_connection.area_law` independently supports:

### Constant

```json
{
  "basis": "constant",
  "surface_area": "100.0 mm^2"
}
```

### Displacement arrays

- `basis: "displacement"`
- `displacement_units`
- `displacement_array`
- `area_units`
- `area_array`
- legal `continuity`

### Time arrays

- `basis: "time"`
- `time_units`
- `time_array`
- `area_units`
- `area_array`
- legal `continuity`

### CSV representation

A dependent area law may use `csv_file` and a legal continuity value.

### Area validation

- Surface-area values must be finite and nonnegative.
- Paired arrays must have equal lengths.
- Independent values must be finite and strictly increasing.
- Unit selectors use Quaff-compatible length-squared spellings.
- Left and right laws remain fully independent.

## 11. Damping-force schema

Each direction contains:

- `static_surface_friction`
- `dynamic_surface_friction`
- `viscous_friction`

### Static and dynamic surface friction

Legal forms:

- Constant force
- Displacement-dependent force using arrays
- Displacement-dependent force using `csv_file`

Dependent array keys include:

- `displacement_units`
- `displacement_array`
- `force_units`
- `force_array`
- legal `continuity`

Validation requires nonnegative finite force magnitudes, equal array lengths, and strictly increasing displacement values.

### Viscous friction

The current documented form is constant only:

```json
{
  "basis": "constant",
  "damping_constant": "100.0 kg/s"
}
```

The GUI must not invent pressure-dependent or temperature-dependent viscous laws.

## 12. Body-force schema

`body_forces` is an ordered array. Each member has:

- `type`: `constant`, `time`, or `displacement`.
- `body_force_details`: data for that type.

Legal forms include:

- Constant dimensional `magnitude`.
- Time-dependent paired time and force arrays.
- Displacement-dependent paired displacement and force arrays.
- External `csv_file` for time or displacement forms.
- Legal `continuity` for dependent forms.

The editor must support stable body-force identities, add, duplicate, reorder, remove, isolated editing, and raw preservation of unsupported imports.

## 13. Travel-target and event contract

- `travel_units` defines the dimensional units for target values.
- `travel_targets` is an ordered array of piston positions.
- Targets must be finite, unique, ordered, and inside the physical travel limits.
- Target `Y` of piston `X` generates `PXTY_passed`.
- Left and right limits generate `PXL_limit` and `PXR_limit`.

Examples:

```text
P1T1_passed
P1T2_passed
P2L_limit
P2R_limit
```

Piston reorder must remap the piston number in all external event references. If target reorder or target deletion would change a referenced `T` number, the implementation must either remap atomically or block the operation with dependency details. Silent retargeting is prohibited.

## 14. Orifice flow-area modulator contract

An orifice may contain `flow_area_modulators`. Each piston modulator contains:

- `piston_idx`: one-based piston reference.
- `displacement_units`.
- `displacement_array`.
- `modulation_array`.
- `continuity`.

The modulation array contains dimensionless multipliers applied to geometric flow area. A value of 0 closes the modulated area, values between 0 and 1 partially restrict it, and 1 leaves the base area unchanged. Negative modulation is invalid. This effect is independent of discharge coefficient.

Ownership is fixed:

- The piston editor owns piston motion definitions and generated event inventory.
- The orifice editor owns the modulators assigned to that orifice and event-dependent opening.
- Both derive references from the canonical master JSON.

## 15. Reference and dependency map

Piston dependency scanning must cover at least:

1. `assembly.orifices[*].flow_area_modulators[*].piston_idx`.
2. Any `triggering_event` matching `P<index>T<target>_passed`.
3. Any `triggering_event` matching `P<index>L_limit`.
4. Any `triggering_event` matching `P<index>R_limit`.
5. Future event-bearing structures discovered by a recursive canonical event-reference scan.

Dependency results must include native paths and human-readable owners. Removal diagnostics should tell the user which orifices or event fields block deletion.

## 16. Topology projection contract

Pistons are first-class Cytoscape nodes and should be projected inline between their left and right chambers:

```text
Left chamber -> Piston -> Right chamber
```

Requirements:

- Distinct piston node kind, icon, and style.
- Native piston path and stable editor ID in transient graph metadata.
- Left/right orientation retained.
- Selection routes to the piston contextual editor.
- Piston layout metadata is transient and excluded from serialization.
- Unknown or invalid chamber references produce diagnostics without corrupting the canonical document.
- Pyros and filters remain absent from the graph.

## 17. P2 editor layout contract

The preferred initial layout is three columns:

```text
Collection | Core and connection properties | Selected law or subcollection
```

### Left column

- Piston count and list.
- Add, duplicate, move up, move down, remove.
- Selection indicator.
- Reference-warning indicator.

### Center column

- Selected piston header and stable editor identity.
- Optional label.
- Left and right chamber selectors.
- Left and right travel limits.
- Mass summary/editor entry point.
- Apply and Revert.

### Right column

- Contextual law editor for mass, areas, damping, body forces, and travel targets.
- Inline validation.
- Generated-event preview where relevant.
- Expandable raw working piston at the bottom, not a duplicate raw tab.

## 18. Proposed modular architecture

The implementation should add focused modules after dependency-manifest numbering is audited:

- Piston editor coordinator: selection, working-copy lifecycle, Apply/Revert.
- Piston editor model: isolated working record, edited-path tracking, validation summary.
- Piston law model: lookup-law normalization, tables, CSV contracts, unit-safe updates.
- Piston reference service: dependency scans, event inventory, reorder/removal plans.
- Piston editor view: mounted three-column production surface.
- Piston topology extension: first-class node projection and routing.
- Dedicated regression files for each P2 milestone.

The existing P1 collection model remains focused on collection identities and canonical collection operations.

## 19. Milestone package plan

### P2.1 Mounted shell and topology routing

Adds first-class piston nodes, piston selection routing, list and detail shell, collection actions, Apply/Revert infrastructure, raw working JSON, and deletion diagnostics.

### P2.2 Core properties and constant laws

Adds chamber connections, travel limits, constant mass, constant left/right area, and constant left/right damping entries.

### P2.3 Mass laws

Adds complete constant, time, displacement, arrays, and CSV mass forms with forced interpolation.

### P2.4 Area laws

Adds complete left and right constant, time, displacement, arrays, CSV, and continuity forms.

### P2.5 Damping laws

Adds constant and displacement-dependent static/dynamic surface friction plus constant viscous damping on both sides.

### P2.6 Body forces

Adds ordered body-force collection editing for constant, time, displacement, arrays, and CSV forms.

### P2.7 Travel targets and events

Adds target editing, generated-event previews, event inventory, and target-reference safety.

### P2.8 Orifice modulators

Adds piston-based flow-area modulators and piston-event choices within the existing orifice editor.

### P2.9 Production closure

Completes schema audit, persistence matrix, cross-reference qualification, visual/accessibility validation, and full live acceptance.

## 20. Regression strategy

Every milestone must add focused tests without weakening existing assertions. The final matrix must cover:

- Native hydration and lossless serialization.
- Stable piston and subrecord identities.
- Multiple-piston independence.
- Selection through actual mounted topology nodes and list rows.
- Working-copy isolation before Apply.
- Single-revision atomic Apply.
- Revert and discarded-edit behavior.
- Untouched precision and unknown extension preservation.
- Supported units and conversion behavior.
- Every legal lookup-law basis and representation.
- Invalid array lengths, ordering, values, units, and continuity.
- External CSV reference preservation and atomic CSV import failures.
- Left/right connection semantics.
- Generated target and limit events.
- Reorder remapping and protected deletion.
- Orifice modulator references.
- Save, serialize, reopen, and resimulation-input persistence.
- Clean request, transfer, console, and protocol state.
- No missing, unexpected, or duplicate test IDs.

## 21. P2.1 entry criteria

P2.1 may begin when this contract is accepted. Its implementation must:

1. Start from this complete P2.0 package.
2. Preserve the accepted 497-test baseline.
3. Reuse the P1 collection foundation.
4. Add the working-copy coordinator rather than editing native fields directly from the view.
5. Add piston topology nodes without reintroducing pyro/filter graph nodes.
6. Implement only the mounted shell and explicitly agreed core fields.
7. Defer advanced laws to their allocated milestones.
8. Deliver a full deterministic ZIP and milestone-specific live validation checklist.

## 22. P2.0 acceptance criteria

P2.0 is complete when:

- This contract is present in the full package.
- The user guide and focused piston extract are included as references.
- The accepted Pre-P2 live protocol evidence is included.
- No production source or generated bundle behavior has changed.
- Existing manifests still declare 497 tests.
- Static build and deterministic package validation pass.
- Package inventory and SHA-256 ledgers are regenerated.
