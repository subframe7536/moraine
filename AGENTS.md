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

- `pnpm run lint` - Run oxlint with fix (fast linter based on oxc).
- `pnpm run format` - Format code using oxfmt.
- `pnpm run qa` - Run format, lint (with --fix), and typecheck together. **Run this before every commit.**

### Testing

- `pnpm run test` - Run all tests in once.
- `pnpm run test:dev` - Run tests in dev mode, watch file changes and rerun changed test.
- `pnpm run test <test-file>` - Run a single test file (e.g., `pnpm run test button.test.tsx`).
- **Note:** Tests use `jsdom` environment.

## Source Structure

The `src` directory is organized by component role and shared infrastructure:

```text
src/
├── index.ts                # Main public entry point; re-exports component categories and shared APIs.
├── theme.ts                # Public theme entry point.
├── styles.ts               # Public style-contract entry point.
├── utils.ts                # Public utility entry point.
├── virtualizer.ts          # Public virtual-list entry point.
├── element/                # Basic, non-form UI elements.
│   ├── accordion/          # Accordion primitives.
│   ├── avatar/             # Avatar and fallback display.
│   ├── badge/              # Badge styles and component.
│   ├── button/             # Button and button-like interactions.
│   ├── card/               # Card layout primitives.
│   ├── collapsible/        # Collapsible content primitives.
│   ├── icon/               # Icon rendering helpers and component.
│   ├── kbd/                # Keyboard shortcut display.
│   ├── list/               # List and list-item primitives.
│   ├── progress/           # Progress indicators.
│   ├── resizable/          # Resizable panels and interaction hooks.
│   └── separator/          # Visual separators.
├── form/                   # Form controls and form-state integration.
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
├── tailwind/               # Tailwind integration.
├── test-utils/             # SSR, owner, overlay, and global test utilities.
├── theme/                  # Theme configuration, contracts, and creation primitives.
│   └── style/              # Class merging, recipe definitions, tokens, and shared style utilities.
└── unocss/                 # UnoCSS integration and preset helpers.
```

Component directories normally contain implementation (`{component}.tsx` and any colocated part or context files), a recipe (`{component}.recipe.ts`), style types (`{component}.style-types.ts`), public types (`{component}.types.ts`), tests, SSR fixtures/tests, and an `index.ts` barrel. Reusable static classes belong in a colocated or feature-level `*.class.ts` file. Keep component-specific behavior inside its role directory; move logic to `shared` only when it is used by multiple component families. `base` directories provide internal primitives for higher-level components and are not automatically public API.

## Style Implementation Details

- Define each component's declarative, themeable presentation in `{component}.recipe.ts` with `defineRecipe()` from `src/theme/style/recipe.ts`. Export it as `{component}Recipe`; use `/* @__PURE__ */` for the definition.
- Declare the recipe's slot and variant shapes in `{component}.style-types.ts`. Recipes must define every slot in `base`, including slots whose base class is empty.
- Resolve recipes in Solid components with `createStyles()` from `src/provider/create-styles.ts`. Use the returned stable `styles.<slot>.class` and `styles.<slot>.style` bindings directly; do not add memos solely for class or style resolution.
- Put truly reusable static class values in a `*.class.ts` file and export constants in `UPPER_SNAKE_CASE` (for example, `TEXT_CONTROL_CLASS`). Do not create a recipe for static-only styling.
- Use recipe variants for public component variants and cross-slot presentation changes. Express DOM state with utility selectors such as `data-expanded:` or `aria-disabled:` instead of adding a recipe variant solely for internal state.
- Capture `useCn()` during component initialization only when combining classes outside `createStyles()`. Pass `Cn` explicitly to plain rendering helpers; use static `cn` or `createCn` for owner-independent utilities.
- Parenthesized utility groups are supported in recipe and class files (for example, `hover:(bg-red-500 text-white)`). Use standard flat utility syntax elsewhere.

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
- Do not add an `Extend` namespace type. Inline inherited/extended prop sources into the namespace `Base` type and pass `never` as the extension argument to `BaseProps`.
- Top-level type export is only allowed for the component props type: `XxxProps` (must match the component name).
- Do not export other top-level component types such as `*RenderProps`, `*SlotProps`, `*VariantProps`, `*Value`, `*Item`, `*Context`.
- Prefer consuming component types as namespace members (for example, `SelectT.Option`, `FormT.SubmitEvent`).

### SolidJS Best Practices

- Always wrap `createEffect` callbacks with Solid's `on()` and declare their reactive dependencies explicitly. Keep dependency accessors free of side effects. Use `on([], callback)` for effects with no reactive dependencies. Reuse the dependency values passed to `on()` callbacks instead of reading the same dependencies again; retain fresh reads when asynchronous work or user callbacks require the latest state.

- Effect dependencies must be signals, existing memos, direct property accessors, boolean condition accessors, or named accessors that snapshot raw nested fields. Prefer boolean accessors when the effect only needs an enabled/open/closed condition; reuse existing boolean helpers when available. Keep raw value and element dependencies when value changes or node replacement must rerun the effect. Keep filtering, lookups, normalization, comparisons, and defaults inside the effect callback unless they directly express its boolean condition. Do not construct conditional tuples, state wrapper objects, or synthetic `undefined` values to skip an effect. Optional properties may naturally be `undefined`. Raw snapshots may copy structure and fields to track in-place updates, but must not contain business logic.

- The dependencies passed to `on()` describe when an effect must rerun, not every reactive value it uses. Read non-triggering state inside the callback, which is already untracked.

- **Reactivity:** Never destructure props (e.g., `const { variant } = props` breaks reactivity).
- **Control Flow:** Use `<Show>`, `<For>`, `<Switch>/<Match>` instead of ternary operators or `.map()`.
- **Events:** Use UpperCase event names (`onClick`, `onInput`) on HTML elements.
- **Refs:** Use `ref={el => ...}` callback form or assignments, avoiding React-style ref objects where possible.
- **Imports:** Organize imports: external lib -> internal shared -> component files.
- **Internal Import Extensions:** Relative and `@src` imports must use the source file extension (`.ts` or `.tsx`). Never use emitted `.js` or `.jsx` extensions in source code.

### Styling (UnoCSS)

- **Utility First:** Use utility classes for 99% of styling.
- **Class Prop:** Always use `class` (not `className`).
- **Consistency:** Use `cn` to merge classes and `recipe` to define variants.
- **Style Prop:** Style prop must always be typed as `JSX.CSSProperties` (object). String style (`string | JSX.CSSProperties`) is strictly forbidden across all component props, slots, and element wrappers. Narrow native HTML element props using `ElementProps` or `Omit<JSX.HTMLAttributes<...>, 'style'> & { style?: JSX.CSSProperties }`. Do not write defensive runtime guards like `typeof style === 'object'` or `toStyleObject()` assuming style could be a string.

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
