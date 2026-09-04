# AGENTS.md

This file contains definitive guidelines for agentic coding agents working on Moraine, a SolidJS component library that provide comprehensive components, reference from Nuxt UI and Shadcn.
Agents must follow these instructions to ensure consistency, quality, and maintainability.

Current stage: pre-alpha. breaking change allowed.

## Essential Commands

Use `nub` for package management and script execution. Prefer `nub` / `nubx` over `node`, `bun`, `npm`, `npx`, `pnpm`, and `yarn`.

If not installed, follows the instructions at https://nubjs.com/start.md to install.

### Build & Development

- `nub run build` - Build the library using tsdown (outputs to dist/).
- `nub run dev` - Build in watch mode for development.
- `nub run docs` - Start the dev Vite server on port 3000.
- `nub run typecheck` - Run TypeScript type checking.

### Linting & Formatting

- `nub run lint` - Run oxlint with fix (fast linter based on oxc).
- `nub run format` - Format code using oxfmt.
- `nub run qa` - Run format, lint (with --fix), and typecheck together. **Run this before every commit.**

### Testing

- `nub run test` - Run all tests in once.
- `nub run test:dev` - Run tests in dev mode, watch file changes and rerun changed test.
- `nub run test <test-file>` - Run a single test file (e.g., `nub run test button.test.tsx`).
- **Note:** Tests use `jsdom` environment.

## Source Structure

The `src` directory is organized by component role and shared infrastructure:

```text
src/
├── index.ts             # Public package entry point; re-exports all components and utilities.
├── utils.ts              # Public utility entry point.
├── elements/             # Basic, non-form UI elements.
│   ├── accordion/         # Accordion primitives.
│   ├── avatar/            # Avatar and fallback display.
│   ├── badge/             # Badge styles and component.
│   ├── button/            # Button and button-like interactions.
│   ├── card/              # Card layout primitives.
│   ├── collapsible/       # Collapsible content primitives.
│   ├── icon/              # Icon rendering helpers and component.
│   ├── kbd/               # Keyboard shortcut display.
│   ├── list/              # List and list-item primitives.
│   ├── progress/          # Progress indicators.
│   ├── resizable/         # Resizable panels and interaction hooks.
│   └── separator/         # Visual separators.
├── forms/                 # Form controls and form-state integration.
│   ├── checkbox/          # Checkbox control.
│   ├── checkbox-group/    # Checkbox group control.
│   ├── file-upload/       # File upload control and dropzone behavior.
│   ├── form/              # Form root, field wrapper, submission, and context.
│   ├── input/             # Text input control.
│   ├── input-number/      # Numeric input control.
│   ├── radio-group/       # Radio group control.
│   ├── select/             # Select, multi-select, and shared select behavior.
│   ├── slider/             # Slider control and slider hooks.
│   ├── switch/             # Switch control.
│   ├── textarea/           # Textarea control.
│   └── shared/             # Form-specific hooks and helpers.
├── navigation/            # Navigation and page-organization components.
│   ├── breadcrumb/         # Breadcrumb navigation.
│   ├── command-palette/    # Command palette behavior and presentation.
│   ├── pagination/         # Pagination controls.
│   ├── sidebar-frame/      # Responsive sidebar layout.
│   ├── stepper/            # Step-based navigation.
│   └── tabs/               # Tab navigation.
├── overlays/              # Layered, floating, and dismissible UI.
│   ├── base/               # Shared overlay and menu behavior.
│   ├── context-menu/       # Context menu.
│   ├── dialog/             # Dialog primitives.
│   ├── dropdown-menu/      # Dropdown menu.
│   ├── modal/              # Modal composition.
│   ├── popover/            # Popover.
│   ├── sheet/              # Side or bottom sheet.
│   └── tooltip/            # Tooltip.
├── shared/                # Reusable internals that are not public components.
│   ├── style/              # Shared style tokens, animations, and icon styles.
│   ├── testing/            # Shared testing helpers.
│   └── type-test/           # Type-level compatibility tests.
├── test-utils/             # SSR, owner, overlay, and global test utilities.
├── unocss/                 # UnoCSS integration and preset helpers.
└── tailwind/               # Tailwind integration and generated style helpers.
```

Component directories normally contain the implementation (`{component}.tsx`), styles (`{component}.class.ts`), tests, and an `index.ts` barrel. Keep component-specific behavior inside its role directory; move logic to `shared` only when it is reused by multiple component families. `base` directories provide internal primitives for higher-level components and are not automatically public API.

## Style Implementation Details

- Create a `{component}.class.ts` file.
- Reusable constant class should define as `*_CLASS` global variable
- Use `recipe` from `src/shared/style/recipe.ts` to define variants.
- Use `cn` from `src/shared/utils` to combine classes.
- No need to create memo for classes, just write them inplace
- State-based class should use a pure class instead of adding a new variant in `recipe`.
- Always use standard flat Tailwind CSS utility syntax (e.g. `hover:bg-red-500 hover:text-white`). NEVER use UnoCSS parenthesized variant groups (`hover:(...)`) in component code so classes are compatible with both Tailwind v4 and UnoCSS, and can be parsed by the `cn` conflict resolution engine.

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
- Component namespaces should contain `Slot`, `Variant`, `Classes`, `Styles`, `Item`, `Base`, and `Props` as applicable.
- Do not add an `Extend` namespace type. Inline inherited/extended prop sources into the namespace `Base` type and pass `never` as the extension argument to `BaseProps`.
- Top-level type export is only allowed for the component props type: `XxxProps` (must match the component name).
- Do not export other top-level component types such as `*RenderProps`, `*SlotProps`, `*VariantProps`, `*Value`, `*Item`, `*Context`.
- Prefer consuming component types as namespace members (for example, `SelectT.Option`, `FormT.SubmitEvent`).

### SolidJS Best Practices

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

- For common Combobox component, use Select component via `search` prop
- For tag input, use MultiSelect component
