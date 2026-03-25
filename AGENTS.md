# AGENTS.md

This file contains definitive guidelines for agentic coding agents working on Flint UI, a SolidJS component library that provide comprehensive components, reference from Nuxt UI and Shadcn.
Agents must follow these instructions to ensure consistency, quality, and maintainability.

Current stage: pre-alpha. breaking change allowed.

## Essential Commands

Use `bun` for all package management and script execution.

### Build & Development

- `bun run build` - Build the library using tsdown (outputs to dist/).
- `bun run dev` - Build in watch mode for development.
- `bun run docs` - Start the dev Vite server on port 3000.
- `bun run typecheck` - Run TypeScript type checking.

### Linting & Formatting

- `bun run lint` - Run oxlint (fast linter based on oxc).
- `bun run format` - Format code using oxfmt.
- `bun run qa` - Run format, lint (with --fix), and typecheck together. **Run this before every commit.**

### Testing

- `bun run test` - Run all tests using Vitest (watch mode by default).
- `bun run test --run` - Run tests once (CI mode).
- `bun run test <test-file>` - Run a single test file (e.g., `bun run test button.test.tsx`).
- **Note:** Tests use `jsdom` environment.

## Style Implementation Details

- Create a `{component}.class.ts` file.
- Reusable constant class should define as `*_CLASS` global variable
- Use `cva` from `cls-variant/cva` to define variants.
- Use `cn` from `src/shared/utils` to combine classes.
- No need to create memo for classes, just write them inplace
- State-based class should use pure class instead of adding a newn variant in cva
- Use UnoCSS variant groups for cleaner code: `hover:(bg-red-500 text-white)` instead of `hover:bg-red-500 hover:text-white`.

## Code Style & Conventions

### Naming

- **Components:** PascalCase (`Button`, `CollapsibleContent`).
- **Files:** kebab-case (`button.tsx`, `collapsible-content.tsx`).
- **Functions:** camelCase (`createCollapsible`, `mergeProps`).
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`).
- **Types:** PascalCase (`CollapsibleProps`, `CollapsibleRoot`).
- **Private:** Prefix with `_` (`_internalState`, `_handleClick`).

### Public Type Exports

- Component public types must be declared in the component namespace: `<Component>T`.
- Top-level type export is only allowed for the component props type: `XxxProps` (must match the component name).
- Do not export other top-level component types such as `*RenderProps`, `*SlotProps`, `*VariantProps`, `*Value`, `*Item`, `*Context`.
- Prefer consuming component types as namespace members (for example, `SelectT.Option`, `FormT.SubmitEvent`).

### SolidJS Best Practices

- **Reactivity:** Never destructure props (e.g., `const { variant } = props` breaks reactivity).
- **Control Flow:** Use `<Show>`, `<For>`, `<Switch>/<Match>` instead of ternary operators or `.map()`.
- **Events:** Use lowercase event names (`onclick`, `oninput`) on HTML elements.
- **Refs:** Use `ref={el => ...}` callback form or assignments, avoiding React-style ref objects where possible.
- **Imports:** Organize imports: external lib -> internal shared -> component files.

### Styling (UnoCSS)

- **Utility First:** Use utility classes for 99% of styling.
- **Class Prop:** Always use `class` (not `className`).
- **Consistency:** Use the `cn` (classnames) utility or `cva` to merge classes.

### Error Handling

- **Async:** Use `try/catch` block within async event handlers.
- **Boundaries:** Use `<ErrorBoundary>` for component-level error containment.
- **Types:** Avoid `any`. Use `unknown` if type is truly uncertain, then narrow it.
- NEVER use `cva()` with static-only classes

### Testing

- **File Name:** `*.test.tsx`.
- **Library:** `@solidjs/testing-library` for rendering and interaction.
- **Coverage:** Aim to test standard usage, edge cases, and accessibility (aria attributes).
- **Snapshot:** Use inline snapshots for small DOM structures, but prefer explicit assertions.
