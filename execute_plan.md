# Implementation Plan - Plan 005: Ship the v4-only consumer integration

## Execution Context

- Continue on the existing `style-refactor` branch and sync it with the latest remote state before editing.
- Do not create the `codex/005-ship-v4-only-consumer-integration` branch mentioned in the original Plan 005 Git workflow section; this branch override is intentional for the existing PR #36 workflow.
- Read `plans/005-ship-v4-only-consumer-integration.md` in full before making changes.
- Treat this file as the execution entry point and current-context override, `plans/005-ship-v4-only-consumer-integration.md` as the normative detailed implementation plan, and `PRD.md` as the final authority if requirements conflict.
- The original Plan 005 STOP conditions and Done criteria are normative. If a STOP condition is reached, stop and report instead of improvising around it.
- Verify Plans 003 and 004 are complete in the current code before deleting their temporary compatibility layer.
- Do not start or implement Plan 006 as part of this task.

## Goal Description

Execute `plans/005-ship-v4-only-consumer-integration.md` to finalize Moraine's transition to a modern, engine-native styling architecture:

1. Remove the legacy library CSS pipeline (`tw3.css`, `tw4.css`, `cls-variant`, component layers, prefix/hash transformers, syntax migrator).
2. Retain `dist/icon.css` as an optional runtime asset and make Tailwind v4 plugin (`@plugin "moraine/tailwind"`) and UnoCSS preset (`presetMoraine()`) the required consumer integration points.
3. Update `package.json` exports, dependencies, sideEffects, and peerDependencies (`tailwindcss: ^4.0.0`).
4. Add packed-tarball consumer fixture tests under `test/consumer-fixtures/` asserting that both Tailwind v4 and UnoCSS correctly compile representative component utilities, theme tokens, data/aria state variants, and animations from published `dist`.
5. Rewrite user documentation (`docs/pages/styling.mdx`, `docs/pages/utils.mdx`, `README.md`, `AGENTS.md`, and preview source transformation) from the consumer perspective.

---

## User Review Required

> [!IMPORTANT]
> **Breaking changes in this plan (as specified in PRD §1.2 & Plan 005):**
>
> - Removal of `./tw3.css` and `./tw4.css` package exports (consumers generate CSS with Tailwind v4 or UnoCSS).
> - Removal of `cva` and `extendCN` exports from `moraine` (use `recipe` and `cn`).
> - Removal of `cls-variant` from runtime dependencies.
> - Tailwind CSS peer dependency bumped to `^4.0.0` (v3 dropped).
> - Removal of `presetWind3` and `enableComponentLayer` options from `presetMoraine`.

---

## Proposed Changes

### Package Configuration & Build Pipeline

#### [MODIFY] `package.json`

- Remove `./tw3.css` and `./tw4.css` from `exports`.
- Retain `./icon.css` export.
- Set `"sideEffects": ["*.css", "./dist/*.css"]`.
- Remove `"cls-variant"` from `dependencies`.
- Update `peerDependencies.tailwindcss` to `"^4.0.0"`.

#### [MODIFY] `tsdown.config.ts`

- Remove `tw3.css` and `tw4.css` generation, `baseUnocssConfig`, `presetWind3`, `createMigrateSyntaxTransformer`, and `simplify` extractor.
- Retain normal JS/JSX build without component CSS generation.
- Retain separate UnoCSS build only for `icon.css` using `DEFAULT_ICON_SHORTCUTS` + Lucide icons.
- Remove `./tw3.css` and `./tw4.css` from custom exports.

---

### Source Code Cleanup & Runtime Refactor

#### [MODIFY] `src/shared/utils.ts`

- Remove `cls-variant` imports (`cls`, `cvaFactory`, `CvaFunction`).
- Remove `extendCN` and `cva` implementations.
- Retain `cn` (backed by `createCn`), `useId`, and event handlers.

#### [MODIFY] `src/shared/types.ts`

- Import `ClassValue` from `./style/recipe.ts` instead of `cls-variant`.
- Export `ClassValue`.

#### [MODIFY] `src/index.ts`

- Export `{ cn, useId }` from `./shared/utils.ts` (remove `cva` and `extendCN`).

#### [MODIFY] `src/overlays/base/menu/menu.tsx`

- Replace `ClassValueArray` from `cls-variant` with `ClassValue[]`.

#### [DELETE] Legacy UnoCSS Transformer Files

- `src/unocss/inject-prefix.ts`
- `src/unocss/inject-prefix.test.ts`
- `src/unocss/inject-compile-class.ts`
- `src/unocss/inject-compile-class.test.ts`
- `src/unocss/migrate-syntax.ts`
- `src/unocss/migrate-syntax.test.ts`

#### [MODIFY] `src/unocss/theme.ts`

- Simplify `presetMoraine`:
  - Remove `wind3`, `enableComponentLayer`, prefix/hash transformers and options, dynamic imports of `@unocss/transformer-compile-class`.
  - Remove deleted legacy shortcuts (`effect-fv`, `effect-dis`, `effect-invalid`, `surface-overlay`, `transition-bg`, etc.) and semantic animation shortcuts.
  - Remove old regex rules (`/var-progress-*/`, `/var-stepper-*/`, `/var-slider-*/`).
  - Retain Wind4 theme tokens (`radius`, `shadow`, `font`, `spacing`, `zIndex`, `colors`), animation keyframes/durations/timing functions (`animate-mo-enter/exit`), `opacity-64` rule/token, `z-*` shortcuts, and `DEFAULT_ICON_SHORTCUTS`.
  - Retain `data-*` and `aria-*` attribute selector variants.
  - Retain `globalStyles` and `colorVariables` options.

#### [MODIFY] `src/unocss/theme.test.ts`

- Update unit tests to remove tests for deleted options (`wind3`, `enableComponentLayer`, prefix, hash, component shortcuts).
- Test Wind4 theme registration, animation primitives, data/aria variants, and color variables.

#### [MODIFY] `src/tailwind/index.ts`

- Add default export `export default moraineTailwind()` so `@plugin "moraine/tailwind"` loads cleanly in Tailwind CSS v4.
- Retain named export `export { moraineTailwind }`.

---

### Consumer Fixtures

The fixture must exercise the package artifact exactly as an installed consumer sees it. Use the project's nub-first tooling for normal scripts and package operations. For the package-packing step, prefer a repository-supported nub command if one exists; if nub does not expose the required pack operation, using the incumbent package manager solely to create the tarball is allowed. Do not weaken the fixture by replacing the packed artifact with workspace/source aliases.

#### [NEW] `test/consumer-fixtures/tailwind-v4.test.ts`

- Test Tailwind CSS v4 compiling against a packed `moraine` package tarball:
  - Pack the package and install/unpack that artifact into an isolated fixture `node_modules`.
  - Compile stylesheet containing `@import "tailwindcss"; @plugin "moraine/tailwind"; @source ".../node_modules/moraine/dist";`.
  - Assert the generated CSS contains:
    - `data-disabled` / `data-focused` / `aria-invalid` variants.
    - `animate-mo-enter` / `animate-mo-exit` utility rules and `@keyframes mo-enter` / `mo-exit` blocks.
    - `z-floating` and `opacity-64` tokens.
  - Verify that compilation succeeds without importing `moraine/icon.css`.
  - Verify that icon CSS is present when `moraine/icon.css` is imported.

#### [NEW] `test/consumer-fixtures/unocss.test.ts`

- Test UnoCSS compiling against the packed `moraine` package tarball:
  - Load `presetWind4()` and `presetMoraine()` from the unpacked package.
  - Scan `dist/**/*.{mjs,jsx}` from the unpacked package.
  - Assert generated CSS contains:
    - `data-*` / `aria-*` attribute variants.
    - `animate-mo-enter` / `animate-mo-exit` and keyframes.
    - Custom tokens (`z-floating`, `opacity-64`, theme colors).
  - Verify that compilation succeeds without `icon.css`.
  - Verify separate icon rendering via `DEFAULT_ICON_SHORTCUTS` or `icon.css`.

---

### Documentation & Developer Guidelines

#### [MODIFY] `docs/pages/styling.mdx`

- Frame as "Moraine styling system architecture refactor".
- Document UnoCSS setup with `presetWind4()` and `presetMoraine()` (remove Wind3 and `enableComponentLayer`).
- Document Tailwind v4 setup with `@plugin "moraine/tailwind"` and relative `@source "../node_modules/moraine/dist"` (remove v3 section).
- Document `icon.css` as optional runtime asset.
- Replace `cva` and `extendCN` sections with `cn` and `recipe` documentation.

#### [MODIFY] `docs/pages/utils.mdx`

- Remove `cva` and `extendCN` references; document `cn`, `recipe`, and `useId`.

#### [MODIFY] `docs/build/previews/source.ts` & `docs/build/previews/source.test.ts`

- Remove `@src/tw3.css` and `@src/tw4.css` mapping, keeping only `@src/icon.css`.

#### [MODIFY] `AGENTS.md`

- Replace any remaining references to `cva` with `recipe`.

#### [MODIFY] `README.md`

- Update styling quickstart to reflect Tailwind v4 and UnoCSS Wind4 usage without precompiled CSS.

---

## Verification Plan

### Automated Tests

1. **Audit token scan**:
   ```bash
   rg -n "\bcva\b|cls-variant|\bextendCN\b" src docs README.md package.json
   ```
   Must yield 0 matches. Do not exclude legacy-named source files from this audit; any remaining source caller or compatibility artifact must be resolved before proceeding.
2. **Build and asset check**:
   ```bash
   nub run build
   test -f dist/icon.css && test ! -f dist/tw3.css && test ! -f dist/tw4.css
   ```
3. **Engine unit tests**:
   ```bash
   nub run test src/tailwind src/unocss
   ```
4. **Consumer fixture tests**:
   ```bash
   nub run test test/consumer-fixtures
   ```
5. **Docs production build**:
   ```bash
   nub run docs:build
   ```
6. **Full QA gate**:
   ```bash
   nub run qa && nub run test
   ```

After all checks pass, update `plans/README.md` to mark Plan 005 DONE. Do not mark it complete based on partial unit-test success, and do not begin Plan 006 in the same execution.
