# Scene File Workbench rename

The real project folder and product scripts/icons now use Scene File Workbench.
Launch `Scene File Workbench.dsa`. Its 91 x 91 PNG thumbnail and 256 x 256
`.tip.png` retain the same artwork and the matching DAZ Studio filenames.

SaveGuard 2 discovers the new sibling folder and renamed support modules for
saved-object search, saved-scene comparison and live-scene comparison. It can
also discover a complete legacy Scene Editor installation as a fallback.
Backups still use the original SaveGuard identity and manifests.

Existing custom actions remain usable through `../Scene Editor/Scene Editor.dsa`.
That small compatibility launcher delegates to the new entry through DzScript;
it has no settings, cache or application code of its own. Keep that folder while
old actions still refer to it. The launcher source is `support/Legacy Custom Action.dsa`.
No menu labels, hotkeys or DAZ Studio configuration files were edited.

Internal SceneEditor JavaScript API names, dialog identities, schema identifiers
and `settings/scene-editor.json` remain stable intentionally. Existing preferences,
notes, backup associations and caches are not rewritten for a cosmetic rename.
Two historical recent-file entries inside the project's Diagnostics folder still
contain their original paths; historical diagnostics/rollback records are not
rewritten. Normal external scene and backup paths are unchanged.

Build: `node Diagnostics/build-dsa.cjs`; verify with `--check`.
Regression suites: `node tests/<suite>.cjs --bundle-check`.
The rename regression is `node tests/product-rename.cjs`.
These checks do not launch DAZ Studio. Native UI launch and custom-action execution
remain untested in DAZ Studio during this migration.

DAZ filename convention:
https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/interface/panes/content_library/results_view/start

## Validation after migration (2026-11-11)

- All 44 current `tests/*.cjs` suites passed, including bundle parity where supported.
  The product rename suite covers 22 dedicated checks.
- Five existing SaveGuard object-filter/comparison suites passed.
- The deterministic 110-module standalone build matches its sources and passes
  strict ES3/ES5 parsing. SaveGuard Manager/Settings match their updated bridges.
- All 89 renamed PNG files are byte-identical. Five project settings files and
  one SaveGuard settings file are hash-identical to the migration baseline.
- Actual read-only backup catalogue checks for three scenes returned matching
  local/UNC counts of 6/6, 9/9 and 5/5. No backup files or settings were changed.
- The existing Studio6 custom action points to the preserved legacy launcher
  and thumbnail. Forwarding behavior passed mock tests; native DAZ execution
  remains untested. Reopen the tool from its launcher to load the new code.

No repository commit, push, remote rename, user-scene rename or hotkey change was
performed. Existing user changes and deletions were retained.
