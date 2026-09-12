# Plan 002: Add real-browser overlay and hydration regression coverage

> Executor: read this entire file, execute only when selected, follow each verification gate, and stop on the conditions below. This is a standalone handoff; reading the umbrella plan or other plan bodies is not required. Update this plan's row in `plans/README.md` when finished. Creating this plan did not authorize implementation.
>
> Drift check: `git diff --stat 7d9633ca405c2bcf256481298486c7daee3e1456..HEAD -- package.json nub.lock vitest.config.ts test/browser src/test-utils plans/baseline`. Also inspect `git status --short` and `git diff -- package.json nub.lock vitest.config.ts test/browser src/test-utils plans/baseline` for uncommitted work. Expected prerequisite edits must be reconciled against the contract below and recorded before proceeding; unexplained drift is a STOP condition. Never overwrite existing user changes.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: [001-baseline.md](001-baseline.md)
- **Category**: tests
- **Planned at**: commit `7d9633ca405c2bcf256481298486c7daee3e1456`, 2026-09-11
- **State**: TODO

## Why this matters

Reuse hydrateFixture and the existing server fixture pipeline. Add a dedicated browser harness and package script test:browser, with tests in test/browser and a documented fixture server. Select one maintained browser runner compatible with the installed toolchain; reuse existing infrastructure where possible. Keep the default jsdom suite unchanged. The new script must fail on assertions, uncaught browser errors and an empty test selection. Browser support claims must name the engines actually run.

The delivery boundary is this component or shared capability, including its own regressions, public types and necessary consumer/docs migration. A larger public surface is not a success metric; remove any proposed part that has no demonstrated structural or semantic use.

## Prototype findings to carry into the harness

The [prototype](pr37-prototype-findings.md) passed eight Chromium checks but did not create the permanent `test:browser` gate. Its CSS was generated from the actual docs UnoCSS configuration and source recipes. The harness must assert that semantic variables and computed presentation exist before claiming theme/geometry coverage; class strings alone are insufficient. Use default, replacement and empty themes, with settled measurements after transition/resize/theme changes.

Add Button custom-host form submission, Tabs indicator layering/hit testing and RTL/reorder/scroll/border geometry, and Dialog keyboard activation, conditional labels, trap and restore to the browser fixtures. Keep the broader overlay matrix below; these pilot checks did not cover it.

A server-open Dialog using the current ModalSurface emitted no dialog/title because the unconditional Portal path omits the surface on the server. Preserve a true-server reproduction that expects a rendered, labelled surface and verifies hydration identity. Track it explicitly as a known failing prerequisite for plan 005; a passing assertion that the surface is absent is diagnostic evidence only, never SSR acceptance. Plan 002 owns the reproduction/harness and plan 005 owns the shared implementation fix.

### Round-two regressions to retain

[Round two](pr37-prototype-round2-findings.md) passed 11 Chromium checks. Port the relevant fixtures as component plans land: Select closed-label/lazy-content behavior, keyboard search and actual listbox IDREFs, a 1,000-option window with an End target outside the initial DOM, native serialization/reset, bound Form validation and manual labels, horizontal/vertical bordered and scrolled Tabs indicators, and Stepper completion/focus semantics if plan 038 is selected. Wait for CSS animations/transitions before comparing geometry or screenshots.

Add a second known-failing true-server reproduction for a default-open Select using PopperContent. Require actual listbox/options HTML and hydration identity; a selected label/native form target in a closed fixture proves neither. Plan 005 owns the shared surface fix. Keep this reproduction separate from the independently passing Form/closed-Select/Stepper/Tabs hydration cases.

## Round-three experiment constraints

[Round-three evidence](pr37-prototype-round3-findings.md), 2026-09-12. Port the 18 Chromium checks and the separately failed Slider native-reset diagnostic. Slider semantic values [20,80] can submit [40,60] after an actual reset-button click; assert native FormData, not only signals/ARIA. Capture browser console errors as well as page errors: a ResizeObserver notification-loop error occurred during one run and remains unresolved. Preserve the production variant-group separator configuration when generating fixture CSS; expanding h-(--size) as a group erased behavior dimensions. True-server open-surface omissions remain failing acceptance targets, not passing SSR claims.

Prototype execution does not complete this prerequisite or change its production status.

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

- `package.json`
- `nub.lock`
- `vitest.config.ts`
- `test/browser` (create if absent)
- `src/test-utils`
- `plans/baseline` (create if absent)

`nub run test:browser` does not exist at the planned baseline. Add and document it here before any dependent plan uses it. Keep test/browser excluded from jsdom discovery when its runner requires that. Use the actual lockfile present at execution; if the listed lockfile is absent, amend this plan with the verified path before installing.

Out of scope: all unrelated components, Stepper product/semantic redesign, Group renaming, blanket import cleanup, new package subpath exports, release automation, dependency upgrades unrelated to this task, and changes to the umbrella plan. Generated `dist` artifacts are produced by verification and must not be hand-edited or committed. If generation changes unrelated tracked API metadata, report it rather than folding it into this component.

## Commands you will need

Run from the repository root using the installed nub toolchain. These existing package scripts were read during planning; no test results are claimed by this document.

| Purpose | Command | Expected result |
| --- | --- | --- |
| Focused regression | `nub run test` | Exit 0, matching tests executed and passing |
| Source types | `nub run typecheck` | Exit 0, no errors |
| Published declarations | `nub run test:types` | Build succeeds; default and autocomplete type projects pass |
| Docs and generated API | `nub run docs:build` | Exit 0; previews compile and SSG completes |
| Full regression | `nub run test` | Exit 0, no new skipped cases masking failures |
| Pre-commit quality | `nub run qa` | Exit 0; inspect formatter/linter mutations for scope |
| Diff hygiene | `git diff --check` | Exit 0 |

`test` and `test:types` already build the library. `qa` runs fixing tools; inspect its diff and do not absorb unrelated edits. Run `nub run test:browser` after the browser prerequisite has landed; expected exit 0 with actual browser assertions executed.

## Git workflow

Use `codex/browser-regressions` if creating an isolated branch. Keep commits scoped, for example `refactor(browser-regressions): add real-browser overlay and hydration regression coverage`. Run the repository QA gate before any requested commit. Do not push, open a PR or publish without operator instruction.

## Steps

### 1. Reconcile the baseline and reduce scope

Inspect the scoped implementations, tests and direct callers. Record the existing default behavior and the smallest real customization/reproduction described below. Remove speculative wrapper parts, duplicate state and abstractions with only one trivial use before changing code. For a DEFERRED plan, first require selection of this family; do not infer it from completion of dependencies.

**Verify:** `git status --short` and the drift command above → every existing change is attributed; all prerequisites are completed or their equivalent contracts verified. Run `nub run test` → baseline passes, or pre-existing failures are recorded and the task is stopped before behavior changes.

### 2. Add the observable acceptance cases

Cover a modal containing a non-modal portal, sibling layers, two application roots, two ownerDocuments, Escape, outside pointer/focus, nested scroll locks, focus restoration, position/animation transforms and exit/reopen. Include true server HTML and hydration node identity. Separate known-failing reproductions from passing baseline tests with explicit reasons; do not weaken assertions to make the baseline green.

Use existing colocated tests and `.ssr.fixture.tsx` / `.ssr.test.tsx` conventions. Add new assertions to the family's tests, and geometry/focus/scroll cases to `test/browser` when in scope. The server markup must be checked before hydration; reuse `hydrateFixture` to verify that hydration preserves nodes and parents.

**Verify:** `nub run test` → existing cases still pass; new regression failures identify exactly the intended missing contract, not environment failures. For baseline-only work, record results instead of introducing behavior tests. For infrastructure harness work, a deliberately failing assertion must produce a nonzero exit before restoring it.

### 3. Implement only the stated contract

Apply the contract in “Why this matters” within the listed paths. Keep one authoritative behavior implementation, reuse existing state/navigation/form adapters, preserve lazy content ownership, and migrate only this family's direct consumers. Do not delete a shared facade until no unselected consumer needs it. For the baseline-only plan, this step writes the evidence report instead of implementing source changes.

**Verify:** `nub run test` and `nub run typecheck` → exit 0, including the new acceptance cases. Run `nub run test:browser` after the browser prerequisite has landed; expected exit 0 with actual browser assertions executed.

### 4. Complete this unit's types, documentation and delivery evidence

For public API changes, add positive/negative cases to both declaration test projects as appropriate, update namespace Kind/part JSDoc, and update the scoped component page with minimum usage, a real structural customization and one necessary boundary example. Keep content-only customization examples short. Regenerate metadata through the docs build. Record any measured consumer bundle change against baseline, platform coverage, and deferred parts in this plan. Internal-only work documents behavior boundaries in the implementation where useful, without inventing public API changes.

**Verify:** `nub run test:types`, `nub run docs:build`, `nub run test`, `nub run qa`, and `git diff --check` → all exit 0. `git status --short` → no unreviewed out-of-scope modifications. Update `plans/README.md` status only after these gates pass.

## Test plan

Cover a modal containing a non-modal portal, sibling layers, two application roots, two ownerDocuments, Escape, outside pointer/focus, nested scroll locks, focus restoration, position/animation transforms and exit/reopen. Include true server HTML and hydration node identity. Separate known-failing reproductions from passing baseline tests with explicit reasons; do not weaken assertions to make the baseline green.

Use the family's existing regression suite as the structural pattern. For public structure changes also assert default/empty/custom themes, reactive variants and local class/style overrides, callable root exports and part types. Do not add snapshots that only mirror implementation. The documented test commands must execute tests, not merely discover zero files.

## Done criteria

- [ ] Focused tests execute and pass, including the cases listed above.
- [ ] `nub run typecheck` and `nub run test:types` exit 0.
- [ ] `nub run docs:build`, `nub run test` and `nub run qa` exit 0.
- [ ] `git diff --check` exits 0; changed tracked paths are within Scope.
- [ ] Any browser-dependent cases pass under `nub run test:browser` after that script exists; engine and command results are recorded.
- [ ] Public default behavior and the smallest customization compile; removed API cases are negative declaration tests when relevant.
- [ ] Index status and this plan's delivery evidence reflect actual results, not assumed success.

## STOP conditions

Stop and report if unexplained source drift invalidates the excerpts, required tests fail twice after a reasonable fix, an out-of-scope source change is needed, or a prerequisite is missing. Stop if first-render correctness requires scanning/evaluating JSX twice, if refs/types must be erased to make the target API compile, or if a candidate part cannot demonstrate a real customization benefit. Do not use a new metadata registry or global factory to hide these problems. For browser-dependent changes, unavailable browser execution blocks acceptance; jsdom is not a substitute for geometry or real focus evidence.

## Maintenance notes

Review state ownership, consumer migration and precise cleanup more closely than file movement. Keep the public contract and focused acceptance cases together for future changes. Unselected family work remains deferred, even if shared infrastructure is now available. Record upstream license obligations if implementation directly adapts source. This plan intentionally does not redesign the whole library.
