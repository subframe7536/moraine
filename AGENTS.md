# AGENTS.md

This file contains definitive guidelines for agentic coding agents working on Moraine, a SolidJS component library that provide comprehensive components, reference from Nuxt UI and Shadcn.
Agents must follow these instructions to ensure consistency, quality, and maintainability.

Current stage: stable. Breaking changes require a major version and a `BREAKING CHANGE:` footer; prefer additive changes.

## Essential Commands

Use `pnpm` for package management and script execution.

The root package is the publishable `moraine` library in `src/`. The private `@moraine/docs`
workspace package lives in `docs/` and imports the library source directly for live updates.
Run workspace commands from the repository root.

Features that need an optional peer dependency ship from their own entry and live in their own
top-level directory, whose `index.ts` is that entry: `src/data-table/` is `moraine/data-table`
(`@tanstack/table-core`), `src/virtualizer/` is `moraine/virtualizer` (`@tanstack/virtual-core`),
and `src/dnd/` is `moraine/dnd` (`@dnd-kit/dom`).
The main `moraine` entry must never import any of these peers; `test/entry-boundaries.test.ts` checks the
built runtime and declaration output.
The main entry may import only the peer-free files `src/virtualizer/virtualizer.types.ts`
(the contract between virtualizers and their host components) and `src/virtualizer/virtual-content.tsx`
(the host-side mount); every other file in `src/virtualizer/` imports `@tanstack/virtual-core`.
The main entry imports nothing from `src/dnd/`: sortables compose with components through their
render props (such as `itemRender`) instead of component props.

### Build & Development

- `pnpm run build` - Build the library using tsdown (outputs to dist/).
- `pnpm run dev` - Build the library and start the documentation/development Vite server.
- `pnpm run docs:build` - Build the documentation site from `src/`.
- `pnpm run typecheck` - Run TypeScript type checking with `tsrs` (a Rust port of `tsc`; the `typescript` package is not installed). Build declarations also use the `tsrs` generator.

### Linting & Formatting

- `pnpm run lint` - Run oxlint with fix (fast linter based on oxc). Custom repository rules (`build/oxlint-plugin-moraine.ts`) check and enforce:
  - `moraine/no-slots-class-style-in-jsx` (spread the slot binding; do not pass its `class` / `style` to JSX attributes)
  - `moraine/data-attributes-in-slot-binding` (call `*DataAttributes` only as a `data` entry of `useRecipe` or `slotWith`)
  - `moraine/slot-binding-order` (destructure slot bindings to `<slot>Slot` and spread them before `{...rest}`)
  - `moraine/require-create-effect-on` (use the two-argument `createEffect(compute, apply)` signature)
  - `moraine/ref-callback-assign-only` (no `onCleanup`, `onSettled`, effects, event-listener helpers, or `register*` calls inside ref callbacks; use `bindElement`)
  - `moraine/no-emitted-extensions-in-imports` (disallow `.js`/`.jsx` extensions)
  - `moraine/no-string-style-prop` (prohibit string `style` in JSX)
  - `moraine/no-direct-component-call` (call components with `<Component />`, not function calls; require JSX-returning functions to be PascalCase components)
  - `moraine/no-re-export` (disallow "export { x }", require inline exports and disallow component re-exports)
  - `moraine/no-default-param-render-children` (children functions whose first parameter has a default or is a rest element run as accessors and never receive render props)
- `pnpm run format` - Format code using oxfmt.
- Run the fix-capable `lint` and `format` commands first; manually fix only issues they cannot resolve.
- `pnpm run qa` - Run lint with fixes, format, and typecheck together. **Run this before every commit and review the resulting diff.**

### Testing

- `pnpm run test:lib` - Build the library, check consumer type fixtures, and run library and consumer tests.
- `pnpm run test:docs` - Run documentation build logic tests.
- `pnpm run test` - Run both test suites.
- `pnpm vitest run <test-file>` - Run a single test file after building if it reads `dist/`.
- **Note:** Tests use `jsdom` environment.

### Commit Messages

- Follow Conventional Commits: `<type>(<scope>): <description>`. Omit the scope only when no single component or area describes the change.
- Use a lowercase type such as `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `perf`, `build`, `ci`, `chore`, or `revert`. Choose a scope for the affected area, such as `form`, `theme`, or `docs`.
- Write a concise English description in the imperative mood without a trailing period, describing the final change. For example: `feat(form): support hidden field labels`.
- Mark breaking changes with `!` before the colon or a `BREAKING CHANGE:` footer, and explain the breaking behavior.

## Source Structure

The `src` directory is organized by flattened components and shared infrastructure:

```text
├── components/             # All UI components (flattened).
│   ├── accordion/          # Accordion primitives.
│   ├── alert/              # Alert banner presentation.
│   ├── alert-dialog/       # Alert dialog overlay.
│   ├── avatar/             # Avatar and fallback display.
│   ├── avatar-group/       # Overlapping avatar groups.
│   ├── badge/              # Badge styles and component.
│   ├── base-dialog/        # Headless modal dialog primitive with trigger, portal, overlay, and content parts.
│   ├── base-select/        # Headless listbox, selection, and popup primitives for select controls.
│   ├── bold-slider/        # Single-value slider with inline label, value, and indicator.
│   ├── breadcrumb/         # Resource hierarchy with the current page.
│   ├── button/             # Button and button-like interactions.
│   ├── button-group/       # Joined button groups.
│   ├── card/               # Card layout primitives.
│   ├── checkbox/           # Checkbox control.
│   ├── checkbox-group/     # Checkbox group control.
│   ├── collapsible/        # Collapsible content primitives.
│   ├── combobox/           # Editable single collection selection.
│   ├── command-palette/    # Command palette behavior and presentation.
│   ├── context-menu/       # Context menu overlay.
│   ├── copy-button/        # Clipboard copy button with status feedback.
│   ├── dialog/             # Dialog primitives.
│   ├── drawer/             # Edge sheet with swipe-to-dismiss gestures and snap points.
│   ├── dropdown-menu/      # Dropdown menu overlay.
│   ├── empty/              # Empty-state presentation.
│   ├── field/              # Field layout, labels, descriptions, and validation messages.
│   ├── file-upload/        # File upload control and dropzone behavior.
│   ├── form/               # Form root, field wrapper, submission, and context.
│   ├── hover-card/         # Hover-triggered preview card for supplementary content.
│   ├── icon/               # Icon rendering helpers and component.
│   ├── input/              # Text input control.
│   ├── input-group/        # Compound input layout with addons and triggers.
│   ├── number-input/       # Numeric input control.
│   ├── kbd/                # Keyboard shortcut display.
│   ├── kbd-group/          # Simultaneous keyboard shortcut groups.
│   ├── list/               # List and list-item primitives.
│   ├── multi-select/       # Collection-backed multiple selection.
│   ├── navigation-menu/    # Navigation menu with triggers and content panels.
│   ├── pagination/         # Pagination controls.
│   ├── pin-input/          # Pin and OTP input control.
│   ├── popover/            # Popover overlay.
│   ├── progress/           # Progress indicators.
│   ├── radio-group/        # Radio group control.
│   ├── resizable/          # Resizable panels registered by id with percent layouts.
│   ├── scroll-area/        # Scroll container with custom or native scrollbars and edge fade indicators.
│   ├── select/             # Non-editable single collection selection.
│   ├── separator/          # Visual separators.
│   ├── sheet/              # Side or bottom sheet.
│   ├── sidebar/            # Responsive sidebar layout with a resizable rail.
│   ├── skeleton/           # Skeleton loading placeholder.
│   ├── slider/             # Slider control and slider hooks.
│   ├── stepper/            # Step-based navigation.
│   ├── switch/             # Switch control.
│   ├── table/              # Semantic table parts.
│   ├── tabs/               # Tab navigation.
│   ├── textarea/           # Textarea control.
│   ├── toast/              # Toast notification system.
│   ├── toggle-button/      # Two-state toggle button.
│   ├── tooltip/            # Tooltip overlay.
│   ├── tree/               # createTree hierarchy with selection, checking, and lazy loading.
│   └── shared/             # Sub-domain shared primitives (e.g. form/, overlay/, check-control/, splitter/).
├── data-table/             # `moraine/data-table` entry: createDataTable (returns the table instance with a bound `table.DataTable` presenter) and the standalone DataTable over TanStack Table.
├── dnd/                    # `moraine/dnd` entry: sortables over dnd kit, composed through render props.
│   ├── sortable.types.ts   # Public sortable types.
│   ├── create-sortable.tsx # createSortable: drag state, drop positions, and item registration.
│   ├── create-list-sortable.ts # createListSortable: flat list reordering with useRow.
│   └── create-tree-sortable.ts # createTreeSortable and moveTreeNode: tree moves with useNode.
├── provider/               # MoraineProvider plus theme, class-merging, and style resolution contexts.
├── shared/                 # Reusable internals that are not public components.
├── test-util/              # SSR, owner, overlay, and global test utilities.
├── theme/                  # Theme configuration, contracts, and creation primitives.
│   ├── recipe.ts           # Component recipes, Theme-layer compilation, and variant matching.
│   ├── tokens.ts           # Shared design tokens.
│   ├── unocss.ts           # UnoCSS preset and theme variable generation.
│   └── tailwind.ts         # Tailwind plugin.
└── virtualizer/            # `moraine/virtualizer` entry: list and table virtualizers over TanStack Virtual.
    ├── virtualizer.types.ts # Peer-free contract between virtualizers and host components.
    ├── virtual-content.tsx # Peer-free mount that hosts use for their `virtualizer` prop.
    ├── controller.ts       # Virtualizer lifecycle shared by the list and table adapters.
    ├── virtual-rows.tsx    # Row loop and row measurement shared by the adapters.
    ├── offset-observer.ts  # Scroll listeners shared by the row and column virtualizers.
    ├── list-virtualizer.tsx  # createListVirtualizer.
    └── table-virtualizer.tsx # createTableVirtualizer.
```

Component directories normally contain implementation (`{component}.tsx` and any colocated part or context files), a recipe (`{component}.recipe.ts`), style types (`{component}.style-types.ts`), public types (`{component}.types.ts`), tests, SSR fixtures/tests, and an `index.ts` barrel. Reusable static classes belong in a colocated or feature-level `*.recipe.ts` file. Keep component-specific behavior inside its component directory; move logic to `components/shared/` or `src/shared/` only when it is used by multiple component families. Private primitives for higher-level components are located in `components/shared/` and are not automatically public API.

## Style Implementation Details

- Define each component's declarative, themeable presentation in `{component}.recipe.ts` with `defineRecipe()` from `src/theme/recipe.ts`. Export it as `{component}Recipe`; use `/* @__PURE__ */` for the definition.
- Declare the recipe's slot and variant shapes in `{component}.style-types.ts`. Recipes must define every slot in `base`, including slots whose base class is empty.
- Resolve recipes in Solid components with `useRecipe(recipe, props, { slot?, varsSlot?, context?, own?, enforced?, data? })` from `src/theme/use-recipe.ts` (internal; not part of the public `moraine` entry). The API returns `{ slots, variants, slotWith, overrides }`. Components must destructure the return (`const { slots, variants, ... } = useRecipe(...)`) to avoid duplicate `resolved.slots` reads. Use `overrides({ targetSlot: 'sourceSlot' })` to forward presentation to sub-components; list every forwarded slot in the mapping.
- **One binding per host:** Each slot binding carries `class`, `style`, and the slot's `data-*` attributes. Destructure the bindings a component reads (`const { slots: { root: rootSlot, label: labelSlot } } = useRecipe(...)`) and spread `{...rootSlot}` on the host. Keep `slots` only for a dynamically selected slot (`slots[key]`). Use `slotWith` / `overrides` for per-item and forwarded presentation.
- **Data attributes:** Declare `*DataAttributes` in the recipe file and pass them as `data: { <slot>: xDataAttributes.<slot>(() => ({ ... })) }` to `useRecipe`, or as `slotWith(slot, { data: xDataAttributes.<slot>(state) })` for per-item state. The accessor form reads the state lazily, so it may reference declarations after the `useRecipe` call. Fold conditions into the state accessors so the binding keeps a fixed key set; do not spread `*DataAttributes` calls in JSX.
- **`useRecipe` layer order** (later wins). `cn` merges classes; style objects skip `undefined` / `null` so they do not overwrite earlier layers:
  1. Recipe base + variants/compound + Provider theme layers, plus recipe CSS vars on `varsSlot`
  2. `context: () => ({ variants?, classes?, styles? })` — ancestor Context presentation. `variants` are fallbacks for variant props the caller omits; `classes` / `styles` are per-slot overrides. Spread a stored `slotOverrides` into it (`context: () => ({ variants: ctx.variants, ...ctx.slotOverrides })`) and use `pickSlotOverrides(props)` when storing props on Context as `slotOverrides`.
  3. `own` — component-controlled, user-overridable (instance CSS variables, icon name class, button active class, decorative item classes).
  4. User: `classes` / `styles`[slot], then `class` / `style` on the current `slot`
  5. `enforced` — functional, must not be user-overridable (positioning, virtual scroll, visually-hidden, flex sizes).
- `own` and `enforced` are per-slot accessor maps only: `own: { leading: () => ({ class: ... }) }`. Return `undefined` from an accessor to contribute nothing.
- Prefer `enforced` for layout / position / virtualization and `own` for visual cosmetics. For per-item hosts inside `<For>`, call `const itemSlot = slotWith(slot, { own?, enforced?, data? })` once in the item callback (under the item owner): `own` / `enforced` are accessors returning `{ class?, style? }` merged on top of the parent slot memo, and `data` adds item `data-*` after the parent slot's `data`. Without `own` / `enforced`, the item binding reuses the parent slot memos.
- **Fine-grained reactivity:** `compileRecipe()` flattens the recipe and its Theme layers into ordered per-slot entry lists (`{ when?, value }`), cached per Theme and recipe. Each slot's recipe class, `.class`, and `.style` are lazy memos created on first read under the `useRecipe` owner; unread slots create nothing. Entries read variants through per-key memos while matching, so a slot memo tracks only the variants its own entries test. Each `context`, `own`, and `enforced` slot is a separate memo with equality checks, so an update to one slot does not invalidate others. Class memos use string equality; style memos use shallow equality and reuse the previous object when equal. On the server (`isServer`) the same computations run directly on every read, without memos or caches, and a binding omits an empty `class` / `style` key so `ssrElement` does not print `style=""`. On the client a binding has a fixed key set (`class`, `style`, then each `data-*`), so a plain-object `merge` keeps every key reactive.
- **Component CSS variables:** Define component-specific custom properties as recipe style keys, never as `[--name:value]` class utilities:
  1. Declare defaults on `base` / `variants` / `compoundVariants` as `'--name': value`.
  2. Consume them in slot or colocated classes with `prop-(--name)`.
  3. `useRecipe()` applies recipe keys to `varsSlot` (default `root`, or `slot` when the recipe has no root). Pass instance values through `own` on that slot (`own: { root: () => ({ style: { '--name': value } }) }`) so the slot `style` binding already includes them. Do not rebuild that binding with `merge` or a later `style={{ ...slots.<slot>.style, '--name': value }}`.
  4. Merge order on `varsSlot` is recipe keys, then `context`, `own`, caller `styles` / `style`, then `enforced`. Per-item hosts (Accordion content) call `useRecipe` for that host with `varsSlot` set to the host slot. Private wrappers may inherit a root `own` variable instead of adding a public slot. `element.style.setProperty` is only for imperative geometry on a node that is not updated through that binding (Floating UI).
     Theme engine variables (`--mo-enter-*`, `--mo-exit-*`, `--mo-anim-*`, `--mo-mix-*`, `--mo-*-ink`) stay in `src/theme`. Do not add a public recipe slot solely to hold a private wrapper variable.
- Put truly reusable static class values in a `*.recipe.ts` file and export constants in `UPPER_SNAKE_CASE` (for example, `TEXT_CONTROL_CLASS`). Do not create a recipe for static-only styling.
- Keep component-private visual class constants in the component's `*.recipe.ts` file alongside its recipe, using `UPPER_SNAKE_CASE`. Do not add public slots solely to relocate internal styles.
- Keep structural classes owned by shared infrastructure with that infrastructure. Component implementations should reference recipe bindings or class constants rather than declare visual class literals.
- Use recipe variants for public component variants and cross-slot presentation changes. Express DOM state with utility selectors such as `data-expanded:` or `aria-disabled:` instead of adding a recipe variant solely for internal state.
- **`useCn` and `cn` in UI components:** `useCn()` or `cn(...)` can be used in components when combining classes outside `useRecipe` (e.g. normalizing `ClassValue` props, non-recipe wrapper elements, or merging item row classes). Prefer `useRecipe` (`own`, `enforced`, and variants) for recipe-managed elements.
- Parenthesized utility groups are supported in recipe files (for example, `hover:(bg-red-500 text-white)`). Use standard flat utility syntax elsewhere.

## Code Style & Conventions

### Naming

- **Components:** PascalCase (`Button`, `CollapsibleContent`).
- **Files:** kebab-case (`button.tsx`, `collapsible-content.tsx`).
- **Functions:** camelCase (`createCollapsible`, `merge`).
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`).
- **Types:** PascalCase (`CollapsibleProps`, `CollapsibleRoot`).
- **Private:** Prefix with `_` (`_internalState`, `_handleClick`).
- **Props:**
  - If a component prop is a component (`Component<{ ctx: Context }>`, `(ctx: Context) => JSX.Element`), the prop name must end with `Render` (`itemRender: <Component>`, `tagRender: <Component>`). This rule applies to component props only; keys inside `items` collection objects are exempt (`content` on Tabs, Stepper, and Accordion items). `separator` is also exempt: it takes text or icon shorthand and also accepts a component (KbdGroup, Breadcrumb).
  - Do not duplicate the enclosing part name in the prop name (for example, on `Content`, name props `headerRender` and `footerRender`, not `contentHeaderRender` and `contentFooterRender`).
  - Controlled state uses the `x` / `defaultX` / `onXChange` triple. Every `on<X>Change` callback must have a matching `x` prop on the same part; the only exceptions are `onStatusChange` and `onOverflowChange`, which fire without a controlled value.
  - Positional icons use `leading` / `trailing`; a single primary icon uses `icon`; functional icons end with `Icon` (`closeIcon`, `clearIcon`, `removeIcon`, `loadingIcon`, `checkedIcon`, `prevIcon`). Any prop typed `IconT.Name` must be named `icon`, `leading`, `trailing`, `separator`, `badge`, or end with `Icon`.
  - Color uses `tone`; Alert maps its semantic variant onto `tone` too. `type` is reserved for the command-API semantics of `AlertDialog` and `Toast`, and for native HTML `type` attributes.
  - Numeric ranges use `min` / `max` / `step`.
  - Component boolean props must not use an `is` prefix; item predicate callbacks such as `isItemDisabled` are allowed.
  - List item text uses `label` and `description`.
  - Persistent closed content uses `forceMount?: boolean`.
  - Dismissal behavior uses `closeOnEscape` and `closeOnOutsideClick`.
  - A callback for a proposed value the component refused (characters dropped by a filter, files failing validation) is `onValueInvalid(details)`. It pairs with `onValueChange`, receives a `details` object, never a bare value, and does not cancel anything. Name a `reason` with the matching `ValidityState` key (`patternMismatch`, `tooLong`, `rangeOverflow`). `onInvalid` is reserved for passing through the native constraint-validation event, and `onReject` is not used.
  - Internal calculated variants belong on `*RecipeVariant extends *StyleVariants`; they must never appear in the public `*StyleVariants` or component props.
  - Render functions end with `*Render`; refs end with `*Ref`.
  - Components with a DOM host element use native `aria-label`; only data objects (`*Item` and imperative options) use `ariaLabel`. Declared component props use camelCase DOM names (`autoFocus`, `autoFocusDelay`, `autoComplete`), while the native attributes they emit stay lowercase.

### JSDoc

Component, prop, and type JSDoc is the documentation coding agents read first: the docs site, `api.json`, the llms Markdown, and the shipped `.d.mts` all render it.

- **Components:** every public component, including attached parts such as `Dialog.Trigger`, has a description and an `@example`. The description says what it is, when to use it instead of a sibling component, and any contract that is not obvious from the types (required wrapper or parent, polymorphic `as`, controlled and uncontrolled state). Do not restate individual props.
- **Props:** descriptions are Markdown. Wrap identifiers, prop names, and values in backticks and put HTML tags such as `<div>` in backticks; raw HTML in prose is escaped. Say what the prop does, including units, interactions with other props, and when a callback fires. Add `@default` only for a verified implementation default. Add `@example` only where usage is not obvious from the type (callbacks, object or array configurations, render props).
- **Tag layout:** prose first, then `@default`, then `@example`. The docs parser ends the description at the first tag, and text after a tag belongs to that tag.
- **Examples:** one fenced `tsx` block: `import` lines, optional statements, then one JSX expression starting at column 0 with `<`. Use real props; the block must type-check against `src/`.

### Public Type Exports

- Component public types must be declared in the component namespace: `<Component>T`.
- Each public component namespace must declare `Kind` as the literal type `'single'` or `'composite'`. Use `'composite'` when the component exposes attached child components for composition; slot count and group naming do not determine the kind. `FormT.Kind` describes the bound `form.Form`, so it is `'single'`. Documentation reads this type to generate `component.kind`.
- Component namespaces should contain `Slot`, `Variants`, `Classes`, `Styles`, `Item`, `Base`, and `Props` as applicable.
- **Render prop typing rules:**
  - **Reusable / Multi-instance renderers:** Multi-instance renderers evaluated across collections, loops, or multiple dynamic instances (`itemRender`, `tagRender`, `linkRender`, `separatorRender`, host `<AlertDialog dialogRender={...} />`) must be typed strictly as `Component<*RenderProps>`. Never accept `JSX.Element` here: in SolidJS, static JSX expressions create a single DOM node instance on evaluation that cannot be cloned or distributed across multiple iterations or instances.
  - **Single-usage contextual slots:** Slots mounted at most once per parent instance (`headerRender`, `footerRender`, `emptyRender`, `leadingRender`, `trailingRender`, imperative `AlertDialog.custom(...)`) accept `JSX.Element | Component<*RenderProps>`. Menu `headerRender` / `footerRender` (DropdownMenu, ContextMenu) mount once per open menu layer, so they are multi-instance and take `Component<*RenderProps>` only.
  - **No type aliases on `*Render`:** Do not create type aliases for the prop itself (`type Render = ...` or `type ItemRender = ...`). Type the prop directly as `Component<*RenderProps>` or `JSX.Element | Component<*RenderProps>`.
  - **Render prop parameter types:** Export parameter types in the component namespace: `<Component>T.<Slot>RenderProps` (e.g. `SelectT.ItemRenderProps`, `SelectT.EmptyRenderProps`, `DropdownMenuT.HeaderRenderProps`).
- **Composite component contracts:**
  - `<namespace>T.Base` must be the only type containing configuration and behavioral options. Do not include `classes`, `styles`, or `variant` directly on `Base`; they are supplied via `BaseProps`.
  - `<namespace>T.Props` must never just be `= Base`; it must extend `BaseProps`.
    - Headless roots (roots without a primary host DOM element, e.g. `Popover`, `Dialog`, `Sheet`, `Tooltip`, `BaseDialog`, `ContextMenu`, `DropdownMenu`, `BaseSelect`) use `BaseProps<never, Base, Variants, Classes, Styles, never>`. In `BaseProps`, a `never` default element omits `class` and `style`, accepting only slot maps `classes` and `styles`.
    - Element-rendering roots use `BaseProps<Tag, Base, Variants, Classes, Styles>`.
  - All attached child part props must be compose-only: `BaseProps<Tag, PartBase, never, never, never>`. Part bases (`ContentBase`, `TriggerBase`, `ItemBase`, etc.) must never take `classes`, `styles`, `variant`, or root configuration options (such as `finalFocus`, `gutter`, `overflowPadding`, `onExitComplete`). Configuration belongs strictly on root `Base`/`Props`.
  - If a part or base interface has no unique configuration and would only have `children?: JSX.Element`, do not define a redundant single-member interface — use `FlowComponent` from `solid-js` for the component instead.
- Do not add an `Extend` namespace type. Inline inherited/extended prop sources into the namespace `Base` type and pass `never` as the extension argument to `BaseProps`.
- Top-level type export is only allowed for the component props type: `XxxProps` (must match the component name).
- Do not export other top-level component types such as `*RenderProps`, `*SlotProps`, `*VariantProps`, `*Value`, `*Item`, `*Context`.
- Prefer consuming component types as namespace members (for example, `SelectT.Option`, `FormT.SubmitEvent`).

### SolidJS Best Practices

Solid is not React, and 2.0 is not 1.x. Pattern-matching from either is the
dominant bug source. Every name below is a `solid-js` export unless noted;
DOM APIs (`render`, `hydrate`, `Portal`, `dynamic`) are in `@solidjs/web`.

#### Three rules

1. **Props are read, not destructured; pass values, not accessors.**
   - Wrong: `function C({ name }) {}` and `<C value={count} />`
   - Right: `function C(props) { return <p>{props.name}</p>; }` and `<C value={count()} />`
2. **`createEffect` takes two functions: compute (tracks), then apply (side effects).**
   - Wrong: `createEffect(() => { el.title = count(); });`
   - Right: `createEffect(() => count(), v => { el.title = v; });`
3. **Stores are written through the draft.**
   - Wrong: `setStore("user", "name", "B")` or `setStore(produce(s => ...))`
   - Right: `setStore(s => { s.user.name = "B"; });`

#### Reference

- Full reference: `node_modules/solid-js/CHEATSHEET.md`; the same text is
  the `solid-2.0-cheatsheet` skill in `node_modules/solid-js/skills/`.
- Diagnostics: dev builds print `[CODE] message` plus an `in <App> › …`
  owner line. The first report of each code ends with a footer naming
  `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`, one section
  per code (`STRICT_READ_UNTRACKED`, `REACTIVE_WRITE_IN_OWNED_SCOPE`,
  `LOADING_ON_OUTSIDE_HOLD`, …). Fix the cause; never suppress a code.
- Evidence loops: `node_modules/@solidjs/diagnostics/skills/agent-loops/SKILL.md`
  (`captureArtifact`). With `@solidjs/vite-plugin`'s `diagnostics` option the
  dev server answers `POST /__solid/diagnostics` (`begin`, `active`, `whyDidRun`,
  `costs`, `end`).

### Styling (UnoCSS)

- **Utility First:** Use utility classes for 99% of styling.
- **Class Prop:** Always use `class` (not `className`).
- **Consistency:** Use `cn` to merge classes and `recipe` to define variants.
- **Style Prop:** Style prop must always be typed as `JSX.CSSProperties` (object); string style is strictly forbidden.

### Error Handling

- **Async:** Use `try/catch` block within async event handlers.
- **Boundaries:** Use `<Errored>` for component-level error containment and `<Loading>` for pending async derivations.
- **Types:** Avoid `any`. Use `unknown` if type is truly uncertain, then narrow it.
- Never use `recipe()` for static-only classes.

### Testing

- **File Name:** `*.test.tsx`.
- **Library:** `@solidjs/testing-library` for rendering and interaction.
- **Coverage:** Aim to test standard usage, edge cases, and accessibility (aria attributes).
- **Snapshot:** Use inline snapshots for small DOM structures, but prefer explicit assertions.

## Special Cases

- Use `Combobox` for editable single collection selection.
- Use `MultiSelect` for collection-backed values and creatable free-form tags.
