# Plan 001: Replace Design with layered Theme contracts and native control forwarding

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md`, unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 31707697..HEAD -- requirements.md detailed-design.md package.json tsdown.config.ts src test docs README.md`
> If either specification changed, or any implementation file named below changed since this plan was written, compare the "Current state" excerpts and the family matrix against the live code before proceeding. A semantic mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `31707697`, 2026-09-08

## Why this matters

Moraine currently represents presentation as a complete, recursively merged `Design` registry that every component reads directly. That architecture duplicates slot metadata, lets Theme-like defaults leak into behavior, weakens public prop types, and makes a component-only consumer vulnerable to pulling the complete official presentation graph into its bundle.

This migration makes presentation an ordered set of sparse Theme Recipe layers owned by Providers. It also closes public prop types, makes Input and Textarea forward native attributes to their editable controls, preserves native event payloads, and verifies the ownership boundary with real consumer builds rather than source-size guesses.

## Authoritative contract

Treat `requirements.md` and `detailed-design.md` as normative inputs. Do not edit either file while executing this plan. The implementation must preserve these rules:

- `MoraineTheme`, `createTheme`, `defaultTheme`, `ComponentRecipeConfig`, `slotRecipe`, `atomicRecipe`, `createComponentStyles`, `MoraineProvider`, and `MoraineUnstyledProvider` are the required names (`requirements.md:41-55`).
- A Theme contains presentation only; behavior, controlled state, native attributes, render content, and interaction state stay outside it (`requirements.md:21`, `requirements.md:33-39`).
- Variant precedence is older Recipe defaults, newer Theme defaults, inherited context, then instance props. Only `undefined` falls back; `null`, `false`, `0`, and `''` are preserved (`requirements.md:158-171`).
- Root Providers add `defaultTheme`; nested Providers append to inherited layers; unstyled Providers reset all inherited and official layers; missing Providers are functional and unstyled (`requirements.md:145-156`).
- Internal state is exposed with stable `data-*` or ARIA attributes, while measured geometry remains component-owned inline style or CSS variables (`requirements.md:173-179`).
- Input and Textarea send native attributes and handlers to the editable element while keeping root `class`, `style`, and `ref` on the wrapper (`requirements.md:188-214`).
- `MoraineThemeSchema` is compile-time only. There must be no runtime component registry or slot inventory (`requirements.md:216-221`).
- Component-only consumer bundles exclude `defaultTheme` and unrelated Recipes; Provider consumers may include the official Theme (`requirements.md:233-239`).
- Do not redesign focus management, overlays, validation, virtualization, or controlled/uncontrolled state machines, and add no runtime dependency (`requirements.md:33-39`, `requirements.md:241-246`).

The detailed design fixes the target runtime shape: `MoraineTheme` owns a private symbol-keyed ordered layer array (`detailed-design.md:225-237`), `createTheme` compiles only supplied entries and never deep-merges (`detailed-design.md:239-264`), and `createComponentStyles` returns reactive Variants plus root/slot bindings (`detailed-design.md:337-417`).

## Current state

The repository is on the target branch `style-refactor` at `31707697`. `nub run typecheck` succeeds. The focused baseline command covering Recipe, Provider, Input, and Textarea succeeds with 4 files and 84 tests.

Relevant implementation facts:

- `src/design/types.ts:39-171` declares `DESIGN_OPTIONS`, a complete `MoraineDesign`, and a manually repeated `CreateDesignOptions` registry for every family.
- `src/design/slots.ts` is the central runtime slot inventory that the new compile-time schema must replace.
- `src/design/create-design.ts:108-145` selects the official preset, recursively merges configuration, enumerates every `SLOT_SKELETONS` entry, and creates an empty compiled Recipe for each family:

  ```ts
  export function createDesign(options?: CreateDesignOptions): MoraineDesign {
    // ...select preset or extends...
    for (const [componentKey, slots] of Object.entries(SLOT_SKELETONS)) {
      const merged = mergeComponentOptions(slots, parent, user)
      const recipe = createSlotRecipe({
        base: merged.base ?? {},
        variants: merged.variants,
        compoundVariants: merged.compoundVariants,
        defaultVariants: merged.defaultVariants,
      })
      compiled[componentKey] = { recipe, defaultVariants: merged.defaultVariants }
    }
  }
  ```

- `src/shared/provider/moraine-provider.tsx:47-99` merges `base -> design -> group -> state -> instance` and exposes per-call group/state overrides. Lines 101-137 require `design: MoraineDesign`; nested Providers replace the parent rather than append layers.
- `src/shared/provider/moraine-provider.tsx:109-130` falls back to a complete empty Design and warns whenever `NODE_ENV !== 'production'`, rather than the required `DEV && NODE_ENV !== 'test'` condition.
- `src/shared/style/recipe.ts:92-107` drops both `undefined` and `null`, so `null` cannot suppress a default. Lines 234-250 expose the shape-detecting overloaded `recipe()` factory that must become explicit `slotRecipe()` and `atomicRecipe()` functions.
- `src/shared/types.ts:15-20,64-82` exposes `MoraineTypeConfig` and uses `{ [x: string]: unknown }` for default root props. This admits arbitrary attributes and hides upstream SolidJS documentation.
- `src/forms/input/input.tsx:278-318` spreads `rest` onto the wrapper and hand-lists native input attributes. Textarea follows the same model. Current `onChange` is a normalized-value callback, and user handlers run before internal/FormField work.
- `src/forms/form/form-context.ts:85-103` uses a hard-coded `defaultSize`, truthiness for size fallback, and Boolean coercion for some form state. Theme defaults cannot participate correctly while this remains.
- `src/index.ts`, `package.json`, and `tsdown.config.ts` expose and build `moraine/design`. `README.md`, `docs/routes/_app.tsx`, `docs/pages/styling.mdx`, `docs/pages/styling/design-replacement.tsx`, and `docs/pages/typescript.mdx` document the old contract.
- `test/acceptance/style-system.test.ts` asserts the complete `SLOT_SKELETONS` registry and old resolver behavior. `src/shared/type-test/default/index.tsx` currently expects arbitrary root props to compile, and `src/shared/type-test/autocomplete/index.tsx` opts into strict props with module augmentation.
- `test/consumer-fixtures/helpers.ts` verifies that `moraine/design` is published, but there is no tree-shaken component-only versus Provider consumer bundle test.

Existing conventions to preserve:

- Public component types live in colocated `*.types.ts` namespaces. Follow the named namespace style in `src/elements/button/button.types.ts`; only `<Component>Props` may be a top-level component type export.
- Component presentation lives in colocated `*.class.ts` files, uses flat Tailwind-compatible utilities, and combines caller classes with `cn()`.
- Relative and `@src` imports include `.ts` or `.tsx` source extensions.
- Solid props remain reactive; do not destructure them. JSX-valued props are resolved once per semantic decision. Follow existing SSR/getter tests such as `src/elements/button/button.ssr.test.tsx` and `src/elements/separator/separator.ssr.test.tsx`.
- Use `nub` for package scripts and JavaScript/TypeScript execution. Do not use npm, pnpm, yarn, bun, node, or npx.
- Commit history uses concise conventional messages such as `refactor: remove redundant props merges`.

## Ablation result

The following work was deliberately removed from the implementation design because it does not improve the required end state:

- Do not preserve `Design` aliases, accept both Provider APIs, or translate legacy configuration. The project is pre-1.0, and a dual stack would obscure ownership and bundle verification.
- Do not recreate `SLOT_SKELETONS`, an empty Theme, a root-slot registry, or a Variant-key registry. Local namespace types and each Recipe's own declared keys are sufficient.
- Do not add a generic state-class callback layer or a replacement for per-call state overrides. Use DOM state attributes, `dynamicStyles` for geometry, and local `cn()`/shallow style composition for repeated item instances.
- Do not rewrite the AST documentation extractor or create a complete API golden file. Extend the extractor only if a focused published-declaration test demonstrates that a new intersection cannot be read.
- Do not add a Theme manager, builder hierarchy, deep-freeze library, or new dependency. A private symbol, ordered arrays, explicit Recipe factories, and existing Solid primitives are enough.
- Do not rewrite existing overlay ownership, form state machines, or namespace extraction that already satisfy the specification. Migrate their presentation access only.

## Commands you will need

| Purpose                   | Command                                                                                                                                                                          | Expected on success                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Confirm tool              | `nub --version`                                                                                                                                                                  | exits 0                                                                                |
| Typecheck                 | `nub run typecheck`                                                                                                                                                              | exits 0 with no TypeScript errors                                                      |
| Packaged type tests       | `nub run test:types`                                                                                                                                                             | both type-test projects compile                                                        |
| Focused baseline          | `nub run test src/shared/style/recipe.test.ts src/shared/provider/moraine-provider.test.tsx src/forms/input/input.test.tsx src/forms/textarea/textarea.test.tsx`                 | 4 files and 84 baseline tests pass before edits                                        |
| Focused Theme tests       | `nub run test src/shared/style/recipe.test.ts src/theme/create-theme.test.ts src/shared/provider/create-component-styles.test.tsx src/shared/provider/moraine-provider.test.tsx` | all focused tests pass                                                                 |
| Full runtime suite        | `nub run test`                                                                                                                                                                   | build succeeds and all Vitest tests pass                                               |
| Full QA                   | `nub run qa`                                                                                                                                                                     | format, lint, typecheck, and packaged type tests pass                                  |
| Documentation build       | `nub run docs:build`                                                                                                                                                             | library and docs production builds succeed                                             |
| Production preview        | `nub run docs:preview -- --host 127.0.0.1`                                                                                                                                       | preview starts without build errors                                                    |
| Old API guard             | `rg -n "createDesign                                                                                                                                                             | MoraineDesign                                                                          | MoraineDesignContext                                                  | useMoraineDesign                                 | SLOT_SKELETONS | ComponentDesign | resolveComponentStyle | MoraineTypeConfig | enableRootAutocomplete" src test docs README.md package.json tsdown.config.ts` | exits 1 with no matches |
| Old Recipe field guard    | `rg -n "defaultVariants" src test docs README.md --glob '!src/shared/style/css-vars.ts' --glob '!src/shared/style/css-vars.test.ts'`                                             | exits 1 with no matches; the independent CSS-variable helper is intentionally excluded |
| Component ownership guard | `rg -n "defaultTheme                                                                                                                                                             | /default-theme                                                                         | \.class\.ts" src/{elements,forms,navigation,overlays} --glob '*.tsx'` | exits 1 with no component implementation imports |
| Recipe naming guard       | `rg -n "\brecipe\(" src --glob '*.class.ts'`                                                                                                                                     | exits 1; all multi-slot files use `slotRecipe` and atomic fragments use `atomicRecipe` |

The focused baseline was verified at plan time. If the baseline count changes before implementation, inspect drift instead of updating the expected number mechanically.

## Suggested executor toolkit

- Use the local `nub` skill for every package/script command.
- Use the SolidJS 1.x best-practices skill while changing props, memos, context, or control flow.
- Use the project's `build-ssr-safe-component` skill for every substantially changed component and complete its production hydration checks.
- Use the project's `parity-port` skill only for the Input/Textarea forwarding comparison; the checked-in reference behavior is Nuxt UI v4, while Moraine keeps its wrapper-ref and native Solid event conventions.
- Use the project's `clean-overreach` skill after tests pass to remove transitional code, compatibility residue, redundant wrappers, and speculative tests before final QA.

## Scope

**Read-only inputs**:

- `requirements.md`
- `detailed-design.md`
- `docs/DESIGN.md` — this is the existing visual design contract, not the obsolete `Design` API; do not rename or rewrite it.

**In scope** (the only implementation, test, configuration, and documentation areas that may change):

- Theme entry and runtime: create `src/theme.ts`, `src/theme/types.ts`, `src/theme/create-theme.ts`, `src/theme/create-theme.test.ts`, and `src/theme/default-theme.ts`.
- Remove the superseded Design entry and runtime after cutover: `src/design.ts` and all files under `src/design/`.
- Recipe and shared public-prop infrastructure: `src/shared/style/recipe.ts`, `src/shared/style/recipe.test.ts`, and `src/shared/types.ts`.
- Provider/style resolution: files under `src/shared/provider/`; create `theme-context.tsx`, `create-component-styles.ts`, and `create-component-styles.test.tsx` there if keeping those concerns separate from `moraine-provider.tsx`.
- Public and build entries: `src/index.ts`, `package.json`, and `tsdown.config.ts`.
- Component contracts: colocated `*.types.ts` files under `src/elements/`, `src/forms/`, `src/navigation/`, and `src/overlays/`.
- Official Recipes: existing colocated `*.class.ts` files under those four role directories, `src/shared/recipe-common.class.ts`, and a new `src/elements/collapsible/collapsible.class.ts` so Collapsible transition presentation no longer lives in its component file.
- Component integration: implementation files under those four role directories that currently match `rg -l "resolveComponentStyle|useMoraineDesign" src/{elements,forms,navigation,overlays} --glob '*.tsx'`, plus their family context types when parent classes/styles or inherited visual Variants must be passed to public compound parts.
- Input/Form integration: `src/forms/input/input.tsx`, `src/forms/input/input.types.ts`, `src/forms/textarea/textarea.tsx`, `src/forms/textarea/textarea.types.ts`, `src/forms/form/form-context.ts`, `src/forms/form/form-field.tsx`, `src/forms/form/form-field.types.ts`, and a focused shared ARIA-token helper/test under `src/forms/shared/` if reuse by Input and Textarea justifies it.
- Colocated component tests and SSR fixtures whose imports, presentation assertions, state attributes, forwarding, or Theme behavior change. Do not broaden unrelated behavior assertions.
- Type and shared test support: `src/shared/type-test/**` and `src/test-utils/design-render.tsx` (rename it to `theme-render.tsx` and update its consumers, or delete it if `<MoraineProvider>` makes it redundant).
- Acceptance and consumer verification: `test/acceptance/style-system.test.ts`, create `test/acceptance/editor-completion.test.ts` if needed, and files under `test/consumer-fixtures/` needed for the bundle ownership fixtures.
- User documentation and examples that refer to the obsolete API: `README.md`, `docs/routes/_app.tsx`, `docs/pages/styling.mdx`, `docs/pages/typescript.mdx`, `docs/pages/styling/design-replacement.tsx` (rename to `theme-replacement.tsx`), and other files returned by `rg -l "createDesign|MoraineDesign|Design API|design=|moraine/design" docs README.md`.
- `plans/README.md` and this plan file only for status and measured bundle notes at completion.

The compile-time schema must contain these presentation families, matching the current official map: `accordion`, `avatar`, `avatarGroup`, `badge`, `breadcrumb`, `button`, `buttonGroup`, `card`, `checkbox`, `checkboxGroup`, `collapsible`, `commandPalette`, `contextMenu`, `dialog`, `dropdownMenu`, `fileUpload`, `form`, `formField`, `icon`, `input`, `inputNumber`, `kbd`, `kbdGroup`, `modal`, `multiSelect`, `pagination`, `popover`, `progress`, `radioGroup`, `resizable`, `select`, `separator`, `sheet`, `sidebarFrame`, `slider`, `stepper`, `switch`, `tabs`, `textarea`, and `tooltip`. `List` remains outside the Theme schema because it is a headless behavior/rendering helper with no component-owned presentation Slots.

**Out of scope** (do not touch):

- `requirements.md`, `detailed-design.md`, and `docs/DESIGN.md`.
- Focus, dismissal, positioning, scroll locking, form validation, selection, virtualization, drag/resize, or controlled/uncontrolled behavior except the explicitly required Input/Textarea event order and FormField inheritance.
- `src/shared/style/theme.ts`, which defines design tokens and is unrelated to the removed `Design` API.
- `src/shared/style/css-vars.ts`; its `defaultVariants` term belongs to a separate CSS-variable helper and is not part of this migration.
- `src/unocss/**` and `src/tailwind/**` unless an existing consumer fixture needs an import-name update; do not change generated utility behavior.
- Dependencies, `nub.lock`, CI/release workflows, package version, or release notes.
- Generated `dist/`, docs build output, vendored prior-art directories, and unrelated docs copy that uses the ordinary English word "design".
- Any backward-compatibility alias, deprecation wrapper, public migration adapter, or second Provider context stack in the final tree.

## Git workflow

- The target is `style-refactor`. If the operator asks for a separate branch, use `codex/theme-architecture`; otherwise do not create or switch branches.
- Commit per completed, verified step. Suggested messages are `refactor: define component theme contracts`, `refactor: replace design with layered theme`, `fix: forward native text control props`, and `docs: document theme architecture`.
- The cutover step is one logical commit: the repository may be temporarily uncompilable inside that uncommitted edit, but it must compile before committing. Do not create a public or internal runtime adapter solely to make intermediate edits compile.
- Do not push or open a pull request unless the operator explicitly requests it.

## Steps

### Step 1: Capture the baseline and bundle measurements before changing APIs

1. Run the drift check, `git status --short`, `git rev-parse --short HEAD`, `nub run typecheck`, and the focused baseline command. The worktree must be clean before edits.
2. Add a reusable consumer-build helper under `test/consumer-fixtures/` using the existing Vite dev dependency with `build({ write: false })`. It must build a real temporary consumer against the locally built package, return emitted JavaScript plus Rollup/Vite module IDs when available, and compute raw and gzip byte counts with `node:zlib`. Use recoverable temporary directories created by the test process and clean only those exact directories.
3. Add two baseline fixtures/tests:
   - component-only: retain one exported component such as `Button` without importing a Provider;
   - styled boundary: retain `MoraineProvider`, `Button`, and the current `createDesign()` call required before cutover.
4. Record the two current raw/gzip results in the "Maintenance notes" section of this plan. Do not assert fixed byte ceilings. Keep the harness so the post-migration test can assert ownership using chunk module IDs and stable official class sentinels.

**Verify**: `nub run test test/consumer-fixtures` -> all consumer fixture tests pass and print one raw/gzip measurement for each of the two bundles.

### Step 2: Make component namespaces the single type source

1. In every themed family's colocated `*.types.ts`, add `export type SlotName = keyof Slot`, and keep `Classes = Slot<SlotClassValue>` plus `Styles = Slot<SlotStyleValue>` so slot JSDoc survives completion. Use `export type Variant = never` for a family with no visual Variants; do not use an empty interface that accepts arbitrary objects. Add concise English JSDoc to every component-owned Slot, Variant, Base prop, callback, ref, and render prop that lacks it. Add `@default` only for a real component or `defaultTheme` fallback.
2. Make every visual Variant accept `null`, because explicit `null` suppresses all Recipe defaults for that property. Preserve literal unions and generic relationships rather than widening to `string`, `boolean`, or `number`.
3. Use the following presentation-only Variant matrix. Properties not listed remain behavior/Base props or derived DOM state and must not appear in Theme defaults:

   | Family                                                                                        | Visual Variant properties                             |
   | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
   | `accordion`, `collapsible`, `commandPalette`, `form`, `icon`, `modal`, `popover`, `resizable` | none                                                  |
   | `avatar`                                                                                      | `size`, `badgePosition`                               |
   | `avatarGroup`                                                                                 | `size`                                                |
   | `badge`                                                                                       | `variant`, `size`                                     |
   | `breadcrumb`                                                                                  | `size`, `wrap`                                        |
   | `button`                                                                                      | `variant`, `size`                                     |
   | `buttonGroup`                                                                                 | inherited Button `variant`/`size`, plus `orientation` |
   | `card`                                                                                        | `compact`                                             |
   | `checkbox`                                                                                    | `size`, `variant`, `indicator`                        |
   | `checkboxGroup`                                                                               | `orientation`, `size`, `variant`                      |
   | `contextMenu`, `dropdownMenu`                                                                 | `size`                                                |
   | `dialog`                                                                                      | `fullscreen`, `scrollable`                            |
   | `fileUpload`                                                                                  | `size`                                                |
   | `formField`                                                                                   | `size`, `orientation`                                 |
   | `input`, `textarea`                                                                           | `size`, `variant`                                     |
   | `inputNumber`                                                                                 | `size`, `variant`, `align`, `orientation`             |
   | `kbd`, `kbdGroup`                                                                             | `size`, `variant`                                     |
   | `select`, `multiSelect`                                                                       | `size`, `variant`                                     |
   | `pagination`                                                                                  | `size`, `variant`, `activeVariant`, `controlVariant`  |
   | `progress`                                                                                    | `orientation`, `size`, `animation`                    |
   | `radioGroup`                                                                                  | `size`, `variant`, `indicator`                        |
   | `separator`                                                                                   | `size`, `type`                                        |
   | `sheet`                                                                                       | `inset`                                               |
   | `sidebarFrame`                                                                                | `variant`                                             |
   | `slider`                                                                                      | `size`, `variant`                                     |
   | `stepper`                                                                                     | `size`                                                |
   | `switch`                                                                                      | `size`                                                |
   | `tabs`                                                                                        | `variant`, `size`                                     |
   | `tooltip`                                                                                     | `invert`                                              |

   Remove these state/behavior-only Recipe properties while retaining any real public behavior prop in `Base`: Checkbox/CheckboxGroup `required`; FileUpload `dropzone`; FormField `required` and `hasText`; RadioGroup `orientation` and `tableOrientation`; Select/MultiSelect `mode`, `search`, and `side`; Resizable/Separator/Slider/Stepper/Tabs `orientation`; Slider `inverted` and `multiple`; SidebarFrame `isMobile` and `side`; Popover/Sheet/Tooltip `side`; Textarea `autoresize`. Derived-only values such as `hasText`, `tableOrientation`, `isMobile`, and placement side do not become public Base props merely because they leave `Variant`.

4. In `src/shared/types.ts`, remove `MoraineTypeConfig`, `CommonRootProps`, and the opt-in branch. For intrinsic `as`, use the existing restricted Solid intrinsic attributes directly; for a custom component, use `ComponentProps<T>`; then `Override` them with component-owned Base/Variant/style props. Preserve required custom-component props, ref/event inference, `data-*` support provided by Solid, and the current lowercase-event exclusions. Do not introduce another unrestricted string index signature.
5. Update `src/shared/type-test/default/index.tsx` and repurpose `src/shared/type-test/autocomplete/index.tsx`: arbitrary Card/root props must fail without module augmentation, valid native attributes must compile, and polymorphic Button custom components must still require their own props. Keep current Design assertions temporarily; the public Theme cutover happens in Step 4.
6. Remove top-level `*VariantProps`, `*RenderProps`, `*Item`, and similar component type exports if found; update internal imports to namespace members such as `ButtonT.Variant`. The only permitted top-level component type is the matching `XxxProps`. Context-only roots expose no `class`, `style`, `classes`, or `styles`; those props belong to the public parts that render DOM.

**Verify**: `nub run typecheck && nub run test:types` -> both commands exit 0; the negative type assertions reject arbitrary attributes and missing required custom-component props.

### Step 3: Add explicit Recipe and sparse Theme primitives beside the current Design path

1. Refactor `src/shared/style/recipe.ts` around explicit `slotRecipe()` and `atomicRecipe()` functions. Keep the current `recipe`, `createSlotRecipe`, and `createAtomicRecipe` exports only as a temporary internal bridge until the atomic cutover in Step 4; do not expose them from package entries.
2. Define `ComponentRecipeConfig<SlotName, Variant>` with optional `base`, `variants`, `compoundVariants`, and `defaults`. A slot Recipe must:
   - collect only slots contributed by base, the selected Variant branches, and matching compound variants;
   - inspect only its own declared Variant keys, never a central key list or `Object.keys()` on the reactive Variant proxy;
   - apply base, selected Variants, and compounds in declaration order and normalize each slot with `cn()`;
   - preserve `false`, `0`, and `''`; use `null` to suppress the property default; use `undefined` to permit fallback;
   - retain its readonly options and never mutate caller configuration.
3. Add `src/theme/types.ts` with the private `THEME_LAYERS` symbol/runtime types and a type-only `MoraineThemeSchema` mapping exactly the family keys in Scope to each namespace's `SlotName` and `Variant`. Derive `CreateThemeOptions` from that schema plus optional `extends`; do not manually duplicate a second list of option types beyond the schema mapping.
4. Add `src/theme/create-theme.ts`. `createTheme()` reads parent layers, compiles only supplied component entries with `slotRecipe`, appends a sparse own layer only when non-empty, and freezes the outer Theme/layer arrays. It does not deep-merge, clone component props, validate props at runtime, enumerate schema keys, or create empty Recipes.
5. Add `src/theme.ts` as the future package entry. Export `createTheme`, `MoraineTheme`, `CreateThemeOptions`, and `ComponentRecipeConfig`; also export the explicit `slotRecipe` and `atomicRecipe` functions from this Theme-facing entry. Do not export `THEME_LAYERS`, compiled layer types, context access, `createComponentStyles`, or `defaultTheme`.
6. Add `src/shared/provider/theme-context.tsx` and `src/shared/provider/create-component-styles.ts` as internal modules:
   - the context default is `undefined`, and the missing-provider accessor returns one stable empty layer array;
   - warn only under `DEV && process.env.NODE_ENV !== 'test'`, once per root application Owner when possible and once module-wide when there is no Owner;
   - expose a stable reactive Variant object whose property getters resolve instance, inherited context, then Theme defaults from newest layer to oldest;
   - memoize the ordered Recipe output array once per dependency state, not once per slot;
   - merge classes as Theme outputs, group classes, instance slot classes, then root class;
   - merge styles as component dynamic style, group style, instance slot style, then root style;
   - return `{ variants, root, slot(name) }`; do not accept base classes, state classes, arbitrary callbacks, official Recipes, or slot lists.
7. Test Recipe value semantics, compound ordering, sparse outputs, immutability, Theme inheritance order, empty Theme allocation, resolver precedence, class/style order, reactivity, missing-provider warnings, and DOM identity. Tests may use the internal Theme Context directly while the old public Provider remains active.

**Verify**: `nub run test src/shared/style/recipe.test.ts src/theme/create-theme.test.ts src/shared/provider/create-component-styles.test.tsx` -> all focused tests pass; `nub run typecheck` remains clean with the old public API still operating.

### Step 4: Atomically cut every component and the public package from Design to Theme

Perform this as one uncommitted cutover because supporting both public Provider contracts would create the prohibited compatibility architecture. The repository must build before and after this step, but it may be temporarily uncompilable while the files in this step are being edited.

1. Convert all official `*.class.ts` files to `slotRecipe({ ... defaults })`; convert `selectItemVariants`, `selectContentVariants`, and other single-element fragments to `atomicRecipe`. Remove the overloaded `recipe()` calls and top-level `*VariantProps` exports. Add `src/elements/collapsible/collapsible.class.ts` and move `COLLAPSIBLE_TRANSITION_CLASS` plus other official Collapsible presentation there.
2. Replace state/behavior Recipe branches removed in Step 2 with flat selectors against attributes already present or added in this step. Prefer ARIA for semantic state. Put `data-*` on every DOM slot that needs direct selectors. Keep measured dimensions, coordinates, transform origins, progress/slider percentages, resizable sizes, and indicator positions in `dynamicStyles` or explicit CSS custom properties at their current component call sites.
3. Create `src/theme/default-theme.ts` as the one complete official Theme layer. It may import all official Recipe modules and map the schema family keys to compiled Recipes plus their `defaults`. It must contain no constructors, prop metadata, slot arrays, root-slot metadata, or behavior state. Construct it without recompiling each already compiled official Recipe. Do not export it from `src/theme.ts` or `src/index.ts`.
4. Replace `MoraineProvider` in `src/shared/provider/moraine-provider.tsx`:
   - `theme?: MoraineTheme` is optional;
   - without a parent, layers are `defaultTheme` followed by current `props.theme` layers;
   - with a parent, layers are parent layers followed by current `props.theme` layers, without another default Theme;
   - read `props.theme` through an accessor so signal replacement updates existing DOM nodes;
   - add public `MoraineUnstyledProvider` whose layers contain only its optional Theme and which ignores both parent and official layers;
   - a styled Provider inside an unstyled Provider inherits the reset context and does not restore `defaultTheme`.
5. Export only `MoraineProvider` and `MoraineUnstyledProvider` publicly from the root. Remove public `useMoraineDesign`, `MoraineDesign`, and `MoraineTypeConfig`. Internal component code imports `createComponentStyles` through the provider internal barrel.
6. Migrate every current resolver consumer to `createComponentStyles(familyKey, props, options)`. Use one family key for compound APIs; public parts choose `rootSlot`, parent family contexts carry only inherited visual Variants and parent `classes`/`styles`, and private behavior primitives do not apply a second presentation layer. No component implementation may import `defaultTheme` or a `*.class.ts` file.
7. Preserve these special cases without adding a generic abstraction:
   - Icon prepends its content-derived icon-name class locally, then applies the resolved Theme/instance root class; its numeric/string size is a component dynamic inline style.
   - Repeated menu/select/command/resizable/stepper item props compose their item-specific class with `cn()` and merge style shallowly at the item DOM node. Do not restore a resolver-level per-call override API.
   - Accordion/Collapsible height, Select transform origin, Slider/Progress percentages, Resizable sizes, and Tabs indicator geometry use `dynamicStyles` or existing CSS variables.
   - Loading, expanded/open/closed, invalid, required, highlighted, selected, disabled, dropzone, mobile, orientation, multiple, inverted, autoresize, and placement state use documented ARIA/data attributes and flat selectors rather than Theme Variant defaults or JavaScript state callbacks.
8. Use `styles.variants` as the final visual value source. Remove component hard-coded visual fallbacks already supplied by `defaultTheme`; retain behavior defaults in component code. Form controls pass FormField size through `inheritedVariants`, and instance props still win. Change `useFormField` so an absent inherited size remains `undefined` instead of forcing `md`; never use truthiness for fallback.
9. Update all affected component tests, SSR fixtures, and `src/test-utils/design-render.tsx` consumers. Official styling tests use `<MoraineProvider>` without a prop; custom tests use `createTheme`; intentionally unstyled tests use `<MoraineUnstyledProvider>` or no Provider according to the behavior being tested.
10. Change `package.json` and both export maps in `tsdown.config.ts` from `./design`/`design` to `./theme`/`theme`. Then delete `src/design.ts`, `src/design/**`, the temporary legacy Recipe factories/overload, and every old Design import. There is no compatibility alias.

**Verify**:

```sh
nub run typecheck
nub run test src/shared/style/recipe.test.ts src/theme/create-theme.test.ts src/shared/provider/create-component-styles.test.tsx src/shared/provider/moraine-provider.test.tsx src/elements/button/button.test.tsx src/elements/button/button.ssr.test.tsx src/overlays/dialog/dialog.test.tsx src/forms/select/select.test.tsx
rg -n "createDesign|MoraineDesign|MoraineDesignContext|useMoraineDesign|SLOT_SKELETONS|ComponentDesign|resolveComponentStyle" src test
```

Expected: typecheck and focused tests pass; the final `rg` exits 1 with no matches. Confirm Provider replacement tests assert the same DOM node reference before and after changing a Theme signal.

### Step 5: Forward Input and Textarea native contracts to the editable controls

1. In `input.types.ts` and `textarea.types.ts`, compose Base from the matching Solid native attribute interface, omitting only fields Moraine overrides. Re-declare wrapper `ref`, native `inputRef`/`textareaRef`, controlled value fields, visual `size`, and intercepted `onInput`/`onChange` with exact native event signatures. Keep `onValueChange` as the only normalized-value callback. Do not keep a native-attribute allowlist.
2. In each component, split only Moraine behavior/render props, Theme/style props, wrapper ref, native-control ref, and intercepted value/event props. Spread all remaining native props onto `<input>`/`<textarea>`, never the wrapper. The wrapper receives root class/style/ref, Moraine layout/state data, and the internal pointer behavior that focuses the editable control; a caller's native `onPointerDown` belongs to the control.
3. On the native element, apply props in this order: remaining native props, library-owned resolved identity/state, merged ARIA, value binding, control ref/slot styling, and composed handlers. This prevents the rest spread from replacing internal bindings while retaining every un-intercepted platform handler unchanged.
4. Compose intercepted events in this order and exactly once: internal normalized value/focus work, `onValueChange` when applicable, FormField notification, then the user's native handler with the original event. Do not let the user handler's `preventDefault()` retroactively skip already-required internal/Form work. Preserve lazy, trim, number, controlled value restoration, and autoresize semantics.
5. Resolve `id`, `name`, `disabled`, `required`, and `readOnly` with undefined-only precedence: Form/default, nearest FormField/bound field, explicit control. Add `disabled` and `readOnly` to FormField context only if needed to represent the specified inherited layer; do not change validation rules.
6. Add one small shared ARIA-token function under `src/forms/shared/` and use it from both controls. It tokenizes caller values first, appends generated `aria-describedby`/`aria-labelledby` IDs in stable semantic order, removes empty/duplicate tokens while retaining first occurrence, and returns `undefined` for an empty result. Scalar ARIA values use explicit caller values when non-`undefined`, then FormField state.
7. Add focused runtime and type tests for `form`, `list`, `enterKeyHint`, `aria-label`, arbitrary `data-*`, native clipboard/composition/keyboard/validation handlers, wrapper/native refs, native event targets, callback order/count, caller/generated ARIA tokens, empty tokens, duplicates, explicit false state, and FormField inheritance. Assert that native attributes do not appear on the wrapper.

**Verify**: `nub run test src/forms/input/input.test.tsx src/forms/input/input.ssr.test.tsx src/forms/textarea/textarea.test.tsx src/forms/textarea/textarea.ssr.test.tsx src/forms/form/form-field.test.tsx && nub run test:types` -> all focused runtime/SSR tests and both packaged type projects pass.

### Step 6: Replace obsolete acceptance assertions with contract and declaration coverage

1. Rewrite `test/acceptance/style-system.test.ts` so it tests the new invariants instead of the deleted runtime registry:
   - schema family keys type-check against namespace `SlotName`/`Variant` types;
   - `createTheme` is sparse and layered, and missing entries allocate no Recipe;
   - components do not import official Recipes/defaultTheme;
   - defaultTheme ownership stops at Provider;
   - no slot or Variant runtime inventory exists;
   - state styling uses documented DOM attributes;
   - old API and overloaded Recipe names are absent.
2. Extend `src/shared/type-test/default/index.tsx` and `autocomplete/index.tsx` to cover the final public package: root Provider without a Theme, sparse typed `createTheme`, invalid family/slot/Variant failures, Button polymorphic required props, Input/Textarea native event targets, and Select/Form generic inference.
3. Add a focused TypeScript 7 language-service/completion test with `typescript/unstable/sync` only if ordinary emitted-declaration assertions cannot prove documentation retention. Cover exactly one Button Variant with its official default JSDoc, one Input-owned prop, one inherited native Input attribute, one documented Slot for Button/Input/Select, and one generic Select prop. Do not create a full public API golden manifest.
4. Build the package and inspect `dist/*.d.mts`. Assert representative Prop, Variant, Slot, and `@default` text in a focused test. Change `docs/build/api-doc/**` only if this test proves that a specific new native/intersection form is not parsed; add the smallest regression fixture for that form.

**Verify**: `nub run test test/acceptance/style-system.test.ts test/acceptance/editor-completion.test.ts docs/build/api-doc && nub run test:types` -> all selected acceptance, declaration/completion, extractor, and type tests pass. If no separate editor-completion file was necessary, omit that path from the command and record which emitted-declaration assertion covers it.

### Step 7: Prove the runtime ownership, SSR, and bundle boundaries

1. Convert the consumer Provider fixture from `createDesign()` to `<MoraineProvider>` and import `createTheme` only in a custom-layer case. Keep the component-only fixture free of Provider and Theme imports.
2. Assert the component-only output lacks the `defaultTheme` module and at least one stable unrelated official Recipe/class sentinel. Assert the Provider output contains official presentation and that a supplied custom Theme layer overrides a lower official class. Prefer emitted chunk module IDs; use class sentinels as a secondary check when bundler metadata is unavailable.
3. Print and record post-migration raw/gzip sizes next to the Step 1 values in this plan's Maintenance notes. Do not fail on a fixed byte threshold; fail only when the ownership boundary is violated.
4. Run all existing SSR fixtures. Add/retain getter single-evaluation assertions for changed JSX-valued props and Theme access, server/client class/style/data parity, reactive Theme replacement, and preserved DOM/focus/selection/uncontrolled state.
5. Start the production docs preview and inspect `/`, `/button`, `/dialog`, and `/form` at 375 px, 768 px, and 1440 px using browser automation. Confirm no hydration warnings or console errors, official classes are present inside the root Provider, Button interaction works, Dialog opens/closes with focus behavior intact, and Input/Textarea accept typing without losing focus or value. Stop the preview process after the checks.

**Verify**: `nub run test test/consumer-fixtures test/acceptance/style-system.test.ts && nub run test` -> consumer ownership assertions and the complete runtime/SSR suite pass. The production browser check has no console/hydration errors at all three widths.

### Step 8: Publish the Theme contract in docs and run final gates

1. Update `README.md` and `docs/pages/styling.mdx` to show root Provider defaults, sparse `createTheme`, ordered `extends`, nested Provider append semantics, unstyled reset boundaries, `defaults`, class/style order, null suppression, and data/ARIA state selectors.
2. Update `docs/routes/_app.tsx` to render the docs under `<MoraineProvider>` without constructing an official Theme. Rename `docs/pages/styling/design-replacement.tsx` to `theme-replacement.tsx`, update preview references, and make the example demonstrate reactive Theme replacement without remounting component DOM.
3. Rewrite `docs/pages/typescript.mdx` to describe precise native/polymorphic props by default. Remove `MoraineTypeConfig` module augmentation instructions. Document Input/Textarea wrapper and native-control refs plus native handler versus `onValueChange` payloads.
4. Replace old API terms only in files returned by the targeted old-API search. Do not mechanically replace ordinary uses of "design" or alter `docs/DESIGN.md`.
5. Run `clean-overreach`: remove the temporary legacy Recipe exports, dual-context residue, one-use wrappers, redundant tests, historical migration comments, and compatibility wording. Keep only abstractions used by at least two call sites or required by the architecture.
6. Run all final gates once in this order and inspect the diff. Update this plan's bundle measurements and the row in `plans/README.md`.

**Verify**:

```sh
nub run qa
nub run test
nub run docs:build
rg -n "createDesign|MoraineDesign|MoraineDesignContext|useMoraineDesign|SLOT_SKELETONS|ComponentDesign|resolveComponentStyle|MoraineTypeConfig|enableRootAutocomplete" src test docs README.md package.json tsdown.config.ts
rg -n "defaultVariants" src test docs README.md --glob '!src/shared/style/css-vars.ts' --glob '!src/shared/style/css-vars.test.ts'
rg -n "defaultTheme|/default-theme|\.class\.ts" src/{elements,forms,navigation,overlays} --glob '*.tsx'
rg -n "\brecipe\(" src --glob '*.class.ts'
git status --short
```

Expected: the three build/test commands exit 0; each `rg` exits 1 with no matches; `git status --short` lists only files allowed by Scope and no generated `dist/` files.

## Test plan

- `src/shared/style/recipe.test.ts`: explicit factory routing, base/Variant/compound order, sparse slots, class normalization, immutability, and `undefined`/`null`/`false`/`0`/`''` semantics.
- `src/theme/create-theme.test.ts`: empty sparse Theme, one-entry compilation, ordered `extends`, no deep merge, no empty Recipe allocation, frozen outer structures, and compile-time family/slot/Variant rejection.
- `src/shared/provider/create-component-styles.test.tsx`: full default precedence, layer order, group/instance/root class and style order, reactive props/inheritance/Theme replacement, no remount, one output memo per dependency state, and missing-provider empty output.
- `src/shared/provider/moraine-provider.test.tsx`: root default, root custom append, nested append without duplicate default, unstyled reset, styled-under-unstyled behavior, reactive replacement, and warning conditions/deduplication.
- Component tests: retain behavior coverage while replacing old Design setup. Add focused state-attribute assertions wherever a behavior-only Variant or state callback was removed.
- Button tests: polymorphic inference, inherited ButtonGroup visual Variants, multi-slot override order, null suppression, reactive Theme replacement, and node identity.
- Dialog/Modal/Select tests: one family key across public parts, root-slot selection, parent class/style propagation without double-applying Theme classes, and preserved generic/overlay behavior.
- Input/Textarea tests: native forwarding, destination ownership, ref ownership, native payloads, normalized payloads, exact callback order/count, ARIA token merge/dedupe, inherited state, explicit false values, SSR parity, and controlled/uncontrolled preservation.
- Type tests: no arbitrary root attributes, upstream intrinsic completion, custom-component required props, Slot/Variant docs in declarations, Input/Textarea event targets, and Select/Form generics.
- Consumer fixtures: real tree-shaken component-only and Provider builds with module/sentinel ownership assertions plus reported raw/gzip measurements.
- Production preview: `/`, `/button`, `/dialog`, and `/form` at 375/768/1440 with hydration console inspection and critical interaction checks.

## Done criteria

- [x] `MoraineThemeSchema` maps every family listed in Scope using only namespace `SlotName` and `Variant` types and emits no runtime registry.
- [x] `moraine/theme` exports the required public Theme and explicit Recipe API; `moraine/design` and every old Design symbol are gone without aliases.
- [x] Root, nested, unstyled, and missing-Provider behavior exactly matches `requirements.md:145-156`.
- [x] Variant and class/style precedence matches `requirements.md:158-171`, including `null`, `false`, `0`, and `''`.
- [x] Every component implementation obtains official presentation only through `createComponentStyles`; no component imports `defaultTheme` or official Recipe modules.
- [x] Behavior/derived state removed from the Variant matrix is represented with stable DOM attributes, and measurement geometry remains inline/CSS-variable based.
- [x] Public component props have no unrestricted string index signature; polymorphic required props, native refs/events, Slot docs, and Select/Form generics compile.
- [x] Input/Textarea native attributes and handlers land on the editable control; wrapper style/ref ownership, event order, normalized callback, FormField precedence, and ARIA token merge tests pass.
- [x] Component-only consumer output excludes `defaultTheme` and unrelated Recipes; Provider output includes and applies official presentation; before/after raw/gzip values are recorded without fixed limits.
- [x] `nub run qa`, `nub run test`, and `nub run docs:build` all exit 0.
- [x] Production hydration checks pass at 375, 768, and 1440 px with no warnings or console errors.
- [x] All four final `rg` guards in Step 8 return no matches.
- [x] `git status --short` contains no out-of-scope or generated files.
- [x] `plans/README.md` marks Plan 001 `DONE` and this plan records bundle measurements.

## STOP conditions

Stop and report; do not improvise if any of these occurs:

- The drift check shows a semantic change to either specification, the Provider/Design implementation, Recipe types, BaseProps, Input/Textarea, package exports, or the family list.
- A current family cannot be mapped to the presentation-only Variant matrix without changing keyboard behavior, ARIA semantics, controlled state, validation, overlay behavior, or rendering branches. Report the exact family/property conflict.
- Implementing ordered layers appears to require a runtime component/slot/Variant registry, recursive config merge, official Recipe imports from components, or a shipped compatibility adapter.
- Precise `BaseProps` cannot preserve a required custom component prop or correct native ref/event inference without an unrestricted string index signature.
- Input/Textarea forwarding conflicts with controlled/lazy/model-modifier semantics in a way that requires redesigning `useTextControlValue` or Formisch behavior beyond the specified callback order.
- The component-only bundle still contains `defaultTheme` after two reasonable import-graph/tree-shaking fixes. Report the emitted module graph and sizes instead of weakening the assertion.
- Hydration or DOM-identity failures require changing a behavior state machine or render branch rather than Theme/style ownership.
- The API extractor would require a broad rewrite rather than support for one demonstrated intersection/shared-helper shape.
- Any solution requires a new runtime dependency, edits to an out-of-scope directory, or public API beyond the named contract.
- Any verification command fails twice after a reasonable, scoped fix attempt.

## Execution notes

- Execution is directly on `style-refactor`, without subagents or worktrees, as requested by the operator.
- Closed native props exposed two documentation examples using unsupported props. Scope includes removing the ineffective `FileUpload.value` binding in `docs/pages/(form)/file-upload/selecting-files.tsx` and `Card.as` in `docs/pages/(general)/card/card-semantics.tsx`; no new behavior is introduced.
- State-only Variant removal is performed with the Step 4 cutover so old Recipe consumers remain type-correct between verified stages.

- Verification completed on 2026-09-08: `nub run qa`, all 125 Vitest files (1,782 tests), and `nub run docs:build` passed. All four final API/import guards and `git diff --check` passed.
- Production Chrome checks passed for `/`, `/button`, `/dialog`, and `/form` at 375, 768, and 1440 px: no console/hydration errors, working Button activation, Dialog open/close with focus restoration, and editable Input/Textarea values with preserved focus. The temporary preview on port 4189 was stopped.
- Focused emitted-declaration tests retain Button Variant/default docs, Button/Input/Select slot docs, Input native inheritance and owned props, and Select generic callbacks. No separate language-service completion harness was needed.
- Scope adaptations required by verification: the docs Theme chunk includes its dependencies to avoid an initialization cycle; the API slot extractor recognizes a parenthesized `dynamicStyles` arrow body; List's internal Dynamic uses its existing concrete namespace prop type so QA preserves generic inference. Generated API JSON and build outputs are excluded from the source change.
- `useTextControlValue` changes only the required notification order. Text controls emit the native boolean `readonly` attribute correctly during SSR. Solid's native attribute spelling is `enterkeyhint`, which is covered in the native type/runtime tests.
- Cleanup removed unused atomic select recipes, the unused compiled menu recipe, obsolete Variant inference exports, default-Theme construction in tests, and one-use slot-map wrappers. A bundle ablation identified the nested frozen layer array as retaining official recipes; pure initialization annotations and deferred default metadata preserve the verified ownership boundary.
- The cutover and its dependent native contract/docs changes are kept in one verified atomic commit in the existing checkout.

## Maintenance notes

- Before/after consumer bundle measurements must be filled in by the executor:

  | Fixture               | Before raw | Before gzip | After raw | After gzip |
  | --------------------- | ---------: | ----------: | --------: | ---------: |
  | component-only Button |     399478 |       84479 |    390950 |      83268 |
  | Provider + Button     |     480804 |       97881 |    478373 |      96042 |

- When adding a new presentational family, add one type-only `MoraineThemeSchema` entry and one official `defaultTheme` Recipe entry. Do not add a runtime slot registry.
- When adding a Variant, decide whether it is purely visual. Behavior, state, placement, and measured values stay in Base/context/DOM attributes even when Recipes style them.
- Reviewers should scrutinize Theme default precedence, nested/un-styled boundaries, proxy/reactivity tracking, compound-family double application, native Input/Textarea spread order, and the component-only bundle module graph.
- `src/shared/style/css-vars.ts` intentionally retains its independent `defaultVariants` vocabulary unless a separate change redesigns that helper.
