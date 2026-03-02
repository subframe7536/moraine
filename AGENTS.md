# AGENTS.md

This file contains definitive guidelines for agentic coding agents working on Rock UI, a SolidJS component library that ports Nuxt UI behavior and uses `zaidan/` as the style/base component source.
Agents must follow these instructions to ensure consistency, quality, and maintainability.

Current stage: pre-alpha. breaking change allowed.

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

This project ports logic from **Nuxt UI** and ports style/base component structure from **Zaidan** (`zaidan/`).

### 0. Migration Principle (Zaidan/Shadcn)

- Follow Zaidan/Shadcn composition principles first: reuse existing component structure and behavior whenever possible.
- Port that reused base into a Rock **Nuxt-UI-level sealed component** (stable Rock API surface; implementation details remain internal).
- Verify behavior with tests and in the playground before final style cleanup.
- Inline/adapt styles only after behavior is sealed and verified.

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
  - Use **Zaidan** component implementations in `zaidan/src/registry/kobalte/ui/*.tsx` as the first base reference.
  - If Zaidan has no equivalent pattern, use **@kobalte/core** primitives directly for accessibility-heavy interactions.
  - If Nuxt UI has custom a11y logic not covered by either, port it manually.

### 2. Style + Base Component: Porting from Zaidan

- **Source:** Refer to `zaidan/src/registry/kobalte/ui/*.tsx` for style and base component structure.
- **Goal:** Replicate the visual/slot structure using **UnoCSS** and **cva** in Rock.
- **Implementation:**
  - Create a `{component}.class.ts` file.
  - Use `cva` from `cls-variant/cva` to define variants.
  - Copy class/composition patterns from Zaidan, but adapt them to UnoCSS.
  - Use UnoCSS variant groups for cleaner code: `hover:(bg-red-500 text-white)` instead of `hover:bg-red-500 hover:text-white`.
  - Ensure `size` and `variant` props match the Zaidan design system structure where applicable.
  - **Do not** import implementation files directly from `zaidan/`; copy/adapt logic and classes into Rock files.

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
- NEVER use `cva()` with static-only classes

### Testing

- **File Name:** `*.test.tsx`.
- **Library:** `@solidjs/testing-library` for rendering and interaction.
- **Coverage:** Aim to test standard usage, edge cases, and accessibility (aria attributes).
- **Snapshot:** Use inline snapshots for small DOM structures, but prefer explicit assertions.

## Before Making Changes

1. **Analyze:** Read the corresponding `nuxt-ui` logic and `zaidan` style/base component files.
2. **Plan:** Identify which `zaidan/src/registry/kobalte/ui/*` component pattern (or fallback `@kobalte/core` primitive) fits best, and define the sealed Nuxt-UI-level Rock API.
3. **Implement (reuse-first):** Reuse/adapt the base component behavior in `.tsx` first.
4. **Verify behavior:** Write/execute `*.test.tsx` and verify interaction in playground via `bun run play`.
5. **Inline styles:** Finalize `.class.ts` and slot-level style inlining after behavior is verified.
6. **QA:** Run `bun run qa` to ensure formatting and linting pass.
