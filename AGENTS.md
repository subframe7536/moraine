# AGENTS.md

This file contains definitive guidelines for agentic coding agents working on Moraine, a SolidJS component library that provide comprehensive components, reference from Nuxt UI and Shadcn.
Agents must follow these instructions to ensure consistency, quality, and maintainability.

Current stage: pre-alpha. breaking change allowed.

## Essential Commands

Use `pnpm` for package management and script execution.

The root package is the publishable `moraine` library in `src/`. The private `@moraine/docs`
workspace package lives in `docs/` and imports the library source directly for live updates.
Run workspace commands from the repository root.

### Build & Development

- `pnpm run build` - Build the library using tsdown (outputs to dist/).
- `pnpm run dev` - Build the library and start the documentation/development Vite server.
- `pnpm run docs:build` - Build the documentation site from `src/`.
- `pnpm run typecheck` - Run TypeScript type checking.

### Linting & Formatting

- `pnpm run lint` - Run oxlint with fix (fast linter based on oxc). Custom repository rules (`build/oxlint-plugin-moraine.ts`) check and enforce:
  - `moraine/no-slots-class-style-in-jsx` (spread `{...slots.<slot>}` directly)
  - `moraine/inline-data-attributes-in-jsx` (inline `*DataAttributes` calls in JSX)
  - `moraine/require-create-effect-on` (wrap `createEffect` in `on()`)
  - `moraine/no-emitted-extensions-in-imports` (disallow `.js`/`.jsx` extensions)
  - `moraine/no-string-style-prop` (prohibit string `style` in JSX)
  - `moraine/no-direct-component-call` (call components with `<Component />`, not function calls; require JSX-returning functions to be PascalCase components)
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

The `src` directory is organized by component role and shared infrastructure:

```text
├── element/                # Basic, non-form UI elements.
│   ├── accordion/          # Accordion primitives.
│   ├── avatar/             # Avatar and fallback display.
│   ├── avatar-group/       # Overlapping avatar groups.
│   ├── badge/              # Badge styles and component.
│   ├── button/             # Button and button-like interactions.
│   ├── button-group/       # Joined button groups.
│   ├── card/               # Card layout primitives.
│   ├── collapsible/        # Collapsible content primitives.
│   ├── empty/              # Empty-state presentation.
│   ├── icon/               # Icon rendering helpers and component.
│   ├── kbd/                # Keyboard shortcut display.
│   ├── kbd-group/          # Simultaneous keyboard shortcut groups.
│   ├── list/               # List and list-item primitives.
│   ├── progress/           # Progress indicators.
│   ├── resizable/          # Resizable panels and interaction hooks.
│   └── separator/          # Visual separators.
│   ├── scroll-area/        # Scroll container with edge fade indicators.
│   ├── separator/          # Visual separators.
│   ├── skeleton/           # Skeleton loading placeholder.
│   └── toggle-button/      # Two-state toggle button.
├── form/                   # Form controls and form-state integration.
│   ├── base-select/        # Low-level selection, disclosure, and listbox primitive.
│   ├── checkbox/           # Checkbox control.
│   ├── checkbox-group/     # Checkbox group control.
│   ├── base-select/        # Low-level selection, disclosure, and listbox primitive.
│   ├── combobox/           # Editable single collection selection.
│   ├── field/              # Field layout, labels, descriptions, and validation messages.
│   ├── file-upload/        # File upload control and dropzone behavior.
│   ├── form/               # Form root, field wrapper, submission, and context.
│   ├── input/              # Text input control.
│   ├── input-group/        # Compound input layout with addons and triggers.
│   ├── input-number/       # Numeric input control.
│   ├── multi-select/       # Collection-backed multiple selection.
│   ├── radio-group/        # Radio group control.
│   ├── select/             # Non-editable single collection selection.
│   ├── slider/             # Slider control and slider hooks.
│   ├── switch/             # Switch control.
│   ├── textarea/           # Textarea control.
│   └── shared/             # Form-specific hooks, native control helpers, and select internals.
├── navigation/             # Navigation and page-organization components.
│   ├── breadcrumb/         # Breadcrumb navigation.
│   ├── command-palette/    # Command palette behavior and presentation.
│   ├── navigation-menu/    # Navigation menu with triggers and content panels.
│   ├── pagination/         # Pagination controls.
│   ├── sidebar-frame/      # Responsive sidebar layout.
│   ├── stepper/            # Step-based navigation.
│   └── tabs/               # Tab navigation.
├── overlay/                # Layered, floating, and dismissible UI.
│   ├── base/               # Shared overlay and menu behavior.
│   ├── context-menu/       # Context menu.
│   ├── dialog/             # Dialog primitives.
│   ├── dropdown-menu/      # Dropdown menu.
│   ├── modal/              # Modal composition.
│   ├── popover/            # Popover.
│   ├── sheet/              # Side or bottom sheet.
│   └── tooltip/            # Tooltip.
├── provider/               # MoraineProvider plus theme, class-merging, and style resolution contexts.
├── shared/                 # Reusable internals that are not public components.
├── test-util/              # SSR, owner, overlay, and global test utilities.
├── theme/                  # Theme configuration, contracts, and creation primitives.
│   ├── recipe.ts           # Component recipes and variant resolution.
│   ├── tokens.ts           # Shared design tokens.
│   ├── unocss.ts           # UnoCSS preset and theme variable generation.
│   └── tailwind.ts         # Tailwind plugin.
```

Component directories normally contain implementation (`{component}.tsx` and any colocated part or context files), a recipe (`{component}.recipe.ts`), style types (`{component}.style-types.ts`), public types (`{component}.types.ts`), tests, SSR fixtures/tests, and an `index.ts` barrel. Reusable static classes belong in a colocated or feature-level `*.recipe.ts` file. Keep component-specific behavior inside its role directory; move logic to `shared` only when it is used by multiple component families. `base` directories provide internal primitives for higher-level components and are not automatically public API.

## Style Implementation Details

- Define each component's declarative, themeable presentation in `{component}.recipe.ts` with `defineRecipe()` from `src/theme/recipe.ts`. Export it as `{component}Recipe`; use `/* @__PURE__ */` for the definition.
- Declare the recipe's slot and variant shapes in `{component}.style-types.ts`. Recipes must define every slot in `base`, including slots whose base class is empty.
- Resolve recipes in Solid components with `useRecipe()` from `src/theme/use-recipe.ts` (internal; not part of the public `moraine` entry). The API returns `{ slots, variants, slotWith, overrides }`. Components must destructure the return (`const { slots, variants, ... } = useRecipe(...)`) to avoid duplicate `resolved.slots` reads. Use the `overrides` helper to forward presentation to sub-components without manual slot mapping.
- **Spread slots directly:** Spread `{...slots.<slot>}` directly onto host elements or use `slotWith` / `overrides`.
- **Inline data attributes:** Call `*DataAttributes.*(...)` directly inside JSX spreads.
- **`useRecipe` layer order** (later wins). `cn` merges classes; style objects skip `undefined` / `null` so they do not overwrite earlier layers:
  1. Recipe base + variants/compound + Provider theme overrides (inside recipe resolve) + recipe CSS vars + `vars()`
  2. `contextSlots` — ancestor Context `{ classes, styles }` (use `pickSlotOverrides(props)` when storing on Context as `slotOverrides`)
  3. `own` — component-controlled, user-overridable (icon font-size, button active class, decorative item classes). Supports per-slot accessor map (`own: { leading: () => ({ class: ... }) }`) for fine-grained reactivity.
  4. User: `classes` / `styles`[slot], then `class` / `style` on the current `slot`
  5. `enforced` — functional, must not be user-overridable (positioning, virtual scroll, visually-hidden, flex sizes). Also supports per-slot accessor map.
- Prefer `enforced` for layout / position / virtualization and `own` for visual cosmetics. For per-item hosts inside `<For>`, call `slotWith(slot, extra?, enforcedExtra?)` (both extra arguments are accessors returning `{ class?, style? }`) under the item owner so item classes merge on top of the parent slot memo.
- **Fine-grained reactivity:** `useRecipe` compiles the theme-resolved recipe into per-slot contribution lists and a `slot → variantKeys` map (WeakMap-cached). Each slot's `.class` / `.style` is a lazy memo created on first read under the `useRecipe` owner; unread slots create nothing. Recipe classes and recipe variables are memoized separately from user and dynamic layers, and each layer (`own`, `enforced`, `contextSlots`) is isolated per slot with equality checks so that updates to one slot do not invalidate others. Class memos use string equality; style memos use shallow equality and reuse the previous object when equal. SSR (`isServer`) computes directly without memos.
- **Component CSS variables:** Define component-specific custom properties as recipe style keys, never as `[--name:value]` class utilities:
  1. Declare defaults on `base` / `variants` / `compoundVariants` as `'--name': value`.
  2. Consume them in slot or colocated classes with `prop-(--name)`.
  3. `useRecipe()` applies recipe keys to `varsSlot` (default `root`, or `slot` when the recipe has no root). Pass instance values with `vars: () => ({ '--name': value })` so the slot `style` binding already includes them. Do not rebuild that binding with `mergeProps` or a later `style={{ ...slots.<slot>.style, '--name': value }}`.
  4. Merge order on `varsSlot` is recipe keys, then `vars()`, then `contextSlots`, `own`, caller `styles` / `style`, then `enforced`. Per-item hosts (Accordion content) call `useRecipe` for that host with `vars()`. Private wrappers may inherit a root `vars()` value instead of adding a public slot. `element.style.setProperty` is only for imperative geometry on a node that is not updated through that binding (Floating UI).
     Theme engine variables (`--mo-enter-*`, `--mo-exit-*`, `--mo-anim-*`, `--mo-auto-*`) stay in `src/theme`. Do not add a public recipe slot solely to hold a private wrapper variable.
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
- **Functions:** camelCase (`createCollapsible`, `mergeProps`).
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`).
- **Types:** PascalCase (`CollapsibleProps`, `CollapsibleRoot`).
- **Private:** Prefix with `_` (`_internalState`, `_handleClick`).
- **Props:** If a component prop is a component (`(ctx: Context) => JSX.Element`, `Component<{ ctx: Context }>`), prop name must end with `Render` (`itemRender: <Component>`).

### Public Type Exports

- Component public types must be declared in the component namespace: `<Component>T`.
- Each public component namespace must declare `Kind` as the literal type `'single'` or `'composite'`. Use `'composite'` when the component exposes attached child components for composition; slot count and group naming do not determine the kind. `FormT.Kind` describes the bound `form.Form`, so it is `'single'`. Documentation reads this type to generate `component.kind`.
- Component namespaces should contain `Slot`, `Variant`, `Classes`, `Styles`, `Item`, `Base`, and `Props` as applicable.
- **Composite component contracts:**
  - `<namespace>T.Base` must be the only type containing configuration and behavioral options. Do not include `classes`, `styles`, or `variant` directly on `Base`; they are supplied via `BaseProps`.
  - `<namespace>T.Props` must never just be `= Base`; it must extend `BaseProps`.
    - Headless roots (roots without a primary host DOM element, e.g. `Popover`, `Dialog`, `Sheet`, `Tooltip`, `Modal`, `ContextMenu`, `DropdownMenu`, `BaseSelect`) use `BaseProps<never, Base, Variant, Classes, Styles, never>`. In `BaseProps`, a `never` default element omits `class` and `style`, accepting only slot maps `classes` and `styles`.
    - Element-rendering roots use `BaseProps<Tag, Base, Variant, Classes, Styles>`.
  - All attached child part props must be compose-only: `BaseProps<Tag, PartBase, never, never, never>`. Part bases (`ContentBase`, `TriggerBase`, `ItemBase`, etc.) must never take `classes`, `styles`, `variant`, or root configuration options (such as `restoreFocusOnClose`, `gutter`, `overflowPadding`, `onExitComplete`). Configuration belongs strictly on root `Base`/`Props`.
  - If a part or base interface has no unique configuration and would only have `children?: JSX.Element`, do not define a redundant single-member interface — use `FlowComponent` from `solid-js` for the component instead.
- Do not add an `Extend` namespace type. Inline inherited/extended prop sources into the namespace `Base` type and pass `never` as the extension argument to `BaseProps`.
- Top-level type export is only allowed for the component props type: `XxxProps` (must match the component name).
- Do not export other top-level component types such as `*RenderProps`, `*SlotProps`, `*VariantProps`, `*Value`, `*Item`, `*Context`.
- Prefer consuming component types as namespace members (for example, `SelectT.Option`, `FormT.SubmitEvent`).

### SolidJS Best Practices

- Always wrap `createEffect` callbacks with Solid's `on()`. Read non-triggering state inside the callback untracked.

- **Memos and accessors:** Use a plain accessor for a cheap primitive. Use `createMemo` when the derivation needs caching, reactive isolation, or a stable identity.
  1. A hook return, context value, or accessor passed to another reader is shared. Keep `createMemo` when that shared value is an object, array, JSX value, or a non-trivial computation.
  2. A cheap primitive with one consumer in the same owner is a plain accessor (`const closed = () => !open()`), not `createMemo`.
  3. Keep `createMemo` for a JSX prop read more than once, such as a condition and its render. A single render site reads the prop directly. Do not read a JSX-producing getter for a branch that is absent from the tree; that evaluation creates hydration keys for nodes that were never serialized.
  4. Do not read one field out of an object accessor through another accessor (`() => bag()['data-expanded']`) when a primitive accessor already exists (`open`, `closed`). Keep object bags such as `dataAttrs()` and `ariaAttrs()` when callers spread them.
  5. Read an object accessor once when several of its fields are used. Do not keep `createMemo` for an object that is only spread at one site: inline a short expression there, and use a plain accessor for a longer one-site derivation.
  6. `useRecipe` callbacks (`contextVariants`, `vars`, `contextSlots`, `own`, `enforced`) stay as accessors that return their contract object.

- Call components using JSX syntax (`<Component />`), never as direct functions.

- **Reactivity:** Never destructure props (e.g., `const { variant } = props` breaks reactivity).
- **Control Flow:** Use `<Show>`, `<For>`, `<Switch>/<Match>` instead of ternary operators or `.map()`.
- **Events:** Use UpperCase event names (`onClick`, `onInput`) on HTML elements.
- **DOM listeners:** Prefer `createEventListener` / `createEventListenerMap` from `src/shared/event-listener.ts` over raw `addEventListener`.
  1. Call them inside the Solid owner that should own the lifetime (`createEffect`, `onMount`, component setup, or a ref callback). They are not reactive: re-run them from `createEffect(on(target, ...))` when the target or options change.
  2. Use `createEventListenerMap` when attaching multiple events to the same target with the same options.
  3. Use `attachEventListener` / `attachEventListenerMap` only when the caller must hold or return the cleanup function (imperative register APIs, drag sessions, helpers that return `() => void`).
  4. Do not use either helper for JSX host events (`onClick`, `onInput`) or in tests that simulate or spy on the DOM. Do not call `addEventListener` / `removeEventListener` in library production code except inside `src/shared/event-listener.ts` and feature detects such as `typeof media.addEventListener === 'function'`.
- **Refs:** Use `ref={el => ...}` callback form or assignments, avoiding React-style ref objects where possible.
- **`{...rest}` attribute overload:** Solid JSX uses later-wins. On every public host, apply attributes in this order:
  1. Default attributes the component generates (`data-slot`, default `role`, generated `data-*` / `aria-*`).
  2. `{...rest}` so callers overload those defaults.
  3. Merged presentation (`{...slots.<slot>}` or `class`/`style` from `useRecipe` / `useCn`). Always split `class`, `style`, `classes`, and `styles` out of rest.
  4. Owned wiring rest must not replace: composed `ref`, form `id` / `name` / `value` / `checked` / `disabled` / `required` / `readOnly`, value-derived ARIA (`aria-valuenow`, `aria-checked`, `aria-pressed` when bound to the control value), and event handlers composed with `callHandler`.
     Split `??` fallback props such as i18n `aria-label` out of rest and assign `local['aria-label'] ?? messages().label` after rest. Do not reconstruct `data-slot` from rest after spreading it; put the default before rest. `mergeProps(defaults, rest, composedHandlers)` is the same rule.
- **`<Dynamic>`:** `component` must be the first attribute. Apply the `{...rest}` attribute overload order after it.
- **Imports:** Organize imports: external lib -> internal shared -> component files.
- **Internal Import Extensions:** Use explicit source extensions (`.ts` or `.tsx`) in `docs/build/**` and `**/*.config.ts`; omit extensions in `src/**` and `docs/**`.

### Styling (UnoCSS)

- **Utility First:** Use utility classes for 99% of styling.
- **Class Prop:** Always use `class` (not `className`).
- **Consistency:** Use `cn` to merge classes and `recipe` to define variants.
- **Style Prop:** Style prop must always be typed as `JSX.CSSProperties` (object); string style is strictly forbidden.

### Error Handling

- **Async:** Use `try/catch` block within async event handlers.
- **Boundaries:** Use `<ErrorBoundary>` for component-level error containment.
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
