# Nuxt UI Port Plan: Layout + Element + Form + Navigation + Overlay

## Summary

This planning set defines how Rock UI will port Nuxt UI components for the following categories only:

- `layout`
- `element`
- `form`
- `navigation`
- `overlay`

Total scoped components: `58` (`7 + 16 + 19 + 8 + 8`).

Hard constraints:

- icon handling must not be tied to `<svg />`
- Coss complex variable-heavy class patterns must be simplified
- Decompose embeded icon if possible, like `Avatar` / `Chip`
- Port coss class first.
- Remove `props.class`, use `props.classes.root`

## Scope

In scope:

- components categorized as `layout`, `element`, `form`, `navigation`, `overlay` in `nuxt-ui/docs/content/docs/2.components/*.md`
- component implementation files, style files, tests, and exports

Out of scope:

- all other Nuxt UI categories (`data`, `page`, `dashboard`, `chat`, `editor`, `content`, `color-mode`, `i18n`, etc.)
- playground additions for this planning batch

## Source Of Truth

- Logic source: `nuxt-ui/src/runtime/components/<PascalCase>.vue`
- Category/doc source: `nuxt-ui/docs/content/docs/2.components/*.md`
- Real dependency graph source for scoped components: `plans/nuxt-ui-real-dependency-graph.md`

## Rock Component Structure Rule

Each component must follow:

- `src/<kebab>/<kebab>.tsx`
- `src/<kebab>/<kebab>.class.ts`
- `src/<kebab>/<kebab>.test.tsx`
- `src/<kebab>/index.ts`
- export from `src/index.ts`

## Solid Reactivity Rules For Ports

agent MUST follows [port rules](./rules.md)

## Style Sourcing Rule

Primary:

- Use same-name file in `coss/packages/ui/src/components/<name>.tsx` when available.

Fallback:

- Use the alias map below for nearest style seed.

Final fallback:

- Use Rock shared tokens/utilities and Uno classes when no suitable Coss seed exists.

## Icon Policy (Non-SVG-Bound)

All icon-capable components should support:

- string icon class names (Uno icon syntax)
- component nodes/elements
- render functions

Disallowed patterns:

- selectors that couple styles to SVG descendants, including patterns like `[&_svg...]`

## Coss Simplification Policy

Do not port:

- complex variable arithmetic like `calc(var(...))`
- `--theme(...)`-style deep variable chains
- deep selector chains that reduce readability/maintainability

Do port:

- clear `cva` variant matrices
- straightforward utility classes
- UnoCSS variant group syntax (for example `hover:(bg-primary text-white)` and `data-[state=open]:(opacity-100 scale-100)`) to reduce class duplication; variant groups are transformed during build time
- accessible interaction states

## Kobalte Default Policy

- Prefer Kobalte primitives for accessibility-heavy interactions.
- Layout-only components may use semantic HTML + Solid state/context as needed.

## Fixed Execution Order

1. `layout`
2. `element` (with `icon` last)
3. `form`
4. `navigation`
5. `overlay`

## Public API / Type Additions Expected

- Export all 58 components from `src/index.ts`.
- Export `...Props` for each component.
- Export `...VariantProps` when component uses `cva` variants.
- Introduce and standardize icon prop typing that is not SVG-coupled.

## Required Test Scenarios

1. **Port ALL test suite from nuxt-ui**
2. Baseline render + accessibility assertions for every component.
3. Keyboard/state behavior for interactive primitives.
4. Controlled and uncontrolled behavior where applicable.
5. Overlay lifecycle behavior (open/close/dismiss/portal) where applicable.
6. Icon rendering for string and component icons without SVG-coupled selectors.

## Acceptance Criteria

- All 58 scoped components are implemented with logic + styles + tests + exports.
- `bun run test --run` passes.
- `bun run typecheck` passes.

## Coss Style Alias Map

| Nuxt Component    | Coss Seed                                       |
| ----------------- | ----------------------------------------------- |
| `command-palette` | `command.tsx`                                   |
| `modal`           | `dialog.tsx`                                    |
| `drawer`          | `sheet.tsx`                                     |
| `slideover`       | `sheet.tsx`                                     |
| `dropdown-menu`   | `menu.tsx`                                      |
| `context-menu`    | `menu.tsx`                                      |
| `navigation-menu` | `menu.tsx`                                      |
| `input-number`    | `number-field.tsx`                              |
| `input-menu`      | `combobox.tsx`                                  |
| `select-menu`     | `combobox.tsx`                                  |
| `input-tags`      | `combobox.tsx`                                  |
| `form-field`      | `field.tsx`                                     |
| `field-group`     | `fieldset.tsx`                                  |
| `footer-columns`  | `sidebar.tsx` (tokens/layout inspiration only)  |
| `theme`           | `shared/mode-switcher.tsx`                      |
| `app`             | `frame.tsx`                                     |
| `container`       | `frame.tsx`                                     |
| `header`          | `frame.tsx`                                     |
| `footer`          | `frame.tsx`                                     |
| `main`            | `frame.tsx`                                     |
| `error`           | `empty.tsx`                                     |
| `banner`          | `alert.tsx`                                     |
| `chip`            | `badge.tsx`                                     |
| `calendar`        | `select.tsx` + `popover.tsx` (visual seed only) |
| `color-picker`    | `select.tsx` + `popover.tsx` (visual seed only) |
| `file-upload`     | `input.tsx`                                     |
| `input-date`      | `input.tsx` + `popover.tsx`                     |
| `input-time`      | `input.tsx`                                     |
| `pin-input`       | `input.tsx`                                     |
| `stepper`         | `tabs.tsx` + `progress.tsx`                     |
| `link`            | `button.tsx` (link variant behavior)            |
| `icon`            | no Coss dependency (Rock-owned)                 |

## Assumptions Locked

- Hybrid planning split: one master plan + category TODO files.
- Definition of done per component is logic + styles + tests + exports.
- No playground additions in this planning batch.
- Styling is Coss-inspired, not Coss-locked.
