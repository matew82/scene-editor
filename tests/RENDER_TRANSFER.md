# Render settings between saved scenes

Use Comparison and select individual Render Settings rows, then the existing
A to B / B to A copy button. The review names both files and the selected changes.
A verified `.before-transfer-...duf` backup is required before the destination is
installed through the existing transactional writer. Source files and live DAZ
settings are never changed.

Supported: dimensions/aspect/constraint; quality and nested renderer scalar,
boolean and color values; existing Environment/Tone Mapper channels (including
inherited values written as instance overrides); existing canvas scalar fields;
Active Canvas mapped by unique canvas name rather than numeric index. Canvas
node-list masks require the same verified membership in both scenes. Definitions,
unselected values and unrelated scene bytes are preserved.

For textures, select the `... / Image` row. This copies the COMPLETE map, including
layers, masks and image adjustments, not the numeric value of that parameter.
The confirmation states this explicitly. Layered image definitions get a private
new ID; existing target image definitions and their other users remain untouched.
Simple image metadata is imported only when it does not conflict with another use
of that file. Referenced texture files must resolve, but are never modified.
`Layered image` labels may be equal while their composition differs; copying this
Image row is therefore allowed even if its label is equal. Turn Differences Only
off if needed to select it. Select maps separately from scalar settings.

Not supported: animated/formula-driven/aliased render helpers, creating/removing
canvases, unknown canvas types, LPE expressions with scene-bound labels,
unresolved/mismatched node-list membership, external image definitions, unknown
layer dependencies and individual normalized image-composition leaves. These are
rejected rather than silently dropping dependencies. A current snapshot is not an
animation curve, so animated helper values must not be transplanted as static data.

Validation: 52 Node harness suites pass, including 24 focused core render-copy
checks, map-copy/integration tests, source/destination staleness, backup failure,
cancellation, unchanged shared image definitions, both directions and existing
comparison/read-only UI flows. Bundle parses ES3/ES5 and DAZ4 compatibility lint.
No native DAZ session, live renderer, user settings or real scene file was touched.
Native loading/appearance of transferred synthetic maps remains unverified.
