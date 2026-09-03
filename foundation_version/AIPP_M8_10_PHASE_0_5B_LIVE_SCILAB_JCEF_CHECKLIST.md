# M8.10 Phase 0.5B Live Scilab/JCEF Checklist

Use Scilab 2026.1.0 or newer.

1. Launch `app/main.sce`.
2. Confirm application `0.8.10-phase0.5b-0.8.10-phase0.5b-candidate.3` and foundation `P6.4.0-0.1`.
3. Run the full acceptance suite and confirm all 456 declared IDs execute with no missing, unexpected, or duplicate IDs.
4. Confirm request and transfer registries finish empty.
5. Confirm the current topology presentation remains the startup default.
6. In a development session call `P2.application.aippTopologyCanvas.setPresentation("phase05b")`.
7. Verify Chamber, Orifice, and Wall editor routing.
8. Verify Pyro and Filter remain inside the Chamber editor and never appear as graph nodes.
9. Verify Orifice midpoint placement, Tank styling, Wall placement, and boundary readability.
10. Rebuild repeatedly and verify selection restoration and no stale elements.
11. Check narrow and wide JCEF viewport behavior.
12. Save/reopen and confirm layout and presentation state are not serialized.
13. Confirm production has no comparison controls or fixtures.
14. Export and retain the protocol JSON.

Do not update accepted-release contracts until this live run passes.
