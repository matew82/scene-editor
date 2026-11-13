# Node Color comparison and transfer

The reported comparison is not a general color-read failure. The newer scene
contains `Node Color` in `studio_node_channels` version 5; the older scene does
not define it (version 4). Existing FOV/DOF and other colors remain readable.
Comparison continues to show `Not defined`; no inferred black value is inserted.

A known source Node Color can now be explicitly copied into an older target as
one typed scene-instance override. The destination's definitions and other values
are unchanged. Only the standard Node Color channel has this missing-target
exception. Missing source values, unresolved bindings, animation, stale bindings,
and other absent property types remain blocked. The normal verified backup and
atomic installer are reused. The confirmation explains version compatibility.

Native verification, 2026-11-13: isolated DAZ 4.24 and 6.25 profiles with synthetic
DzBasicCamera fixtures. Product transfer of [.125,.5,.875] loads as QColor
[32,128,223] for FOV Color in both versions, and Node Color in DAZ6. DAZ4 opens
the file but has no Node Color property; it does not apply this DAZ6-only color.
No user scene was loaded or changed. Core settings/hotkey hashes stayed unchanged;
RecentFiles.txt and the ViewportAccelerator plugin log changed during native runs.

`node tests/compare-transfer-missing-node-color.cjs` covers both directions,
missing-source disabling, stale newly-added channel rejection, exact backups,
source/definition preservation and equality after transfer. Existing color and
float_color bidirectional tests also pass. Aggregate: 53 of 54 suites passed;
existing product-rename test still expects the removed Scene Editor folder.
