# Known, Accepted Vulnerabilities

Tracked here rather than silently ignored, per Engineering Blueprint
Section 14 (security audits, maintenance). Reviewed whenever
`.github/workflows/ci.yml`'s `dependency-audit` job output changes, and
whenever `next` is upgraded.

## Currently accepted (as of this entry)

All four are pinned _inside_ `next@15.5.22`'s own dependency tree
(`next > postcss`, `next > postcss > nanoid`, `next > sharp`), not
direct dependencies of this repo — we cannot bump them independently
without either an upstream Next.js patch release or a
`pnpm.overrides` force-resolution.

| Package         | Installed | Patched  | Severity | Advisory                                                                 |
| --------------- | --------- | -------- | -------- | ------------------------------------------------------------------------ |
| postcss         | 8.4.31    | >=8.5.12 | High     | [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) |
| postcss         | 8.4.31    | >=8.5.18 | High     | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) |
| nanoid          | 3.3.17    | >=3.3.18 | High     | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) |
| sharp (libvips) | 0.34.5    | >=0.35.0 | High     | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) |

`nanoid` was missing from this table until a repo-wide security audit
(2026-09-02) cross-checked it against a fresh `pnpm audit
--audit-level=high` run — it's a real, currently-present finding
(pulled in transitively via `postcss`), not a new regression; this
doc had simply drifted from `pnpm audit`'s actual output. Same
practical risk profile as the others: it requires a custom, attacker-
controlled ID generator with a zero `size` argument, which nothing in
this codebase does.

**Why not force-patched via `pnpm.overrides`:** attempted and reverted.
Overriding `postcss`/`sharp` to patched versions triggered a much wider
lockfile re-resolution than intended (~300 changed lines), including an
unrelated major-version jump in `eslint` that broke peer-dependency
ranges for `eslint-plugin-jsx-a11y` and `eslint-plugin-react-hooks`.
For a solo-maintained project without capacity to fully re-verify a
change of that blast radius, this was judged riskier than the
vulnerabilities themselves — both are exploitable primarily through
build-time/source-map or image-processing edge cases, not the
project's actual live attack surface (no user-supplied CSS is ever
processed by PostCSS at runtime; `sharp` is only exercised via Next's
image optimization pipeline on operator-supplied images, not
arbitrary user uploads).

**Real resolution path:** wait for a Next.js patch release that bumps
its internal `postcss`/`sharp` pins, then a routine `next` upgrade
(as already done once in Stage 7, 14→15.5.22) closes this
automatically. Re-run `pnpm audit --audit-level=high` after every
`next` version bump to check.

**Do not** treat `dependency-audit`'s `continue-on-error: true` in CI
as "vulnerabilities don't matter" — it exists specifically so real,
currently-unfixable findings don't get lost in a wall of expected
noise, and so a _new, actually-fixable_ finding introduced by a direct
dependency is still visible in every CI run even though it won't
block the merge. Revisit whether it should block merges once this
list is empty.
