# Plan 011: Separate Dialog default Panel from raw Content

> Executor: read this entire file, execute only when selected, follow each verification gate, and stop on the conditions below. This is a standalone handoff; reading the umbrella plan or other plan bodies is not required. Update this plan's row in `plans/README.md` when finished. Creating this plan did not authorize implementation.
>
> Drift check: `git diff --stat 7d9633ca405c2bcf256481298486c7daee3e1456..HEAD -- src/overlays/dialog 'docs/pages/(overlay)/dialog' src/shared/type-test/default/index.tsx src/shared/type-test/autocomplete/index.tsx src/navigation/command-palette/command-palette.test.tsx src/overlays/modal/modal.test.tsx docs/routes/components/markdown/intro-components.tsx docs/routes/components/layout/docs-command-palette.tsx src/overlays/base test/browser`. Also inspect `git status --short` and `git diff -- src/overlays/dialog 'docs/pages/(overlay)/dialog' src/shared/type-test/default/index.tsx src/shared/type-test/autocomplete/index.tsx src/navigation/command-palette/command-palette.test.tsx src/overlays/modal/modal.test.tsx docs/routes/components/markdown/intro-components.tsx docs/routes/components/layout/docs-command-palette.tsx src/overlays/base test/browser` for uncommitted work. Expected prerequisite edits must be reconciled against the contract below and recorded before proceeding; unexplained drift is a STOP condition. Never overwrite existing user changes.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [002-browser-regressions.md](002-browser-regressions.md), [003-host-render.md](003-host-render.md), [005-overlay-lifecycle.md](005-overlay-lifecycle.md), [006-floating-bindings.md](006-floating-bindings.md)
- **Category**: dx
- **Planned at**: commit `7d9633ca405c2bcf256481298486c7daee3e1456`, 2026-09-11
- **State**: TODO

## Why this matters

Expose Trigger/Portal/Overlay/Content/Title/Description/Close/Header/Body/Footer/Panel. Move old Content assembly to Panel; Panel children remains body content. Content is only the dialog surface and accepts arbitrary structure. Share one private dialog behavior implementation with the existing Modal facade; do not inherit behavior from styled surfaces. Panel owns its visual scope, nested Content reuses it; manual Content creates its own. Keep fullscreen/scrollable and visual props on Panel/Content, not the behavior root. Trigger/Close and an Overlay outside Content resolve their own nearest Provider styles. One root owns at most one active surface.

The delivery boundary is this component or shared capability, including its own regressions, public types and necessary consumer/docs migration. A larger public surface is not a success metric; remove any proposed part that has no demonstrated structural or semantic use.

## Anatomy

Target usage after this plan; these examples describe the planned API, not an implementation already available. Candidate examples remain deferred with their plan.

Panel preserves the assembled layout and treats children as body content. The separate manual example owns one raw surface, with semantic title/description parts and optional layout parts.

```jsx
<>
  <Dialog>
    <Dialog.Trigger>Edit project</Dialog.Trigger>
    <Dialog.Panel title="Edit project" description="Update project details.">
      <Input aria-label="Project name" />
    </Dialog.Panel>
  </Dialog>

  <Dialog>
    <Dialog.Trigger>Edit project</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Edit project</Dialog.Title>
          <Dialog.Description>Update project details.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body><Input aria-label="Project name" /></Dialog.Body>
        <Dialog.Footer><Dialog.Close>Done</Dialog.Close></Dialog.Footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog>
</>
```

## Current state

`src/overlays/dialog/dialog.types.ts:7` anchors the current implementation contract:

```tsx
export namespace DialogT {
  export type Kind = 'composite'

  export interface Slot<T = unknown> {
    /** Element that opens the dialog. */
    trigger?: T

    /** Backdrop layer rendered behind the dialog panel. */
```

The implementation entry is `src/overlays/dialog/dialog.tsx`. The component implementation, types, classes, tests and SSR fixtures are colocated in `src/overlays/dialog`. The existing component tests are the test-structure exemplar; inspect them before adding regression cases.

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

- `src/overlays/dialog`
- `docs/pages/(overlay)/dialog`
- `src/shared/type-test/default/index.tsx`
- `src/shared/type-test/autocomplete/index.tsx`
- `src/navigation/command-palette/command-palette.test.tsx`
- `src/overlays/modal/modal.test.tsx`
- `docs/routes/components/markdown/intro-components.tsx`
- `docs/routes/components/layout/docs-command-palette.tsx`
- `src/overlays/base`
- `test/browser` (create if absent)

Shared directories listed in scope permit only the minimum integration needed by this family. Preserve unselected public APIs and old facades that still have consumers. Direct caller files permit migration edits only, not redesign of the consumer.

Out of scope: all unrelated components, Stepper product/semantic redesign, Group renaming, blanket import cleanup, new package subpath exports, release automation, dependency upgrades unrelated to this task, and changes to the umbrella plan. Generated `dist` artifacts are produced by verification and must not be hand-edited or committed. If generation changes unrelated tracked API metadata, report it rather than folding it into this component.

## Commands you will need

Run from the repository root using the installed nub toolchain. These existing package scripts were read during planning; no test results are claimed by this document.

| Purpose | Command | Expected result |
| --- | --- | --- |
| Focused regression | `nub run test src/overlays/dialog` | Exit 0, matching tests executed and passing |
| Source types | `nub run typecheck` | Exit 0, no errors |
| Published declarations | `nub run test:types` | Build succeeds; default and autocomplete type projects pass |
| Docs and generated API | `nub run docs:build` | Exit 0; previews compile and SSG completes |
| Full regression | `nub run test` | Exit 0, no new skipped cases masking failures |
| Pre-commit quality | `nub run qa` | Exit 0; inspect formatter/linter mutations for scope |
| Diff hygiene | `git diff --check` | Exit 0 |

`test` and `test:types` already build the library. `qa` runs fixing tools; inspect its diff and do not absorb unrelated edits. Run `nub run test:browser` after the browser prerequisite has landed; expected exit 0 with actual browser assertions executed.

## Git workflow

Use `codex/dialog` if creating an isolated branch. Keep commits scoped, for example `refactor(dialog): separate dialog default panel from raw content`. Run the repository QA gate before any requested commit. Do not push, open a PR or publish without operator instruction.

## Steps

### 1. Reconcile the baseline and reduce scope

Inspect the scoped implementations, tests and direct callers. Record the existing default behavior and the smallest real customization/reproduction described below. Remove speculative wrapper parts, duplicate state and abstractions with only one trivial use before changing code. For a DEFERRED plan, first require selection of this family; do not infer it from completion of dependencies.

**Verify:** `git status --short` and the drift command above → every existing change is attributed; all prerequisites are completed or their equivalent contracts verified. Run `nub run test src/overlays/dialog` → baseline passes, or pre-existing failures are recorded and the task is stopped before behavior changes.

### 2. Add the observable acceptance cases

Test Panel and raw parts through the same keyboard/dismiss/focus/presence cases; missing/dynamic Title/Description and custom IDs in first SSR HTML; explicit accessible name; conditional parts, reopen during exit, local visual overrides and nested Providers. Migrate only direct Dialog consumers from old Content to Panel.

Use existing colocated tests and `.ssr.fixture.tsx` / `.ssr.test.tsx` conventions. Add new assertions to the family's tests, and geometry/focus/scroll cases to `test/browser` when in scope. The server markup must be checked before hydration; reuse `hydrateFixture` to verify that hydration preserves nodes and parents.

**Verify:** `nub run test src/overlays/dialog` → existing cases still pass; new regression failures identify exactly the intended missing contract, not environment failures. For baseline-only work, record results instead of introducing behavior tests. For infrastructure harness work, a deliberately failing assertion must produce a nonzero exit before restoring it.

### 3. Implement only the stated contract

Apply the contract in “Why this matters” within the listed paths. Keep one authoritative behavior implementation, reuse existing state/navigation/form adapters, preserve lazy content ownership, and migrate only this family's direct consumers. Do not delete a shared facade until no unselected consumer needs it. For the baseline-only plan, this step writes the evidence report instead of implementing source changes.

**Verify:** `nub run test src/overlays/dialog` and `nub run typecheck` → exit 0, including the new acceptance cases. Run `nub run test:browser` after the browser prerequisite has landed; expected exit 0 with actual browser assertions executed.

### 4. Complete this unit's types, documentation and delivery evidence

For public API changes, add positive/negative cases to both declaration test projects as appropriate, update namespace Kind/part JSDoc, and update the scoped component page with minimum usage, a real structural customization and one necessary boundary example. Keep content-only customization examples short. Regenerate metadata through the docs build. Record any measured consumer bundle change against baseline, platform coverage, and deferred parts in this plan. Internal-only work documents behavior boundaries in the implementation where useful, without inventing public API changes.

**Verify:** `nub run test:types`, `nub run docs:build`, `nub run test`, `nub run qa`, and `git diff --check` → all exit 0. `git status --short` → no unreviewed out-of-scope modifications. Update `plans/README.md` status only after these gates pass.

## Test plan

Test Panel and raw parts through the same keyboard/dismiss/focus/presence cases; missing/dynamic Title/Description and custom IDs in first SSR HTML; explicit accessible name; conditional parts, reopen during exit, local visual overrides and nested Providers. Migrate only direct Dialog consumers from old Content to Panel.

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
