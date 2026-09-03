# P2.1 Live Validation Checklist

1. Launch `app/main.sce` using Scilab 2026.1.0 or newer.
2. Run the full acceptance suite. Expected declared test count: **507**.
3. Confirm zero missing, unexpected, or duplicate test IDs.
4. Load or create a deck with two chambers and one piston.
5. Confirm the piston appears as a distinct topology node between its left and right chambers.
6. Select or double-click the piston and confirm the Piston editor opens.
7. Confirm the three-column shell, expandable raw working copy, Apply, and Revert controls are visible.
8. Edit the piston label. Confirm the master JSON remains unchanged until Apply.
9. Revert once, then edit and Apply. Confirm one authoritative revision and preserved unknown data.
10. Exercise Add, Duplicate, Move Up, Move Down, and Remove. Confirm referenced deletion is blocked.
11. Confirm pyros and filters remain chamber-owned and absent as graph nodes.
12. Export the protocol JSON and return it for closure review.
