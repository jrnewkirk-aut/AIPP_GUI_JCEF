# AIPP M7.4 Literal Production Marker Correction

## Root cause
Scilab `grep` remained unsuitable for validating literal JavaScript and DOM marker strings in the concatenated production bundle. Although `aippTabEditor` exists in `bundle.prod.html`, the runtime gate reported it missing.

## Correction
Both required-marker and forbidden-marker scans now use `strindex`, which performs direct substring searches and avoids regular-expression and grep interpretation. The required marker set and production bundle remain unchanged.

## Expected result
`app/aipp_main.sce` should complete production validation and proceed to JCEF window creation.
