# Plan 001: Record the execution baseline and consumer boundaries

> Executor: read this entire file, execute only when selected, follow each verification gate, and stop on the conditions below. This is a standalone handoff; reading the umbrella plan or other plan bodies is not required. Update this plan's row in `plans/README.md` when finished. Creating this plan did not authorize implementation.
>
> Drift check: `git diff --stat 7d9633ca405c2bcf256481298486c7daee3e1456..HEAD -- plans/baseline`. Also inspect `git status --short` and `git diff -- plans/baseline` for uncommitted work. Expected prerequisite edits must be reconciled against the contract below and recorded before proceeding; unexplained drift is a STOP condition. Never overwrite existing user changes.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `7d9633ca405c2bcf256481298486c7daee3e1456`, 2026-09-11
- **State**: TODO

## Why this matters

Record current exports, component scope statuses, direct callers, theme slot mappings and existing failing checks before changing behavior. Capture Button and Tabs consumer bundles using the existing package root exports, both preserved JSX and compiled ESM resolution. Record dependency modules and byte counts; do not invent per-component package entrypoints. Record upstream source SHAs and licenses only for code actually reused. This task produces evidence, not component changes.

The delivery boundary is this component or shared capability, including its own regressions, public types and necessary consumer/docs migration. A larger public surface is not a success metric; remove any proposed part that has no demonstrated structural or semantic use.

## Prototype evidence to reconcile

The [2026-09-12 experiment](pr37-prototype-findings.md) already recorded baseline typecheck, published-type and docs-build passes at PR head `2e0f0cc972e476c18c22faae6303fc154832e8df`. Its full baseline run had 1933 passes and four failures. Two consumer-export failures came from missing `nubx`; targeted reruns passed after toolchain repair. The remaining two FormField Select/MultiSelect required/shared-labelling failures are pre-existing and must remain visible.

Use this as historical evidence, then record the execution HEAD and any relevant drift. Ensure both `nub` and the `nubx` child-process command resolve before rerunning consumers. Do not infer an all-green full suite from targeted reruns. Inventory, direct callers, licenses where applicable, and Button/Tabs preserved-JSX and compiled-ESM bundle comparisons remain required; none was completed by the prototype.

## Current state

`src/test-utils/ssr-test.ts:20` anchors the current implementation contract:

```tsx
export function renderSsrFixture(modulePath: `/src/${string}`, exportName: string): string {
  const key = `${modulePath}#${exportName}`
  const markup = ssrFixtures()?.[key]
  if (typeof markup !== 'string') {
    throw new TypeError(`SSR fixture not found: ${key}`)
  }
  return markup
}
```

The cited file is existing infrastructure, not a new subsystem. Preserve its current consumers while extracting only responsibilities named in this plan.

The existing style entry point provides reactive theme defaults; match this pattern from `src/shared/provider/create-component-styles.ts:41`:

```ts
) {
  const cn = useCn()
  const theme = useTheme()
  const entry = createMemo(() => theme()[name])
  const variants = mergeProps(
    // oxlint-disable-next-line subf/solid-reactivity -- mergeProps tracks function sources on property reads.
    () => entry()?.defaults ?? EMPTY_DEFAULTS,
    () => options.inheritedVariants?.() ?? EMPTY_DEFAULTS,
    props,
  )
  const outputs = createMemo(
```

Use SolidJS 1.9, reactive props without destructuring, `createEffect(on(...))`, `Show`/`For`, callback refs and owner-scoped cleanup. New relative imports use `.ts`/`.tsx`. Reuse `createComponentStyles`; capture `useCn()` during initialization. No Provider means empty presentation; undefined theme inherits, an explicit theme replaces, emptyTheme clears. `cnConfig` undefined inherits, `{}` resets application rules, and an explicit object replaces parent application rules. Behavior geometry must survive emptyTheme.

Keep callable roots and public types inside `XT`, with only matching component Props aliases exported at top level. Use Kind composite only for actual attached components; no runtime namespace registry, `.Root` aliases or `Extend` types. Preserve standalone ButtonGroup/AvatarGroup/KbdGroup names, type namespaces and theme keys. Keep all existing callback names unless this plan explicitly changes one. Docs/code are English. No Solid 2 migration, provider redesign, new public primitive package or global API sweep.

For default-capable components, distinguish omitted children from explicit children without eagerly evaluating JSX or rebuilding the default tree when `Show` is temporarily empty. For logical collections, data normalization must not evaluate label/content JSX. If implementing parts, default assembly and custom assembly share one behavior owner. Local class/style overrides apply within the nearest visual Provider scope.

`docs/README.md` states: “Component API reference sections render automatically from colocated `api.json`.” Regenerate API metadata with the docs build, never create a competing manual schema. `docs/DESIGN.md` states: “Use the semantic variables configured in `docs/unocss.config.ts`; no raw documentation color palette is allowed.” Keep the existing docs shell and author-selected previews.

## Scope

Only these source/consumer paths may be modified, plus this plan and its index status:

- `plans/baseline` (create if absent)

This is an evidence-only task. Do not modify production source, configuration or existing docs. Baseline reports record failures and unsupported platforms honestly; they do not label an unrun gate as passing.

Out of scope: all unrelated components, Stepper product/semantic redesign, Group renaming, blanket import cleanup, new package subpath exports, release automation, dependency upgrades unrelated to this task, and changes to the umbrella plan. Generated `dist` artifacts are produced by verification and must not be hand-edited or committed. If generation changes unrelated tracked API metadata, report it rather than folding it into this component.

## Commands you will need

Run from the repository root using the installed nub toolchain. These existing package scripts were read during planning; no test results are claimed by this document.

| Purpose | Command | Expected result |
| --- | --- | --- |
| Focused regression | `nub run test src/test-utils` | Exit 0, matching tests executed and passing |
| Source types | `nub run typecheck` | Exit 0, no errors |
| Published declarations | `nub run test:types` | Build succeeds; default and autocomplete type projects pass |
| Docs and generated API | `nub run docs:build` | Exit 0; previews compile and SSG completes |
| Full regression | `nub run test` | Exit 0, no new skipped cases masking failures |
| Diff hygiene | `git diff --check` | Exit 0 |

`test` and `test:types` already build the library. Do not use fixing tools to repair baseline behavior. Before a commit, run the AGENTS-required QA gate, inspect its mutations and discard only unrelated generated/formatting changes from this task.

## Git workflow

Use `codex/baseline` if creating an isolated branch. Keep commits scoped, for example `refactor(baseline): record the execution baseline and consumer boundaries`. Run the repository QA gate before any requested commit. Do not push, open a PR or publish without operator instruction.

## Steps

### 1. Record scope and current health

Create `plans/baseline/report.md` with HEAD, working-tree status, the 36-directory inventory, direct consumer paths, current public exports and selected/deferred statuses. Run `nub run typecheck`, `nub run test:types`, `nub run test` and `nub run docs:build`; record command, exit code and specific pre-existing failures. Do not fix production code to obtain a green baseline. Keep baseline measurements separate from the required pre-commit QA run; QA must not silently change the behavior being measured.

**Verify:** `git diff --check` → exit 0; `git status --short` → only baseline reports and normal generated/ignored artifacts differ from the starting state. Every executed gate has an actual result in the report.

### 2. Capture reproducible consumer evidence

Add minimal Button-only and Tabs-only consumer fixtures plus a build configuration under `plans/baseline`. Use the installed Vite/Rolldown tooling with the repository's Solid plugin and package-root export conditions; record exact commands in the report. Measure both preserved JSX and compiled ESM consumers, recording dependency modules and raw/gzip bytes. Fixtures must import `moraine`, not a fictional `moraine/button` path. Keep entry source/configuration and module-size output so later pilots can repeat the same comparison. Do not introduce a new package dependency or production build entry.

**Verify:** run the recorded fixture commands → exit 0 and nonempty consumer bundles; `rg -n 'Button|Tabs|bytes|modules' plans/baseline/report.md` → each consumer and its measurements are recorded. If the installed tooling cannot produce the comparison without configuration outside this scope, stop and report.

### 3. Publish the prerequisite evidence

List browser, multi-document, multiple-package-copy, Shadow DOM and assistive-technology coverage as verified or unverified with evidence. Record the exact theme slot mappings and source/license references needed by selected pilots. Mark known failures as blockers for the relevant dependent plan; do not present the existing positioning generation guard or hydration identity checks as missing features.

**Verify:** `git diff --check` → exit 0; compare `git status --short` with the recorded starting state → no production source/configuration was modified. Update the index after all results are recorded, even if a separately identified implementation task remains blocked by an existing failure.

## Test plan

This task runs and records existing checks; it does not add implementation tests. A nonzero result must retain the failing test name and reason. Browser tests are not yet available under `test:browser`; plan 002 owns that missing gate.

## Done criteria

- [ ] `plans/baseline/report.md` records SHA, scope inventory, commands and actual exit codes.
- [ ] Consumer fixtures/configuration and both export-condition results exist under `plans/baseline`.
- [ ] Existing failures and unverified platforms are explicit, with affected dependent plans identified.
- [ ] `git diff --check` exits 0; no production source/configuration changes occurred.
- [ ] Index status accurately reflects completion of evidence collection.

## STOP conditions

Stop if evidence collection requires production edits, missing dependencies or unavailable tooling prevent a reproducible baseline, or unrelated user changes cannot be distinguished. Do not resolve these by expanding scope silently. Existing test failures are evidence to record, not permission to fix unrelated behavior.

## Maintenance notes

Later component pilots must repeat the same consumer fixtures and commands. Keep the original measurement alongside the new result so changes remain attributable. Baseline collection is not a claim that all current components are correct.
