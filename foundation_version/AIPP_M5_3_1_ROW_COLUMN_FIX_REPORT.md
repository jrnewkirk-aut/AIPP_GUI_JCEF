# M5.3.1 Row/Column and Qualification Fix

- Normalized Scilab material names to a 1-by-N row string vector before JSON encoding.
- Each state-dependent chamber-filter test now loads runtime materials independently.
- Dynamic-property test is asynchronous and self-initializing.
- Inherited application tests compare against active application identity rather than `0.1.0`.
- Material file remains at `application/data/material_list.json`.
