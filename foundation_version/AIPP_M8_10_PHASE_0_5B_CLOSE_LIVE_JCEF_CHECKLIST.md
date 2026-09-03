# Phase 0.5B Close Live Scilab/JCEF Checklist

Use Scilab 2026.1.0 or newer.

## Automated acceptance

1. Launch `app/main.sce`.
2. Confirm application identity `0.8.10-phase0.5b-close.candidate.1`.
3. Run the complete suite.
4. Confirm all 475 declared IDs execute exactly once.
5. Confirm zero failures and zero skipped tests.
6. Confirm no missing, unexpected, or duplicate test IDs.
7. Confirm request and transfer registries finish empty.
8. Export the protocol JSON and retain it with the candidate.

## Hover lifecycle

1. Hover Chamber 1 and move into the card.
2. Hover every Pyro row and the Filter row.
3. Move directly from Chamber 1 to an Orifice and verify the same card changes content.
4. Move from the Orifice to a Wall and verify the same card changes content.
5. Confirm only one `#aippTopologyHoverCard` exists in DevTools.
6. Leave the node and card and verify the card closes.
7. Pan while the card is visible and verify it closes without a trail.
8. Zoom while the card is visible and verify it closes without a trail.
9. Click Relayout while the card is visible and verify it closes.
10. Click Fit to view and Reset zoom while exercising all entity types.
11. Switch to Current presentation and verify the proposed hover card closes.
12. Switch back to Phase 0.5B proposed and verify hover resumes.
13. Open a different JSON deck while the card is visible and verify stale content closes.

## Edge cases

1. Empty Chamber: no Pyro or Filter badge, and no owned-entity rows.
2. Pyro-only Chamber: only the Pyro badge appears.
3. Filter-only Chamber: only the Filter badge appears in the first badge position.
4. Chamber with eight or more Pyros: card remains usable and scrollable.
5. Long labels and formulations wrap without obscuring values.
6. Constant-Cd Orifice shows the basis and value.
7. Tabular-Cd Orifice shows point count and compact ranges.
8. Walls show Variable Coefficient, Constant Coefficient, Constant Temperature, Constant Heat, and Wall-reference summaries correctly.

## Repaint exercise

1. Perform at least 100 hover transitions across Chambers, Orifices, and Walls.
2. Repeat pan, zoom, relayout, and window resize operations.
3. Switch primary app tabs and return to Input deck editor.
4. Confirm no ghost cards, stale text, clipped card remnants, or duplicate cards.
5. Confirm no new JCEF console errors.

## Data integrity

1. Record deck serialization, revision, and dirty state before hover exercise.
2. Complete the full hover and repaint exercise.
3. Confirm serialization is byte-identical.
4. Confirm revision is unchanged.
5. Confirm dirty state is unchanged.
6. Save and reopen the deck and verify topology and summaries remain correct.

## Close decision

Phase 0.5B may be closed when the automated suite and every required checklist item pass. Production debugging may remain enabled for the current single-user development phase, but must be reconsidered before release promotion.
