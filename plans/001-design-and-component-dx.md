# Plan 001: Move presentation into Design and finalize component DOM ownership

> Executor: Read this entire plan before editing. Implement the steps in order, run each gate, and update `plans/README.md`. This is one breaking migration with staged verification, not permission to ship a partially migrated architecture.
>
> Drift check: `git diff --stat 1653a377..HEAD -- src docs test package.json tsdown.config.ts README.md plans`. Compare any changed implementation with the excerpts below before proceeding. Also inspect `git status --short` and preserve unrelated uncommitted work.

## Status

- Priority: P1
- Effort: L, multiple implementation sessions
- Risk: HIGH; shared styling, public overlay APIs, and hydration all change
- Depends on: none; internal step dependencies are mandatory
- Category: migration / DX
- Planned at: `1653a377`, 2026-09-06, branch `style-refactor`
- Planning baseline: clean working tree; `nub run typecheck` passed. Updated to decouple all component namespaces into colocated `*.types.ts` to prevent type cycles and enable clean Design schema typing. Build, runtime tests, type fixtures, and production browser checks were not run by the advisor. Do not infer that they pass.

## Why this matters

Components currently combine local presentation with a separately merged Provider configuration. That makes unstyled rendering incomplete and leaves trigger, surface, and native-control ownership unclear. The completed API makes Design the sole default presentation source, keeps behavior and anatomy inside components, and gives each DOM-owning part predictable attributes and refs.

This plan incorporates the supplied “Move Presentation into Design and Finalize Component DX” specification. It is self-contained; the executor does not need the original attachment.

## Current state and drift anchors

Paths are relative to `/Users/subf/Developer/project/moraine`.

1. `src/shared/provider/moraine-provider.tsx:197` defines `base`, `provider`, `group`, `state`, and `instance` style layers. `resolveComponentStyle` at line 234 returns getter-backed bindings and merges classes with `cn`. Preserve that reactive binding mechanism.

   ```ts
   inputs.base?.classes?.[slot],
   inputs.provider?.classes?.[slot],
   inputs.group?.classes?.[slot],
   override?.group?.class,
   inputs.state?.classes?.[slot],
   override?.state?.class,
   inputs.instance?.classes?.[slot],
   slot === (inputs.rootSlot ?? 'root') && inputs.instance?.class,
   ```

   At line 283, Provider exposes the old API and merges its parent at runtime:

   ```ts
   export interface MoraineProviderProps {
     config?: MoraineConfig
     children?: JSX.Element
   }
   // Inside MoraineProvider:
   const config = createMemo(() => mergeMoraineConfig(parent(), props.config))
   ```

2. `src/shared/style/recipe.ts:42` already has `SlotRecipeOptions`, `VariantSelection`, `SlotCompoundVariant`, and atomic equivalents. At line 162, `createSlotRecipe` derives slots exclusively from `Object.keys(options.base)`. Returned functions retain `slots`, but do not expose source options. Inheritance cannot be implemented by merging resolved classes or introspecting a closure.

3. `src/elements/button/button.class.ts:4` exports `buttonRecipe = recipe({ base, defaultVariants, variants })` and derives `ButtonVariantProps` from it. `src/elements/button/button.tsx` declares `ButtonT` namespace and imports that recipe at runtime, resolves `instance ?? group ?? provider ?? fallback` variant values, and evaluates `buttonRecipe({ variant: variant(), size: size() })` under the resolver's `base` getter. Its use of `splitProps`, getter-backed layers, and `useButtonInteraction` is the ordinary-component exemplar. Moving `ButtonT` into `button.types.ts` separates type contracts from both component runtime and styling recipes.

4. `src/overlays/dialog/dialog.tsx` declares `children?: (props: OverlayTriggerProps) => JSX.Element`, uses `BaseProps<'span', ...>`, maps root styling to `trigger`, and delegates to `Modal` through `ModalTriggerRenderer`. Dialog surface classes are partly constants rather than one recipe. `src/overlays/modal/modal.tsx` already exposes `Modal.Trigger` and `Modal.Content`, controls presence, dismissal, scroll locking, focus trapping/restoration, and renders no root DOM for `Modal`.

   Existing Modal content has replacement behavior that must disappear:

   ```tsx
   class={local.class ?? `${MODAL_CONTENT_CLASS} ${MODAL_CONTENT_DEFAULT_CLASS}`}
   ```

5. `src/overlays/modal/modal.class.ts` includes backdrop color/blur, radius, shadow, visual sizes, and animations. `src/elements/collapsible/collapsible.class.ts` includes `cursor-pointer` and accordion animations as well as height/overflow behavior. Both are excluded by the current Provider ownership test. Neither exclusion justifies keeping their visual defaults outside Design.

6. `src/forms/input/input.tsx:449` assigns only `inputEl`; `src/forms/textarea/textarea.tsx:498` assigns only `textareaEl`. `src/shared/utils.ts:97` provides the existing composition utility:

   ```ts
   export function callRef<T>(ref: T | ((element: T) => void) | undefined, element: T): void {
     if (typeof ref === 'function') {
       ;(ref as (element: T) => void)(element)
     }
   }
   ```

7. `src/unocss/theme.ts:440` overrides Wind4 `default.transition` and Wind3 `duration.DEFAULT` / `easing.DEFAULT`. `src/tailwind/index.ts:46` emits generic `--default-transition-*` variables and also sets `transitionDuration.DEFAULT` / `transitionTimingFunction.DEFAULT`. Remove these global motion overrides, preserving Moraine-specific animation utilities.

8. `tsdown.config.ts` builds compiled `.mjs` plus uncompiled Solid `.jsx`, and generates export mappings. `src/index.ts` exports the old config types/hook. `test/consumer-fixtures/helpers.ts` copies `dist` but synthesizes its own package exports; it currently cannot prove the actual package exports are correct. `src/shared/type-test/{default,autocomplete}` exercise published declarations.

9. Runtime tests use Solid Testing Library and JSDOM. `vitest.config.ts` loads `src/test-utils/ssr-global-setup.ts`, which pre-renders colocated SSR fixtures. `test/acceptance/style-system.test.ts` and `src/shared/provider/moraine-provider.test.tsx` contain public-component ownership maps. Consumer fixtures cover Wind3, Wind4, and Tailwind v4. The docs Vite build regenerates colocated API JSON through `docs/build/plugins/api-doc-generator.ts` and `docs/build/api-doc/write.ts`.

10. The project is Solid **1.x** (`solid-js ^1.9.15`), TypeScript, tsdown, Vite SSG, and nub (`nub.lock`). `docs/DESIGN.md` describes the docs as a “calm, dense technical workbench” and requires semantic tokens from `docs/unocss.config.ts`. Preserve its shell and visual design. There is no additional ADR/PRD governing this migration in the inspected paths. Release automation is tag-triggered package publishing plus a Pages build hook; deployment changes are unnecessary.

## Final API and explicit decisions

### Design ownership and public shape

```tsx
import { Button, MoraineProvider } from 'moraine'
import { createDesign } from 'moraine/design'

const productDesign = createDesign({
  button: {
    base: { root: 'rounded-xl shadow-xs' },
    variants: { variant: { outline: { root: 'border-primary text-primary' } } },
    compoundVariants: [
      { variants: { variant: 'outline', size: 'sm' }, class: { root: 'font-medium' } },
    ],
    defaultVariants: { variant: 'outline', size: 'sm' },
  },
  dialog: { base: { content: 'rounded-2xl', overlay: 'backdrop-blur-sm' } },
})
const compactDesign = createDesign({
  extends: productDesign,
  button: { defaultVariants: { size: 'sm' } },
})

<MoraineProvider design={compactDesign}><Button>Continue</Button></MoraineProvider>
```

- Export `createDesign` and `MoraineDesign` from `moraine/design`; keep Provider at `moraine`. Runtime components/context must not import the official preset, including transitively through barrels. Move all components' public namespaces (`<Component>T`) and top-level `{Component}Props` into dedicated, colocated `*.types.ts` files (e.g. `button.types.ts`, `dialog.types.ts`, `input.types.ts`). Each `*.types.ts` file declares the `<Component>T` namespace containing `Slot`, `Variant`, `Classes`, `Styles`, `Base`, `Props`, and any part/item types (`TriggerProps`, `ContentProps`, `Item`, etc.), as well as the matching top-level `{Component}Props = <Component>T.Props`. Component implementation files (`*.tsx`) and barrel files (`index.ts`) re-export from `*.types.ts`. Style files (`*.class.ts`) import variant/slot definitions from `*.types.ts` via type-only imports. Design definitions in `moraine/design` import component types strictly from `*.types.ts`, completely decoupling type definitions from component JSX runtime and recipe implementations, preventing type cycles and runtime bundle leakage. Keep component public declarations under `ButtonT`, `DialogT`, etc.; do not add top-level component variant/slot exports outside the component namespace.
- Official recipe definitions remain in each component directory, normally `*.class.ts`. Add raw typed option objects alongside existing recipes during migration; ultimately Design compiles these options. Use plain `*_CLASS` constants for static-only definitions, not static-only `recipe()` wrappers. Keep the current recipe engine; retain normalized source options privately on Design for inheritance.
- Public component entries accept exactly `base`, `variants`, `compoundVariants`, `defaultVariants`. Reuse typed recipe option machinery with nested partial overrides, preserving known slot names and variant values. No `recipe`, `defaults`, `variantDefaults`, global `styles`, custom variant augmentation, or generic `slotProps` API.
- Known public variant schemas stay fixed. Runtime Design cannot add `<Button variant="brand">`. Preserve boolean variant handling and existing null/undefined selection semantics. Behavioral state inputs may be internal recipe selectors; do not widen public component Variant types merely to drive styling.
- `createDesign()` uses the official preset; `createDesign({ preset: false })` starts with empty visual entries. An `extends` Design supplies the complete inherited base, with no implicit reapplication of the official preset. `preset: false` controls only the implicit official base: with `extends`, explicitly inherited presentation remains. Document and test this combination so it cannot silently strip the parent.
- Merge once at creation: base by slot with `cn`; variants by name/value/slot with `cn`; append compound entries parent-first; shallow-merge defaults. Never mutate parent/options; undefined properties mean no override. An empty class value does not delete inherited classes. Replacement uses an unstyled base. Within a recipe, preserve existing base → selected variants → compound order: overriding `base` does not outrank that recipe's variant layer.
- Supply the complete known slot skeleton before compiling slot recipes, including with `preset: false`. A custom variant that styles `label` must work even when `base.label` was omitted. Normalize static and atomic sources into the same public slot vocabulary; do not silently drop slots or hide a second default-class path.
- Design objects are stable immutable values by contract. Provider stores an accessor to its `design` prop; replacing that prop updates descendant classes without remounting DOM or losing input/focus/open state. Nested Providers replace, never dynamically merge. Provider's `design` prop is required by TypeScript.
- No Provider means empty Design plus a clear development `console.warn`, **not an exception and not an official-preset fallback**. Warn once per component owner requesting Design, not on every reactive class read. Production stays quiet. Avoid request-global state for warning deduplication. The source draft's later request for an “error” is interpreted as this warning.

### Cascade, structural styles, and coverage

Use `design → composition/group → state → instance`, with `class/style` applied after the root entry in instance `classes/styles`. Preserve getters, `rootSlot`, per-call group/state overrides, and inline-style channels. Design configuration contains classes and defaults, not a replacement global inline-style API.

Resolve selected values as explicit component prop → composition value → Design default → existing semantic/behavioral fallback when necessary. A fallback value cannot introduce a local visual recipe. State-derived visual classes must also originate in Design; components supply state/measurements, not hardcoded colors or animations.

Required Design coverage includes all existing Provider families plus `modal` and `collapsible` for their remaining visual presentation. Compound/internal parts reuse their owning family entry. Include static presentation, raw `cn()` literals, group/item helpers, and shared menu/select recipes; searching only calls named `recipe()` is insufficient. `Icon.name` and explicit `Icon.size` are consumer content/instance input and must continue working unstyled; the optional icon mask asset is not a default visual preset.

Keep only behavior-critical CSS locally: hidden native controls, actual Floating UI position/measurement styles, visibility/hit-testing needed while closed, resize/touch constraints, and necessary clipping. Move colors, spacing, borders, radius, shadows, focus appearance, default sizes, decorative transforms, and motion to Design. Separate positioning transforms required for geometry from decorative scale/translation. Preserve measurement variables even when their visual use moves to Design. Maintain a reviewed structural exception list in the ownership test with the reason for every exception.

### Overlay parts and prop ownership

```tsx
<Dialog>
  <Dialog.Trigger as={Button} variant="outline">
    Open
  </Dialog.Trigger>
  <Dialog.Content
    title="Project settings"
    description="Update settings."
    footer={
      <Dialog.Close as={Button} variant="ghost">
        Cancel
      </Dialog.Close>
    }
  >
    Body content
  </Dialog.Content>
</Dialog>
```

| Part                | Owns                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog / Sheet root | id, controlled/uncontrolled open state, dismissal, exit callback, context; JSX children; no class/style/ref or fake element                                                                        |
| Trigger             | actual polymorphic trigger, its attributes/events/ref/class/style; internal opening behavior                                                                                                       |
| Dialog.Content      | surface ref/class/style, named overlay/content/header/wrapper/title/description/close/body/footer styling, title/description/header/body/footer/closeIcon, overlay/fullscreen/scrollable/ariaLabel |
| Sheet.Content       | corresponding surface/anatomy and existing side/presentation settings                                                                                                                              |
| Close               | polymorphic explicit close control, closes nearest matching modal context; respects disabled and prevented consumer activation                                                                     |

Keep high-level content conveniences and automatic close button. For Dialog.Content, ordinary `children` are body content; retain `body` as a convenience with explicit precedence: supplied `body` (including null/false) overrides children, undefined uses children. Root takes plain JSX children, so the old trigger callback fails type checking. Place part types inside the family namespace (`DialogT.TriggerProps`, `DialogT.ContentProps`, `DialogT.CloseProps`) in `dialog.types.ts`; only matching component props aliases (`DialogTriggerProps`, `DialogContentProps`, `DialogCloseProps`) may be top-level exports from `dialog.types.ts`. Preserve slots at their actual owners: Trigger owns `trigger`, Content owns its surface anatomy, Close owns `close`.

All five sibling families show the same callback-trigger ownership problem in this baseline. Migrate Sheet, Popover, Tooltip, DropdownMenu, and ContextMenu after Dialog. Reuse Modal for Dialog/Sheet and shared Popper/menu interactions for floating families; do not copy focus/dismissal/positioning algorithms.

- Popover/Tooltip roots retain open, placement, mode/delay/disabled and interaction settings. Trigger owns the anchor. Content owns surface attributes, visual variants, and body/text/kbd convenience props. Remove the old root `content` presentation prop; allow Content children for ordinary content. Preserve Tooltip focus/hover/Escape behavior and `aria-describedby`, not dialog semantics.
- Menu roots retain controlled state, trigger disabling, placement, and dismissal behavior. Content receives `items`, `itemRender`, `itemProps`, `contentTop`, `contentBottom`, size and content attributes/slot overrides. Keep data-driven menu items, check/radio/submenu behavior. Flatten old `contentProps` attributes onto Content; don't introduce two competing surface-prop channels.
- ContextMenu.Trigger defaults to a non-button target element and preserves right-click, keyboard menu invocation, touch long-press cancellation, and virtual pointer anchoring. Do not turn it into an ordinary left-click trigger.
- Reuse/refactor shared Popper internals to make trigger registration and lazy content rendering context-driven. Internal adapters may exist during a phase, but remove obsolete public render-prop trigger paths once all callers migrate.
- Avoid double presentation from Modal under Dialog/Sheet: Modal supplies behavior/structure while higher-level content supplies its own Design entry through an internal composition path. Standalone Modal.Content still resolves `design.modal`. Applying `class` must never select between these paths.

### Native refs

Add `inputRef?: Ref<HTMLInputElement>` to `InputT.Base` in `src/forms/input/input.types.ts` and `textareaRef?: Ref<HTMLTextAreaElement>` to `TextareaT.Base` in `src/forms/textarea/textarea.types.ts`, using Solid's ref type and `callRef`. Split named refs out of DOM spreads. Assign internal element variables first, then invoke the consumer ref. Keep `ref` on each wrapper div. Document callback usage as the reliable API: `inputRef={(element) => { input = element }}`. Do not promise JSX variable assignment for arbitrary named props unless an actual Solid compile/runtime fixture proves it; `callRef` cannot assign a caller variable from a value.

Audit other controls but keep this migration's additions to Input/Textarea unless another directly editable native owner needs the same fix. Hidden synchronization inputs and implementation-only search fields do not need new refs. Preserve autofocus, form reset, controlled-value restoration, wrapper focus, selection APIs, and textarea autoresize.

## Scope

Only the following paths may change, and only to implement the contracts above:

- `src/design/**` (new), `src/design.ts` (new public entry), `src/index.ts`.
- `src/shared/provider/**`, `src/shared/style/recipe.ts` and its test, `src/shared/recipe-common.class.ts`, `src/shared/style/animations.ts`, and new behavior-only structural constants if separation requires them.
- `src/elements/**`, `src/forms/**`, `src/navigation/**`, `src/overlays/**`: colocated `*.types.ts` files for all component families housing component namespaces (`<Component>T`) and prop types; presentation ownership, named refs, specified overlay parts, direct internal callers, barrels, colocated types/styles/tests/SSR fixtures. No unrelated behavior refactoring.
- `src/shared/type-test/**`, `src/test-utils/**` for Provider-aware rendering/SSR test setup only.
- `src/unocss/**`, `src/tailwind/**`, `test/acceptance/**`, `test/consumer-fixtures/**` for the listed architecture and engine gates.
- `package.json`, `tsdown.config.ts` for Design entry/exports only.
- `README.md`, `docs/pages/**`, `docs/index.tsx`, `docs/routes/**`, `docs/PREVIEWS.md` for current API examples/callers and Provider installation; preserve docs layout and tokens.
- `docs/build/api-doc/**`, `docs/build/plugins/api-doc-generator.ts` and associated existing build tests only if new namespace declarations require extractor support. Generated `api.json` / `_api-index.json` must come from generation.
- `plans/001-design-and-component-dx.md`, `plans/README.md` for implementation evidence/status.

Everything else is out of scope, including lockfile/dependency upgrades, CI/release/deployment changes, Solid 2 migration, docs redesign, generalized slot attributes, new variant augmentation, replacing cn/recipe, and compound API redesign of Accordion/Tabs/Select/MultiSelect (their namespaces still move to colocated `*.types.ts` like other components). Never manually edit `dist` or `docs/dist`.

## Commands and conventions

| Purpose                                    | Command                | Expected                                            |
| ------------------------------------------ | ---------------------- | --------------------------------------------------- |
| Install only if needed, executor only      | `nub ci`               | exit 0, unchanged lockfile                          |
| Typecheck                                  | `nub run typecheck`    | exit 0                                              |
| Build                                      | `nub run build`        | exit 0; dist entries generated                      |
| Focused tests                              | `nub run test <paths>` | selected tests pass; script builds first            |
| Full tests                                 | `nub run test`         | all tests pass                                      |
| Published type fixtures                    | `nub run test:types`   | both TypeScript fixture projects pass               |
| QA, mandatory before any authorized commit | `nub run qa`           | formatter/linter/typecheck/type fixtures pass       |
| Docs build                                 | `nub run docs:build`   | SSG succeeds, API docs regenerate                   |
| Production preview                         | `nub run docs:preview` | build succeeds and preview serves production output |
| Diff hygiene                               | `git diff --check`     | no output, exit 0                                   |

QA mutates formatting and build scripts can regenerate package/API metadata. The advisor did not run those. The executor must inspect and retain only migration-related changes, preserving existing user edits. Do not publish, commit, push, or open a PR unless requested. When committing is authorized, match the existing concise messages, e.g. `fix: resolve style system review findings`.

Work on the user's requested `style-refactor` branch. Before implementation fetch `origin style-refactor`, inspect its HEAD against this plan and local HEAD, and reconcile drift without resetting local work. The advisor inspected local HEAD only; remote freshness is not established. If isolation is requested, derive a `codex/` worktree branch from the verified requested branch.

Use `.ts`/`.tsx` extensions on touched internal imports, `splitProps`/getters for reactive props, Solid control flow, flat Tailwind utility syntax, and declare all component public types in namespaces (`<Component>T`) inside colocated `*.types.ts` files. Do not add `Extend` types or class-only memos. Use the available `nub`, `solid-js-1.x-best-practices-and-api`, and `.agents/skills/build-ssr-safe-component/SKILL.md` skills during execution. The latter requires getter-backed single-resolution tests and production hydration validation. Read it fully before creating overlay parts.

## Steps

### 1. Establish baseline and inventory presentation ownership

Fetch/check the branch as above. Run baseline gates, record existing failures, then inventory `src/{elements,forms,navigation,overlays}` runtime recipe imports, static class constants, inline class literals, style variables, nested helper consumers and public exports. Extend the ownership maps in `test/acceptance/style-system.test.ts` with Design ownership and a narrowly justified structural exception list. Include compound parts, `createForm.Form`, Modal, Collapsible, and shared menu/select paths.

**Verify:** `nub run typecheck`; `nub run test:types`; `nub run test`; `git status --short`. Commands pass or pre-existing failures are recorded before continuing. Do not remove assertions to establish a baseline.

### 2. Implement typed Design composition and the new Provider path

Create `src/design.ts` and `src/design/{types,create-design,official-design}.ts` plus focused tests. Design definitions import slot and variant schemas from component `*.types.ts` files. Retain raw component options in local style files and normalize them once in `createDesign`. Keep the full slot schema independent of the official preset so unstyled variant-only definitions work. Registry keys cover every family in the ownership inventory; empty entries are valid where a family has no default presentation.

Add required `design` Provider typing and accessor context; change resolver inputs to the new cascade. During the rollout, an explicitly internal temporary legacy path may keep unmigrated components compiling; it must be marked for deletion in step 7 and must not be presented as a supported final API. Do not convert legacy global inline styles into a permanent Design option. Add package/tsdown export wiring now, so tests consume the actual subpath.

**Verify:** `nub run test src/design src/shared/style/recipe.test.ts src/shared/provider/moraine-provider.test.tsx`; `nub run typecheck`; `nub run test:types`. New tests cover every merge level, inherited independence, omitted slots, false/null/undefined selections, nested Provider replacement, warning/no-fallback behavior, and reactive Design replacement. Existing unrelated behavior assertions continue to pass.

### 3. Migrate Button and ButtonGroup as the reference pattern

Extract `ButtonT` and `ButtonProps` into `src/elements/button/button.types.ts` and `ButtonGroupT` into `src/elements/button/button-group.types.ts`. Remove Button's runtime and type dependency on `button.class.ts`; read typed active Design defaults and compiled recipes via context. `button.class.ts` imports variant/slot types from `button.types.ts` (type-only). `button.tsx` imports and re-exports `ButtonT` and `ButtonProps` from `button.types.ts`. Keep current behavior and DOM. Move any group/state presentation into Design while preserving composition precedence. Update class-dependent Button tests to render under explicit Provider; retain deliberately provider-less tests for graceful unstyled behavior. Do not globally inject Provider into every test and accidentally erase missing-Provider coverage.

**Verify:** `nub run test src/elements/button src/shared/provider/moraine-provider.test.tsx`; `nub run test:types`. Assert root/slot class and style conflicts, Design default vs group vs explicit variant, loadingAuto, disabled/polymorphic activation, content single resolution, and unchanged element identity across Design replacement.

### 4. Migrate ordinary component families

Migrate elements first, forms second, navigation third. For each component family:

1. Extract the public namespace `<Component>T` and `{Component}Props` into a colocated `{component}.types.ts` file.
2. Re-export `<Component>T` and `{Component}Props` from `{component}.tsx` and `index.ts`.
3. Update `{component}.class.ts` to type options against `{component}.types.ts` via type-only imports.
4. Use existing family directories and the new Button pattern for Design resolution.
   Include AvatarGroup, KbdGroup, FormField, createForm's bound component, Accordion parts, SidebarFrame internal parts, BaseSelect, and shared item/group visual helpers. Keep current slots and public variant values. Convert atomic style sources into typed slot entries where necessary; avoid a second default resolver for helpers.

Migrate Collapsible's visual styling to `design.collapsible` and keep only validated behavior constants in its low-level implementation. Separate explicit Icon input from defaults. Add Provider in affected style/SSR fixtures. Move inline visual state classes to Design, not to a new component-owned `state` constant.

**Verify after each family:** `nub run test src/elements`, then `nub run test src/forms`, then `nub run test src/navigation`, each followed by `nub run typecheck`. Existing interaction and SSR suites pass. For every family, include an explicit unstyled test that checks no official visual classes survive, rather than only testing a Button exemplar.

### 5. Add native element refs

Update `src/forms/input/input.types.ts` and `src/forms/textarea/textarea.types.ts` with named refs on `InputT.Base` and `TextareaT.Base`, composing through `callRef` in `input.tsx` and `textarea.tsx`. Extend their existing tests and both published type fixture projects. Keep wrapper `ref` targets unchanged and ensure the new props never reach the wrapper as attributes.

**Verify:** `nub run test src/forms/input src/forms/textarea`; `nub run test:types`. Test correct element identity, wrapper identity, callback invocation, focus/selection APIs, form reset/controlled restoration, and autoresize with consumer refs attached. Include a negative type test using an incompatible element type. Do not use Input-vs-Textarea assignability as the only negative case without checking TypeScript's structural types.

### 6. Migrate overlay parts, beginning with Dialog

Extract overlay namespaces (`DialogT`, `ModalT`, `SheetT`, `PopoverT`, `TooltipT`, `DropdownMenuT`, `ContextMenuT`) into colocated `*.types.ts` (`dialog.types.ts`, `modal.types.ts`, etc.). Part types (`TriggerProps`, `ContentProps`, `CloseProps`) live in the namespace in `*.types.ts`.
Refactor `src/overlays/dialog/dialog.tsx`, reusing `src/overlays/modal/{modal,modal-trigger}.tsx` and `modal-context.ts`. Add a shared modal close control for Dialog/Sheet rather than duplicating interaction handling. Resolve JSX children inside the correct Provider owner. Content registration must not evaluate a closed content body merely to detect existence. Preserve title/description IDs and existing custom-header behavior.

Migrate Dialog callers and its tests/SSR fixtures before Sheet. Then refactor shared Popper registration/content ownership and migrate Popover/Tooltip, followed by DropdownMenu/ContextMenu and `src/overlays/base/menu`. Migrate direct callers in forms/navigation/docs during this step so typecheck remains meaningful. Ensure `as={Button}` forwards target props and composes handler/ref behavior once, with `preventDefault` cancellation preserved. Use the ownership table above for all moved props and eliminate phantom root refs.

Move standalone Modal presentation into `design.modal`; share behavior with higher-level surfaces without resolving two independent default visual entries. Remove nullish-class replacement paths for both overlay and content. Test unstyled exit completion, since animations may be absent, as well as interrupted close/reopen cycles.

**Verify after Dialog/Sheet:** `nub run test src/overlays/dialog src/overlays/modal src/overlays/sheet`; `nub run test:types`.

**Verify after floating families:** `nub run test src/overlays src/forms/select src/navigation`; `nub run typecheck`; `nub run test:types`. Preserve placement flips, hover delays, tooltip ARIA, focus handling, menu keyboard/typeahead/check/submenu behaviors, context-menu long press and keyboard invocation. All namespace root/part ref and callback-negative type cases pass.

### 7. Remove legacy architecture and enforce the import boundary

Delete `MoraineConfig`, `ComponentDefaultStyle`, `mergeMoraineConfig`, `mergeComponentStyle`, `useMoraineConfig`, config context/accessor exports, and temporary adapters once no caller needs them. Keep and repurpose the style resolver; do not delete component-local official recipe sources. Remove `ModalTriggerRenderer` after its last caller migrates.

Update `test/acceptance/style-system.test.ts` to enforce Design ownership and no component runtime path to visual recipe modules. Verify that component implementations and `src/design/**` import type definitions strictly from `*.types.ts` without loading recipe runtime code. Use import analysis or the build graph where aliases/barrels make line regex checks incomplete. Permit specifically justified structural modules and schema-only dependencies; verify both runtime components and internal helpers. Maintain runtime assertions against visual literals as well as import checks. Remove old architecture assertions, not meaningful behavior coverage.

**Verify:** `nub run test test/acceptance/style-system.test.ts src/shared/provider`; `nub run test:types`; `rg -n 'MoraineConfig|ComponentDefaultStyle|mergeMoraineConfig|mergeComponentStyle|useMoraineConfig|ModalTriggerRenderer' src docs README.md`. Search has no active usages; negative type tests and architecture-test search strings are the only allowed source-test references. No temporary legacy implementation remains.

### 8. Prove engine integration and remove global motion defaults

In `src/unocss/theme.ts`, remove generic transition defaults for both Wind engines. In `src/tailwind/index.ts`, remove generic root variables and DEFAULT transition duration/easing entries, retaining namespaced Moraine animation utilities. Add explicit Moraine duration/easing classes to official recipes where necessary to preserve component motion; keep classes statically discoverable and implement the same explicit utilities in both engines.

Update `test/consumer-fixtures/helpers.ts` to use real built package export metadata, include `moraine/design` resolution/import, and verify declaration resolution rather than only URL resolution. Scan all published `.mjs`/`.jsx` chunks, including Design chunks, using the documented consumer source patterns. Tests must build first rather than trusting stale dist. Avoid source-path aliases in isolated consumer tests.

**Verify:** `nub run test src/unocss src/tailwind test/consumer-fixtures`. Wind3, Wind4, and Tailwind v4 generate representative ordinary, form, overlay, state, responsive, and motion classes from published Design output. Compare generic `transition` / `transition-colors` output with and without Moraine: duration/easing remain the engine's own values; explicit Moraine motion utilities still work. Add import/declaration failures that would catch a missing actual `./design` export.

### 9. Update docs and validate production

Install one stable official Design at the docs app boundary shared by SSR/client. Update `README.md`, `docs/pages/styling.mdx`, `docs/pages/(general)/button/index.mdx`, `docs/pages/(overlay)/dialog/index.mdx`, other affected overlay/native-ref pages, and all affected Preview sources. Explain immutable Design/reactive Provider replacement, merge order, inheritance combinations, unstyled structural CSS, required Provider for official presentation, no-Provider warning, fixed semantic variants, instance overrides, compound DOM ownership, and callback native refs. Do not describe Provider as required to avoid a runtime crash.

Regenerate API JSON through the docs build. Ensure the API extractor and focused extraction tests parse namespace declarations re-exported from `*.types.ts` via `dist/index.d.mts`. If namespace part types are missing, update the existing API extractor and focused extraction tests rather than hand-writing JSON. Preserve docs semantic tokens, layout, metadata, preview conventions, and existing coverage; use dedicated examples for JSX/callback APIs, not generic controls.

**Verify:** `nub run test docs/build/api-doc test/acceptance/docs-preview.test.ts`; `nub run qa`; `nub run test`; `nub run docs:build`; `git diff --check`. All pass. Review changed generated declarations/API docs for every new part and removed root prop.

Run `nub run docs:preview` and use a real browser on `/`, `/button`, `/dialog`, `/form`, and each migrated overlay page at mobile (375px), tablet (768px), and desktop (1440px) widths. Exercise opening/closing, keyboard navigation, nested overlays, ref examples, and reactive Design switching. Listen for uncaught exceptions and error-level console output. Verify critical hydrated labels/icons/surfaces remain under the intended parents and visible when expected; a clean console alone is insufficient. Record routes, widths, interactions, and results in this plan. Do not mark DONE if browser verification cannot be performed.

## Test plan checklist

Use existing `src/shared/style/recipe.test.ts`, `src/shared/provider/moraine-provider.test.tsx`, colocated component tests, and SSR fixture/test pairs as patterns. New Design unit tests live under `src/design/`; do not invent a new test runner.

- Composition: slot conflict/unrelated-class retention, nested variant merge, appended compound priority, shallow defaults, parent immutability, inherited unstyled base, explicit extends with preset false, variant-only slots, boolean and null/undefined behavior.
- Provider/cascade: official/default/custom/unstyled/no-Provider; development warning and production silence; nested replacement; reactive replacement without DOM remount; group/state/per-call/instance class and inline style order.
- Coverage: each public family and owning compound part accounted for; no preset leaks via internal helper paths; genuine structural exceptions remain functional unstyled.
- Overlays: Trigger/Close keyboard and pointer activation, polymorphic prop/ref forwarding, cancellation/disabled behavior, controlled state, blocked dismissal, outside/Escape handling, focus restoration, nested stack/portal context, surface ref target, closed-body laziness, exit callback once, reopen during exit, no-animation completion.
- JSX/SSR: getter-backed single evaluation for inspected children/title/header/body/footer/icon values; render-prop component boundaries preserved where render props remain; no early evaluation outside Provider/presence; SSR/hydration node identity and visible nesting in production.
- Native refs: actual editable node and wrapper identities, composed internal behavior, no named-ref DOM leakage, incompatible ref rejection.
- Public types: both fixture modes accept flat Design and namespace examples from `*.types.ts`; reject invalid slots, variant keys/values, obsolete config/callback triggers, root class/style/ref, and incompatible native refs. Import Design through the published subpath.
- CSS consumers: actual exports/declarations resolve and real published chunks scan in all three engines; generic transition defaults untouched; explicit Moraine motion retained.

## Done criteria

- [ ] All step verification commands pass, including `nub run qa`, `nub run test`, `nub run test:types`, `nub run docs:build`, and `git diff --check`.
- [ ] All component public namespaces (`<Component>T`) and top-level prop types are moved into colocated `*.types.ts` files and re-exported from component barrels and package root.
- [ ] Architecture acceptance tests prove every styled family is covered and runtime components cannot reach official visual definitions directly.
- [ ] Searches in step 7 show no active legacy config or callback-adapter implementation; old API names occur only in intentional negative tests/search checks.
- [ ] Published consumer tests import `moraine/design` using real exports and validate both type fixture modes and all CSS engines.
- [ ] Browser evidence covers the production route/viewport matrix, no hydration errors, and preserved critical DOM after hydration.
- [ ] `git diff --name-only` and `git status --short` show only in-scope task changes after accounting for preserved pre-existing work; dependencies/lockfile unchanged.
- [ ] `plans/README.md` is updated with completion or a specific blocker; no migration phase is left on the old runtime path.

## STOP conditions

- Drift changes any load-bearing current-state excerpt or the overlay/presentation architecture: report the changed assumption and refresh the plan before implementation.
- Fetch reveals remote/local divergence that cannot be reconciled without overwriting unrelated work; do not reset or force-push.
- A verification gate fails twice after a reasonable targeted fix, or a pre-existing failure prevents proving this migration's behavior. Report command/output context without secret values.
- Completing a step requires an out-of-scope dependency upgrade, a recipe-engine replacement, generalized slotProps, component-schema widening, or unrelated visual redesign.
- A required public component or internal presentation path cannot fit the ownership inventory without duplicate Design layers; resolve the design gap rather than marking it structural.
- Production hydration fails or critical JSX disappears, even when development and JSDOM pass. Use the SSR skill's triage; do not add wrappers only to hide hydration-key mismatches.

## Maintenance notes

Future styled components must add a colocated `*.types.ts` declaring `<Component>T` (with `Slot`, `Variant`, `Classes`, `Styles`, `Base`, `Props`), a local official definition in `*.class.ts`, Design registration, and ownership/unstyled tests together. Review raw options and compiled recipes for drift; there must be one source of official visual defaults. Keep package export generation and consumer metadata verification aligned. New overlay parts must preserve context ownership, content laziness, handler cancellation, and real ref targets. New JSX slots require single-resolution and hydration coverage. No broader security/performance audit or dependency review was performed for this focused planning request.
