# Comparison equality regressions

Run from the repository root:

```sh
node tests/compare-equality-guards.cjs
```

The 20 checks cover local and external modifier/material inheritance, source-scoped
object references, duplicate identities, unresolved data, UV/shader/texture
differences, cancellation, shared dependency reads and warm reuse.

Plain and gzip inputs exercise the comparison's DAZ 4/6-shaped file adapters with
an in-memory fixture. These are harness checks, not native DAZ execution. They do
not open or modify real scenes and need no local Diagnostics files or content
libraries. Node.js is the only test dependency.

# Hidden properties and tooltips

Run `node tests/hidden-properties.cjs` from the repository root.

The in-memory checks cover DAZ/Own metadata paths, TreeView/Controls, repeated
Hidden toggles, pending edits, Used-filter composition, hidden counts and
markings, saved keys, and tooltip diagnostics. They reproduce the legacy
`/Hidden/Correctives/Base` metadata with absent visibility flags. Explicit
boolean visibility flags take precedence; group fallback is display-only and
never writes inferred flags into source metadata. No DAZ process or real scene
is opened or modified by the tests.

# Parameter presentation sliders

Run `node tests/parameter-presentation.cjs` from the repository root.

The Controls view decorates numeric morph sliders with the saved
`presentation.colors` pair and a local thumbnail. It prefers `icon_small`,
then tries `icon_large` if the small image is absent or unreadable. Image
aspect ratio is preserved within 33 x 44 pixels. The name uses plain text
so authored ampersands and angle brackets remain literal. Missing metadata
keeps the original slider. Missing images retain valid gradient colors.

The actual DzFloatSlider/DzIntSlider still owns editing, percentages, step size,
limits, Alt-reset and the shared pending model. Hidden rows remain blue and
filter together with their artwork; key descriptors reuse source presentation.
No property is bound into a DAZ scene for this display-only feature.

Resolution and scaled-image caches are bounded and reused across view rebuilds.
Only local raster images are considered. Before decoding, a read-only header
check rejects malformed/unsupported images, files over 8 MiB, dimensions over
4096, and images over 4 megapixels. Binary API absence also falls back safely.

The 84 in-memory checks cover raster gradient pixels, image precedence/fallback, path safety,
header limits, cache reuse/invalidation, editing/reset/limits, Hidden and keys,
plus DAZ 4/6-shaped metadata adapters and ES3/ES5 syntax. These are not native
DAZ rendering tests. They do not launch DAZ or modify real scenes/assets.

Native follow-up, when authorized: open the existing editor, choose a figure
with presentation-enabled morphs, switch to Controls, inspect gradients and
small/large thumbnails, click an image and close/reopen the preview, edit a
percentage, Alt-reset, and toggle Hidden/Used.
Do not Save for a visual check; discard pending edits when closing.

# Backup date headings

Run `node tests/backups-layout.cjs` from the repository root. After rebuilding
`Scene Editor.dsa`, add `--bundle-check` to verify the bundled manager matches
its current source.

The in-memory checks cover the centered horizontal thumbnail/date group, local
`dd.MM.YYYY hh.mm.ss` formatting, smaller time text, absent images or dates,
unchanged full-screenshot buttons, cancellation and stale-click guards, plus
ES3/ES5 syntax. No DAZ process or real scene is opened or modified. Native
font sizing and rendering remain a manual visual follow-up.

# Tab and selection lifecycle

Run `node tests/tab-lifecycle.cjs --bundle-check` from the repository root.

The in-memory regressions cover Backups to DUF Inspection / All Objects, inner
tab switches, repeated selection signals, latest-tab coalescing, busy and nested
delivery, hidden inspection, replaced scenes and close with queued callbacks.
Signal callbacks queue selection/control work instead of reading native list
items or building backup widgets on the native tab-switch stack. The suite also
checks that finishing an action does not touch list widgets after an onBusy
callback closes the pane. ES3/ES5 parsing and bundle parity are included.

These tests demonstrate script lifecycle behavior, not native DAZ crash
reproduction or a guarantee that the intermittent crash is resolved. They do
not launch DAZ, close existing instances, or modify real scenes. Native retesting
requires opening the rebuilt editor in a fresh script session, then browsing
Backups, DUF Inspection and All Objects repeatedly. No Save is needed.

## Presentation follow-up: raster colors and image previews

The native screenshot showed that QLabel QSS changed text color but did not
paint the requested gradient background. The implementation no longer relies
on that background. A cached 128 x 1 Image is filled through setPixel, converted
to a Pixmap, and displayed as a six-pixel strip through DzLabel.pixmap. The
caption stays light (or Hidden blue). This is a composite row; it does not
replace the internal painter of DzFloatSlider/DzIntSlider.

Thumbnail buttons open icon_large lazily in a Close/Escape/window-close dialog.
If it is unavailable, the original small image is shown with an explicit note.
The preview preserves aspect ratio, fits the screen, never upscales, and is not
stored in the thumbnail cache. Every click rechecks the path/file safely.
Neither opening nor closing the preview applies or saves pending edits.

Sources: official DAZ Image and Pixmap APIs, DzButton pixmap/clicked API, and the
DAZ Simple Image Dialog sample. The automated checks exercise API composition
and lifecycle, not native DAZ painting or physical close-key delivery. Native
confirmation of this follow-up is still pending; DAZ was not launched.

# Restored scene visibility

Run `node tests/scene-list-reveal.cjs` from the repository root.

On startup only, a single-shot timer reveals the restored scene after the dialog
enters its event loop. The current row is resolved by path at execution time, so
rebuilt lists cannot leave a cached native item pointer. Busy work and tab dispatch
defer the reveal; a changed/cleared selection or close cancels it. A missing row
or absent selection leaves the list alone. Later tab switches do not scroll.

The documented DzListView.ensureItemVisible(item) API is used without changing
selection, centering the row, or manipulating scrollbars. API reference:
https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/listview_dz

The regression suite checks deferred startup, missing rows, changed selections,
list replacement, busy/mutation/tab guards, repeated/nested delivery, close,
ES3/ES5 syntax and exact bundle parity. Native DAZ layout/scroll behavior remains
unverified; no DAZ process is launched or closed and no real scene is modified.

### Flat presentation thumbnail follow-up

The presentation thumbnail button now applies a local transparent, borderless, zero-margin, zero-padding style in its normal, hover, pressed, focused and disabled states. Its existing 33 x 44 slot, aspect-ratio-scaled image, native icon size and click-to-preview handler are unchanged. This change does not alter the gradient strip or numeric sliders.

`node tests/parameter-presentation.cjs`: 87 checks, including portrait, landscape and small-image bounds, native icon dimensions, all flat-style states and click-to-preview preservation. Native DAZ 4.24 and 6.25 isolated synthetic widget probes also checked the 33 x 44 rendering, edge pixels, pressed state and native clicked signal; they did not open the full editor or any user scene. The exact user's theme/window remains outside that isolated coverage.

## Scene filter persistence

Settings now has a default-on Remember scene filters and sorting toggle button.
It uses the shared green checked / gray unchecked Settings style.
On normal close, Scene Editor saves the applied scene-name query, Important
filter, date/size limits, Include subfolders, and sort key/direction in its
existing central settings. Saving Settings also captures the current filters.
Scene-object clauses, the parameter-editor filter, and the All Objects filter
are never persisted by this feature.

Turning the option off deletes the saved snapshot without changing current
session filters. The next startup uses empty filters and Name ascending.
Re-enabling saves the current session, not an older snapshot. Missing settings
retain the default-on behavior. Invalid saved field values fall back safely.

Run node tests/scene-filter-persistence.cjs for the 38 in-memory regressions.
After integrating the source modules, add --bundle-check for exact bundle
parity. Coverage includes all six sort modes, persistence on/off/reopen, Settings
Cancel/retry, object-clause exclusion, malformed legacy data, missing folders,
Clear Filters, and failed/cancelled browsing. ES3/ES5 parsing is included.
These tests do not launch DAZ or access real settings/scenes. Native checkbox
validation is separate and must not be inferred from this suite.

## Wide presentation bands and outlined captions

The colored band is now at least 32 pixels high. The caption is drawn over the
gradient with eight black one-pixel offsets plus a light foreground pass. This
uses documented Image.drawText/Font metrics rather than unsupported QSS text
strokes. DAZ paints an opaque style background behind child labels, so the
caption pixmap includes the matching gradient fragment, avoiding a gray box.

One view-owned timer refreshes only when the Controls width or visible-row set
changes. Text uses native Font.elidedText at narrow widths and retains its full
escaped tooltip. Text is never stretched. Timer callbacks are disconnected and
stopped before a view is discarded or replaced. Image sizes and caches are
bounded, with a readable plain-caption fallback if pixel APIs are unavailable.

Decorated rows and group containers use plain widgets rather than group boxes,
removing the duplicate dark frames. The native numeric slider has a 28-pixel
minimum height and a 10-point font floor; its internal rail/handle remains the
DAZ theme's native painter. Percent display, limits, pending edits and repeated
Alt reset are unchanged. The existing flat thumbnail and preview are retained.

Run node tests/parameter-presentation.cjs: 104 mock regressions, including
composition, literal Unicode/markup text, resizing, fallback, lifecycle, native
slider semantics, ES3/ES5 syntax and exact bundle parity. These checks alone do
not prove native painting. Isolated DAZ 4/6 visual verification is recorded
separately; no user scene or existing process is used.

## Property display modes and 91-pixel icons

Settings offers Sliders with icons (default / stored Controls), Plain sliders
(PlainControls), and TreeView. Legacy Controls and TreeView choices survive;
missing or invalid values use the decorated Controls view. Plain sliders skip
presentation metadata, image reads and gradient construction entirely. Switching
views flushes current edits, preserves pending values and loaded reset baselines,
and includes decoration mode in the view cache identity.

Thumbnail buttons now have a 91 x 91 square slot. Images fit proportionally,
without cropping, distortion or unnecessary upscaling. The flat style and click
to full-image preview remain. Property hover text contains only the escaped label
and, for numeric sliders, the Alt-click reset hint. TreeView's diagnostic State
column is unchanged.

Run node tests/property-display-modes.cjs (15 checks) plus the presentation and
Hidden regressions. Native synthetic checks separately verify each renderer and
programmatic native reset signals; they do not claim a physical Alt-key test or
a full-editor TreeView interaction test.

## Scene file rename

Double-clicking a scene or clicking the edit icon beside the Scene information
heading opens the same deferred filename-only rename dialog. The directory and
DUF extension stay fixed. Selection is captured as path plus list revision; no
native list-item pointer survives the event callback. Busy, closing, stale and
repeated requests are rejected. The three outer tab page wrappers are retained
through the complete dialog/pane lifetime.

The Host validates filenames and physical source identity, rejects destination
and metadata collisions, and moves only the DUF and existing recognized preview
companions: .duf.png, .tip.png, .duf.tip.png, .png and .jpg. A durable transaction
journal and unique sibling stages support case-only Windows renames and safe
rollback. Changed/recreated foreign files are never overwritten during rollback;
an incomplete recovery retains its journal and exact paths for intervention.
Annotations, Important, unknown metadata and lastScene migrate in one state
commit. The comparison basket is rebound in order and scene filters stay intact.

Historical backup manifests are not rewritten. Because backup discovery matches
the source path, old-name backups do not automatically appear under the new
filename; the rename dialog explicitly warns about this. Cached inspection data
is rebuilt for the new identity rather than edited in place.

Run node tests/scene-rename.cjs --bundle-check: 55 checks, including failed moves,
state conflicts, rollback ownership, file/parent symlink substitution, filename
validation, cancel/stale UI events, and bundle parity. The independent review
verified the source-link guard. Native filesystem probes use only unique private
fixture directories and retain their artifacts; no real scene is loaded or renamed.

## Final combined validation

All nine tests/*.cjs suites with --bundle-check pass: 305 checks total. The
deterministic 106-module bundle check and ES3/ES5 compatibility also pass.
Native DAZ 4.24 and 6.25 synthetic renderers verified the 91-pixel square, flat
uncropped images, wide gradients, outlined captions, narrow-width elision, and
decorated/plain transitions preserving pending .375 and baseline .125. The
programmatic native reset callback passed; a physical Alt-key interaction was
not exercised. Native TreeView interaction and a full user-scene editor session
were not exercised.

Both native Settings probes completed 37 assertions with no failures, including
green/gray toggle rendering, persistence, exclusion of object clauses, reopen and
Cancel. Their isolated modal test processes did not exit after completion and
were stopped by the owned-PID timeout; existing user processes were untouched.
This shutdown limitation is separate from the passed dialog assertions.

A synthetic 1000-row resize took about 0.41 seconds in DAZ 6 and 0.65 seconds in
DAZ 4. Repaint work occurs only after width/visibility changes, but very large
property lists may briefly pause while resizing.

Native rename also passed all six fixture scenarios in both DAZ 4 and DAZ 6:
exact DUF/five-companion bytes, Windows case-only rename, source/companion
collisions, cancelled/invalid requests, and state/journal reload. Both probe
processes exited with code 0. All retained fixtures are outside the repository.

## Enter filter, shared gradient backgrounds, compact Rename

The parameter-filter field now uses returnPressed() to call the same guarded
handler as Apply filter. Automatic dialog default buttons are disabled so Enter
in that field cannot implicitly invoke Save, Close or another mode button.
The Keys button is now labeled Animation; model identifiers are unchanged.

The 128 x 1 gradient pixmap was already cached by RGB color pair. Outlined
captions now also share an immutable scaled background by colors, width and
height, copying only each title's crop before drawing. This cache retains at
most 16 images and an estimated 4 MiB of RGBA pixels; larger entries are not
retained. Different text still requires its own rendering. No overall speedup
percentage is claimed; regression fixtures verify one shared background for
40 different captions and safe reuse/eviction.

Rename has a separate compact dialog identity, a 560-pixel width capped by
available screen size, and content-derived height. Wrapped text uses sizeHint,
not minimumSizeHint alone, since the latter clips the warning in native DAZ.
Native synthetic captures were inspected: DAZ 4 client size 560 x 181 and
DAZ 6 client size 560 x 187; both warning paragraphs remain fully visible.
No scene was loaded, saved or renamed for these UI tests.

All nine regression suites pass (312 checks), with the deterministic 106-module
bundle check and ES3/ES5 compatibility. Native DAZ 4.24/6.25 synthetic Controls
mode probes each passed 50 assertions, including images, gradients, pending
value preservation and programmatic baseline reset. returnPressed() connected
successfully in both hosts; physical Enter/Alt key events and the full editor
with a user scene were not exercised. All test processes exited with code 0.
Two runner protection summaries reported a missing process only because an
independent, owned test process exited concurrently; both original user DAZ
process identities were independently verified unchanged afterward.
Evidence: C:/Users/Andrii/Documents/Codex/2026-11-07/scene-filter-gradient/.

## Property dialog teardown after repeated-object reports

The two reported stops both occurred when opening a second object's parameter
editor. One stopped during Controls construction; the next was before any
Controls were created, at native JSON parse. Both logs contain DAZ's generic
"Unhandled error while executing script". This does not establish a gradient
or thumbnail fault. The second DAZ process still answered Windows after its
script stopped, so a stale progress dialog is possible.

Property UI cleanup now explicitly disconnects signals, releases large editor,
session, model and row references, closes the parentless dialog and schedules
its native destruction with deleteLater. It does not process events during
teardown. Key-strip or Controls cleanup failure no longer skips the remaining
disconnect and dialog cleanup steps. This is a lifecycle hardening measure,
not a proven root-cause fix for the intermittent failures.

All nine regression suites (312 checks) and deterministic ES3/ES5 bundle
validation pass. UI harness checks verify that disposal happens after signal
disconnection across all display-mode cases. In isolated DAZ6 hidden rendering,
both baseline and updated code completed EuroApt-1 -> Fridge -> Genesis8_1Female
against the actual read-only DUF, including all6477 Lisa controls. These probes
replaced modal exec with offscreen grab/close; they did not test actual user
input or the full main-window event loop. Both subsequently exited with code
-1 without a recorded new Windows crash event, so they are not clean end-to-end
native passes and do not prove the reported hang is fixed.
No real scene was loaded/saved and no user's DAZ process was controlled.
Evidence: C:/Users/Andrii/Documents/Codex/2026-11-07/scene-controls-hang/.


### Deferred dialog disposal rollback (2026-11-07)
After a new report of failure after closing Lisa and returning to All Objects, removed the experimental property-dialog deleteLater call. Disconnect/stop and script-reference cleanup remain. The log reaches All Objects action eligibility at 03:00:23 without a new explicit error; no native stack establishes causation. This is a risk-reducing rollback, not a confirmed fix for earlier repeat-open hangs. A regression now prohibits queuing dialog deletion at return.


### Scaled-gradient cache rollback (2026-11-07)
Removed only the added scaled native Image cache after controlled Publishing Build
6.26.2026.30901 Lisa -> Fridge tests. Cached full decoration crashed in Qt6Qml GC;
icons-only, gradient-only, outlined-text-only and full decoration without this
cache each completed with no Unhandled errors or matching crash report. Each
component ran once, with an 8-second modal per object and a 90-second observation
window. These results implicate the cache but do not prove the native root cause.
The original 128 x 1 color-pair cache, title pixmap cache, icons, outlined text
and resize watcher are unchanged. Regression checks now require independent
scaled backgrounds for different captions while retaining original pixels.
No additional DAZ process was launched for this rollback.
Evidence: C:/Users/Andrii/Documents/Codex/2026-11-07/scene-controls-hang/components-comparison.json


### Optional property cache and report access (2026-11-07)
The KitchenTable report object-properties-1794072009336-3.json shows successful
publication (28 model properties, 17 displayed), with only an absent DAZ cache.
Missing optional cache is now informational; Own fallback and its reason remain
in the report and the header indicates fallback. Read/schema errors still warn.
A Property report footer button opens read-only details (600 x 400 initial size,
resizable); when the text-widget API is absent, an information dialog is used.
The rename icon now follows the heading immediately, with trailing stretch after
the icon instead of stretching the heading. No native DAZ session was launched
for these changes; in-memory regressions cover fallback and report access.
