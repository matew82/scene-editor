Scene File Workbench - native DAZ saved DUF editor

Run Scene File Workbench.dsa from this project. Open only inspects the saved DUF object list; select an object for its properties. No DAZ scene load or scene graph mutation.

DAZ Cache / Own Cache stays in the main window. DAZ is preferred, with explicit own fallback when missing/corrupt; readable partial DAZ cache does not trigger full DSF scans. Bones use Direct inherited node properties and never installed morph discovery.

TreeView / Controls is a second independent main-window toggle. Both views share pending edits. Controls builds every property in the loaded model (not a virtual subset), unless the user applied a filter. Authored groups retain all nesting with H1/H2/H3 labels, deeper H3 indentation. Float/int sliders use the loaded raw property value as fixed Alt-reset baseline, not asset default or last movement. Percent display follows metadata. Checkable bool buttons are green/grey. Other supported types use line edits; strings/URIs are literal, enum/known vectors use type validation, opaque values are readonly diagnostics.

FIRST TEST: DISPLAY TIMING ONLY, DO NOT SAVE
1. Open Diagnostics/_test5.duf; select Camera. Clear any property filter.
2. Switch TreeView -> Controls -> TreeView -> Controls. Note full construction and repeated display times.
3. Select Pizza_Boy and repeat with an empty filter, allowing full construction of thousands of controls. Cancel is available during build.
4. Optionally move Lens Shift X slider, then Alt-click it. It must return to the value loaded into the editor. Verify the same value in TreeView. This test changes pending model only; do not Save.
5. Close: explicitly Discard any remaining pending edits, or Cancel closing.

Measurements: Diagnostics/property-view-*.json separates construction/layout/update counts and timing; object-properties-*.json keeps read/resolution separate. View-only switches do not reread asset sources. One event pass is timed for layout; later painting may be outside that measure. Controls native performance is NOT yet verified.

Save remains one explicit action without another confirmation modal. It uses the accepted token writer, strict validation, source/stage/installed guards and recovery. Pending Save/Discard/Cancel remains on source/object/file/close changes. No unknown scene data, DSF or DAZ cache is rewritten by view selection. No JSON detail panel.

See Diagnostics/controls-view-validation.json and controls-real-read-only-validation.json. Current117 regression tests, ES3/ES5 and independent review passed. Mock widget timing is not native DAZ timing.
