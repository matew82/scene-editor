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
