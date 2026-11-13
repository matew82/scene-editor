# Live comparison unknowns review, 2026-11-13

## Changes
- SaveGuard removes the large live notice label, without suppressing unresolved identity guards or Unknown rows.
- Saved-copy column headings use savedAt (fallback recorded DUF modification time), local dd.MM.YYYY, hh.mm.ss, including version switching. No source path. Missing timestamps are explicitly unavailable.
- Live properties represented by saved modifier records are no longer duplicated as live-only properties with unknown saved counterparts. Current values remain available even if animation-key extraction fails; keys remain explicitly Unknown.
- Native alias targets and inherited color/string/bool/numeric property kinds are supported. Cycles and missing alias targets remain Unknown. Saved aliases are not silently evaluated or assigned defaults.
- Renderer helper subclasses and independently verified singleton registry fallback are supported when node enumeration fails. Ambiguous owners remain blocked.

## Evidence
- Read-only inspection of existing Skyrim05.duf: 2386 nodes, 10716 modifiers, 3687 inline modifier channels. Thus duplicate modifier/live-property classification affects realistic large figures, not only the synthetic case. The active user scene was not captured and no claim is made that every reported Unknown was reproduced.
- Native API probes ran in separate DAZ4.24 and6.25 profiles with copyAppSettings off / copySessionUI off. Main UI/settings hashes unchanged; existing processes untouched. Alias target, inherited property kinds, string/file and node-reference APIs recorded under C:/Users/Andrii/Documents/Codex/2026-11-13/live-property-probe/REPORT.md.
- Previous render-only native fixtures already have177/177 or221/221 Equal. They do not reproduce current user's full-scene unknown list.
- Regression tests cover modifier dedup, unknown animation with retained value, alias targets/cycles, inherited color, dynamic backup headings and rendering singleton fallback.
- Bundle ES3/ES5/DAZ4 compatibility and deterministic rebuild pass. No commit or push.

## Remaining distinctions
- Not recorded means absent saved data, not necessarily unavailable DAZ API. Missing saved animated helper current_value cannot be replaced by an invented evaluated value.
- Saved alias/externally missing definition, ambiguous object identity and unresolved external assets remain conservative Unknown.
- Material shader/UV/texture composition and simulation coverage retain the existing explicit Unknown markers; render-map extraction does not imply arbitrary material/shader parity.
- DzNodeProperty references now bind through captured native pointer identities, with null and unresolved/outside-capture rejection. NumericNode still has separate numeric and referenced-node data and is not supported; it must not be conflated with DzNodeProperty.
- Unsupported key interpolation remains Unknown even when the current value is known.
- No user scene was loaded, saved, edited or closed for this work. UI test execution is mocked; full active-scene result remains to be checked in user's session.


## Follow-up: screenshot object identities
User screenshot identifies three unresolved Lisa children: Genesis8.1 Female Tear, LI_G8F_Pubic_Hair_01, CJ_FiberLashes. Read-only real metadata from hunter_call5_13.duf versus Skyrim05.duf reproduces all three. Skyrim has Amy and Lisa copies of the same assets; Lisa's display labels carry (2), while asset URLs and internal names are unchanged. Old structural matching unnecessarily required the child's display label.

Fallback now requires a matched native parent pointer plus identical external asset and internal name, with uniqueness on saved and native sides. It does not strip label suffixes, choose an arbitrary duplicate or match by list order. tests/live-object-owner-identity.cjs includes the minimal actual records: old implementation3 unresolved; updated0. Duplicate siblings and wrong-owner cases remain unresolved. This is a metadata-adapter replay, not a claim of inspection of the user's active native scene.

Comparison date format corrected to dd/MM/yyyy, hh:mm:ss. SaveGuard bundle rebuilt.
