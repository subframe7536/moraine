# Plan 005: Ship the v4-only consumer integration

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Update the plan status row when complete.
>
> **Drift check (run first)**: `git diff --stat 7a0c7768..HEAD -- package.json tsdown.config.ts src/unocss src/tailwind docs README.md`
> Stop if plans 003/004 are not complete: this plan deletes their temporary
> legacy styling runtime and requires zero remaining `cva` callers.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/003-migrate-elements-and-form-components.md`, `plans/004-migrate-navigation-and-overlay-components.md`
- **Category**: migration
- **Planned at**: commit `7a0c7768`, 2026-09-03

## Why this matters

The current package ships generated `tw3.css` and `tw4.css`, supports Wind3,
and hides component syntax translation behind UnoCSS transformers. The PRD
assigns component CSS generation to the consumer's Tailwind v4 or UnoCSS
engine, mandates their registration, and keeps only `icon.css` as an optional
runtime asset. This plan turns those decisions into publishable package
metadata, consumer fixtures, and correct user-facing documentation.

## Current state

- `package.json:17-31` exports `./tw3.css`, `./tw4.css`, and `./icon.css`;
  `dependencies` contains `cls-variant`; Tailwind peer range is `>=3.0.0`.
- `tsdown.config.ts:1-120` imports `presetWind3`, `presetWind4`,
  `transformerVariantGroup`, `baseUnocssConfig`, syntax migration and a
  simplify extractor; it emits all three CSS files.
- `src/unocss/theme.ts:15-70,463-525` exposes `wind3`,
  `enableComponentLayer`, prefix/hash injection. `src/unocss/{inject-prefix,
inject-compile-class,migrate-syntax}.*` and their tests implement the old
  pipeline.
- `src/tailwind/index.ts:1-99` registers tokens, animations/data/aria variants
  and currently icon stubs. `src/tailwind/tailwind.test.ts` is in-memory only,
  not a packed consumer fixture.
- `docs/pages/styling.mdx` still documents `presetWind3`, component layers,
  Tailwind v3, wrong-wide `@source './node_modules/moraine/**/*'`, and treats
  icon CSS adjacent to the styling setup. `docs/pages/utils.mdx` advertises
  `cva`/`extendCN`. `docs/build/previews/source.ts:67-69` maps both old CSS
  assets.
- PRD-required Tailwind stylesheet is:

```css
@import 'tailwindcss';
@import 'moraine/icon.css'; /* optional runtime asset */
@plugin "moraine/tailwind"; /* required */
@source "../node_modules/moraine/dist"; /* path relative to this CSS file */
```

UnoCSS must load `presetWind4()` and `presetMoraine()` and scan
`./node_modules/moraine/dist/**/*.{mjs,jsx}`. `icon.css` neither scans source
nor registers tokens/plugins/presets.

## Commands you will need

| Purpose               | Command                                | Expected on success                                                      |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Build package         | `nub run build`                        | exit 0; `dist/icon.css` exists and `dist/tw3.css`, `dist/tw4.css` do not |
| Engine tests          | `nub run test src/tailwind src/unocss` | exit 0                                                                   |
| Consumer fixtures     | `nub run test test/consumer-fixtures`  | exit 0                                                                   |
| Docs production build | `nub run docs:build`                   | exit 0                                                                   |
| Final quality gate    | `nub run qa`                           | exit 0                                                                   |

## Scope

**In scope**:

- `package.json`, lockfile, `tsdown.config.ts`, `src/tailwind/**`,
  `src/unocss/**`, deleted obsolete transformer modules/tests.
- Create packed-package consumer fixtures/tests under `test/consumer-fixtures/`
  (or the repository's existing test fixture location if discovered).
- `README.md`, `docs/pages/styling.mdx`, `docs/pages/utils.mdx`,
  `docs/unocss.config.ts`, `docs/build/previews/source.ts` and its tests.

**Out of scope**:

- Reworking component classes/provider adoption (plans 003/004).
- Altering icon component API or adding a new icon set.
- Docs-only UnoCSS variant-group authoring; retain
  `transformerVariantGroup()` in docs configuration.

## Git workflow

- Branch: `codex/005-ship-v4-only-consumer-integration`.
- Do not push/open a PR without instruction. Delete only targets verified in
  the current-state inventory.

## Steps

### Step 1: Gate deletion on a zero-caller audit

Before deleting legacy support, confirm both component plans are merged and
run a repository source scan. There must be no `cva(`, `cls-variant`, or
`extendCN` usage outside explicitly historical plan text. If a caller remains,
return it to its owning plan rather than retaining public compatibility.

**Verify**: `rg -n "\bcva\b|cls-variant|\bextendCN\b" src docs README.md package.json` → no output except any intentionally renamed non-API prose that must be removed in this plan.

### Step 2: Remove the legacy library CSS pipeline and v3/component layers

Delete the internal legacy bridge from `src/shared/utils.ts`, update
`src/shared/types.ts` to import `ClassValue` from `./style/recipe` for `SlotClassValue`,
remove `cls-variant` from package metadata/lockfile, and remove public `cva` and
`extendCN` exports. Delete `inject-prefix`, `inject-compile-class`, and
`migrate-syntax` source/tests. Simplify `presetMoraine` to Wind4 only: remove
`wind3`, `enableComponentLayer` (including the legacy dynamic imports of `unocss`
and `@unocss/transformer-compile-class` in `src/unocss/theme.ts`), prefix/hash options,
old transformers, all component-facing shortcuts and regex rules. Retain theme tokens,
keyframes, `animate-mo-enter/exit`, global styles, colors, and documented icon exports.
Update `src/tailwind/index.ts` to provide a default export (`export default moraineTailwind()`)
so `@plugin "moraine/tailwind"` loads cleanly in Tailwind CSS v4.

Rewrite `tsdown.config.ts` so normal JS entries build without component CSS
generation; retain a separate UnoCSS invocation only for `icon.css` using
`DEFAULT_ICON_SHORTCUTS` plus Lucide data. Remove `tw3.css`/`tw4.css` exports
from both config and `package.json`, retain `./icon.css`, set `"sideEffects": ["*.css", "./dist/*.css"]`
in `package.json`, and set Tailwind peer dependency to `^4.0.0` (with appropriate
optional metadata). Update `AGENTS.md` guidelines to replace all remaining references
to `cva` with `recipe`.

**Verify**: `nub run build` → exit 0; `[ -f dist/icon.css ]` is true and
`[ ! -f dist/tw3.css ]` and `[ ! -f dist/tw4.css ]` are both true
(`Test-Path`/PowerShell form is intentionally avoided so the command is portable
across the project's POSIX shells/CI).

### Step 3: Test actual installed-consumer engine contracts

Keep focused unit coverage for token/theme/variants in `src/tailwind` and
`src/unocss`, updating tests away from Wind3, component layers, shortcut
generation, and cva-oriented AST transformations. Add two fixture projects
that consume a packed `moraine` tarball rather than source aliases:

- Tailwind v4 fixture CSS includes `@plugin "moraine/tailwind"` and an
  `@source` path relative to its stylesheet resolving to installed
  `node_modules/moraine/dist`; assert representative component utilities,
  theme tokens, data/aria variants, and animations compile. **Assert the emitted
  stylesheet text actually contains**, not just that the compiler ran:
  a `data-disabled`/`data-focused`/`aria-invalid` variant rule,
  `animate-mo-enter`/`animate-mo-exit` rules plus their `@keyframes mo-enter`/`mo-exit`
  blocks, and the `z-floating`/`opacity-64` tokens (PRD §4.1).
- UnoCSS fixture loads `presetWind4()` and `presetMoraine()` plus filesystem
  content matching installed `dist/**/*.{mjs,jsx}`; assert the same essentials
  generate. **Assert the same `data-*`/`aria-*` variant rules, `animate-mo-*`
  rules/keyframes, and custom tokens are present in the generated output**
  (PRD §4.2).

In both fixtures prove components compile without importing `icon.css`; add
separate checks that icon rendering CSS appears either from `moraine/icon.css`
or the relevant engine icon integration. Do not use icon success as evidence
that component styling was configured.

**Verify**: `nub run test src/tailwind src/unocss test/consumer-fixtures` → exit 0.

### Step 4: Rewrite user documentation from the consumer perspective

Update the README and styling docs to call the work the “Moraine styling system
architecture refactor,” not a `cn`-only change. State `cn`'s exact runtime
boundary (merge/conflicts only; no CSS generation, scan, plugin/preset loading,
or token validation). Document `recipe` as object-only breaking API with no
`cva` alias and object-only `style`/`styles`. Show correct Tailwind and UnoCSS
configuration snippets above; explicitly call `@source "moraine"` invalid.

Describe `icon.css` as optional runtime mask assets, independent of the
component styling pipeline; say the Tailwind plugin/UnoCSS preset remains
mandatory whether icon masks are imported or engine icons are used. Explain
provider/default/composition/instance inheritance and precedence, including
root versus named-slot class/style ordering. Update preview import rewriting to
recognize only `icon.css` and remove all v3/precompiled CSS prose.

**Verify**: `nub run docs:build` → exit 0 and `rg -n "tw3\.css|tw4\.css|presetWind3|enableComponentLayer|\bcva\b|extendCN" README.md docs package.json src --glob '!docs/unocss.config.ts'` → no output.

## Test plan

- Unit tests: Tailwind/Uno theme registration, tokens, animation primitives,
  custom state variants, and the icon boundary.
- Packed fixtures: required plugin/preset + relative published-dist scan;
  component CSS works independently of `icon.css`.
- Docs build and preview source transformation tests cover only exported assets.

## Done criteria

- [ ] Build emits `dist/icon.css` and no `dist/tw3.css`/`dist/tw4.css`.
- [ ] Package exports contain `./icon.css`, not precompiled component CSS.
- [ ] Tailwind peer range is v4-only; Wind3/component-layer APIs and tests are absent.
- [ ] Both packed consumer fixtures pass and demonstrate required setup.
- [ ] Documentation has correct relative-path examples and icon boundary.
- [ ] `nub run build`, engine/fixture tests, `nub run docs:build`, and `nub run qa` exit 0.
- [ ] `plans/README.md` marks plan 005 DONE.

## STOP conditions

- The packed fixture cannot install/use the artifact produced by the repository
  without unpublished local assumptions.
- Removing the old pipeline reveals a non-standard token still in `src/`; send
  it to plans 003/004, do not reintroduce a transformer.
- `icon.css` includes component utility styles or the fixtures need it for
  layout/theme CSS.
- Documentation requires a workspace-specific `@source` path that cannot be
  presented as a path relative to the consumer stylesheet/config.

## Maintenance notes

Treat consumer fixtures as release gates: future components must remain
statically discoverable in published JS. The icon mask asset is intentionally
small and optional; plugin/preset responsibilities must never drift into it.
