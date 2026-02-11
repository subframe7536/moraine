# AGENTS.md

This file contains definitive guidelines for agentic coding agents working on Rock UI, a SolidJS component library based on Kobalte.
Agents must follow these instructions to ensure consistency, quality, and maintainability.

## Essential Commands

Use `bun` for all package management and script execution.

### Build & Development

- `bun run build` - Build the library using tsdown (outputs to dist/).
- `bun run dev` - Build in watch mode for development.
- `bun run play` - Start the Vite playground server on port 3000.
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

## Project Structure

Follow this directory structure strictly:

```
src/
  index.ts           # Main entry point, exports all components
  button/            # Component directory (kebab-case if multi-word)
    index.ts         # Component exports
    button.tsx       # Component logic & markup (SolidJS)
    button.class.ts  # Component styles (cva/UnoCSS)
    button.test.tsx  # Component tests (Vitest)
playground/          # Dev playground with examples
```

## Porting Guidelines

This project ports logic from **Nuxt UI** and styles from **Coss**. Base component lib is **@kobalte/core**, but not stick to it.

### 1. Logic: Porting from Nuxt UI

- **Source:** Refer to `nuxt-ui/src/runtime/components/*.vue` for component logic.
- **Goal:** Adapt Vue 3 Composition API logic to SolidJS 1.0+ signals/effects.
- **Mapping:**
  - `ref(x)` -> `createSignal(x)`
  - `computed(() => ...)` -> `createMemo(() => ...)`
  - `watch(() => ...)` -> `createEffect(() => ...)`
  - `provide`/`inject` -> `createContext` / `useContext`
  - `onMounted` -> `onMount`
  - `defineProps` -> TypeScript interface + `mergeProps`
- **Async Handlers:**
  - Nuxt UI often uses async click handlers with auto-loading state.
  - Port this pattern using `createSignal` for loading states inside the event handler.
  - **Do not** use `async` components (SolidJS components are synchronous setup functions).
- **Accessibility:**
  - Use **Kobalte** primitives where possible to handle complex accessibility logic (e.g., Tabs, Dialogs).
  - If Nuxt UI has custom a11y logic not covered by Kobalte, port it manually.

### 2. Style: Porting from Coss

- **Source:** Refer to `coss/packages/ui/src/components/*.tsx` for visual design.
- **Goal:** Replicate the visual style using **UnoCSS** and **cva**.
- **Implementation:**
  - Create a `{component}.class.ts` file.
  - Use `cva` from `cls-variant/cva` to define variants.
  - Copy class names from Coss, but adapt them to UnoCSS.
  - Use UnoCSS variant groups for cleaner code: `hover:(bg-red-500 text-white)` instead of `hover:bg-red-500 hover:text-white`.
  - Ensure `size` and `variant` props match the Coss design system structure.
  - **Do not** import styles directly from the `coss` folder; copy the logic/classes.

## Code Style & Conventions

### Naming

- **Components:** PascalCase (`Button`, `CollapsibleContent`).
- **Files:** kebab-case (`button.tsx`, `collapsible-content.tsx`).
- **Functions:** camelCase (`createCollapsible`, `mergeProps`).
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`).
- **Types:** PascalCase (`CollapsibleProps`, `CollapsibleRoot`).
- **Private:** Prefix with `_` (`_internalState`, `_handleClick`).

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

### Testing

- **File Name:** `*.test.tsx`.
- **Library:** `@solidjs/testing-library` for rendering and interaction.
- **Coverage:** Aim to test standard usage, edge cases, and accessibility (aria attributes).
- **Snapshot:** Use inline snapshots for small DOM structures, but prefer explicit assertions.

## Before Making Changes

1. **Analyze:** Read the corresponding `nuxt-ui` logic and `coss` style files.
2. **Plan:** Identify which Kobalte primitive fits best.
3. **Implement:** Create the `.tsx` and `.class.ts` files.
4. **Test:** Write a `*.test.tsx` file and run `bun run test <file>`.
5. **QA:** Run `bun run qa` to ensure formatting and linting pass.
