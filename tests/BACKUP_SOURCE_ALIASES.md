# Local Windows share aliases in backup discovery

Run `node tests/backup-source-aliases.cjs` from the project root. Add
`--bundle-check` after rebuilding the launcher. The focused suite has 23 checks.

Backup discovery can resolve a source selected through this computer's UNC
share to its local drive path. It asks Windows for the current SMB share map,
checks the exact computer, share and relative path, and rechecks the mapping
before returning results. Existing source files must still be regular files
with matching size and modification time through both paths. Metadata is read
after the potentially slower share query. A changed mapping discards the list.

The fixed read-only PowerShell command runs hidden with no profile or scene-path
arguments. Only its owned helper is stopped on cancellation or a ten-second
timeout. Missing support or query failure reports the local-drive workaround.
There is no filename-only or content-only association. Different computers and
unknown shares remain distinct. Local browsing skips alias work for unrelated
manifest names. A local UNC query currently costs approximately two Windows
query startups, around 2.8 seconds on the test computer.

This mapping is only for backup source comparisons. Backup roots, write paths,
original manifests, historical source identity and rename pin digests are not
rewritten. General annotation/history keys are unchanged. No settings migration
or user scene/backup write is part of this fix.

Validation on 2026-11-11:
- 23 alias checks, including native-adapter mocks, ES3 and ES5 parsing.
- 12 rename-association, 5 preview-roundtrip, 14 backup-layout and 56 scene-rename
  checks passed against current sources.
- The real read-only catalog returned the same 6, 9 and 5 versions for three
  scenes through local and UNC paths. Windows file IDs were equal.
- All 7,996 backup files retained their metadata; editor and SaveGuard settings
  retained their SHA-256 hashes during verification.
- Native DAZ was not launched. DzProcess behavior is covered by mocks and its
  actual fixed PowerShell query was executed separately on Windows. Full DAZ
  integration and the final rebuilt launcher remain separate validation steps.

Official native API references:
https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/process_dz
https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/object_index/fileinfo_dz
https://docs.daz3d.com/public/software/dazstudio/4/referenceguide/scripting/api_reference/samples/file_io/file_zip_compress_each/start
