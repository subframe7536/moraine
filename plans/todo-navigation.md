# TODO: Navigation Components (8)

PORT DETAILS: `./nuxt-ui-port-plan.md`

## Execution Policy

- This file is the single source of truth for navigation scope, order, and status.
- Work only active items in phased order; do not parallelize unrelated navigation implementations.
- Keep `(SKIP)` items tracked but out of active delivery phases.
- Do not mark a component complete until implementation, tests, and exports are all done.

## Scope Snapshot (2026-02-23)

- Total scoped components: `8`
- Active delivery scope: `4` (`breadcrumb`, `navigation-menu`, `pagination`, `tabs`)
- Skip scope: `4` (`command-palette`, `footer-columns`, `link`, `stepper`)
- Completed: `4` (`breadcrumb`, `navigation-menu`, `pagination`, `tabs`)

## Component Source Map (Nuxt Logic + Zaidan Base)

- [x] breadcrumb | nuxt:nuxt-ui/src/runtime/components/Breadcrumb.vue | zaidan:zaidan/src/registry/kobalte/ui/breadcrumb.tsx | rock:src/breadcrumb/ | tests+exports
- [ ] (SKIP) command-palette | nuxt:nuxt-ui/src/runtime/components/CommandPalette.vue | zaidan:zaidan/src/registry/kobalte/ui/command.tsx | rock:src/command-palette/ | tests+exports
- [ ] (SKIP) footer-columns | nuxt:nuxt-ui/src/runtime/components/FooterColumns.vue | zaidan:zaidan/src/registry/kobalte/ui/sidebar.tsx + zaidan/src/registry/kobalte/ui/item.tsx | rock:src/footer-columns/ | tests+exports
- [ ] (SKIP) link | nuxt:nuxt-ui/src/runtime/components/Link.vue | zaidan:zaidan/src/registry/kobalte/ui/button.tsx | rock:src/link/ | tests+exports
- [x] navigation-menu | nuxt:nuxt-ui/src/runtime/components/NavigationMenu.vue | zaidan:zaidan/src/registry/kobalte/ui/navigation-menu.tsx | rock:src/navigation-menu/ | tests+exports
- [x] pagination | nuxt:nuxt-ui/src/runtime/components/Pagination.vue | zaidan:zaidan/src/registry/kobalte/ui/pagination.tsx | rock:src/pagination/ | tests+exports
- [ ] (SKIP) stepper | nuxt:nuxt-ui/src/runtime/components/Stepper.vue | zaidan:zaidan/src/registry/kobalte/ui/tabs.tsx + zaidan/src/registry/kobalte/ui/progress.tsx | rock:src/stepper/ | tests+exports
- [x] tabs | nuxt:nuxt-ui/src/runtime/components/Tabs.vue | zaidan:zaidan/src/registry/kobalte/ui/tabs.tsx | rock:src/tabs/ | tests+exports

## File Reference Map

### Breadcrumb

- Nuxt logic: `nuxt-ui/src/runtime/components/Breadcrumb.vue`
- Zaidan base: `zaidan/src/registry/kobalte/ui/breadcrumb.tsx`
- Rock implementation:
  - `src/breadcrumb/breadcrumb.tsx`
  - `src/breadcrumb/breadcrumb.class.ts`
  - `src/breadcrumb/breadcrumb.test.tsx`
  - `src/breadcrumb/index.ts`
- Root export: `src/index.ts`

### Navigation Menu

- Nuxt logic: `nuxt-ui/src/runtime/components/NavigationMenu.vue`
- Zaidan base: `zaidan/src/registry/kobalte/ui/navigation-menu.tsx`
- Rock implementation:
  - `src/navigation-menu/navigation-menu.tsx`
  - `src/navigation-menu/navigation-menu.class.ts`
  - `src/navigation-menu/navigation-menu.test.tsx`
  - `src/navigation-menu/index.ts`
- Root export: `src/index.ts`

### Pagination

- Nuxt logic: `nuxt-ui/src/runtime/components/Pagination.vue`
- Zaidan base: `zaidan/src/registry/kobalte/ui/pagination.tsx`
- Rock implementation:
  - `src/pagination/pagination.tsx`
  - `src/pagination/pagination.class.ts`
  - `src/pagination/pagination.test.tsx`
  - `src/pagination/index.ts`
- Root export: `src/index.ts`

### Tabs

- Nuxt logic: `nuxt-ui/src/runtime/components/Tabs.vue`
- Zaidan base: `zaidan/src/registry/kobalte/ui/tabs.tsx`
- Rock implementation:
  - `src/tabs/tabs.tsx`
  - `src/tabs/tabs.class.ts`
  - `src/tabs/tabs.test.tsx`
  - `src/tabs/index.ts`
- Root export: `src/index.ts`

### Skip References

- Command palette:
  - `nuxt-ui/src/runtime/components/CommandPalette.vue`
  - `zaidan/src/registry/kobalte/ui/command.tsx`
  - target when resumed: `src/command-palette/`
- Footer columns:
  - `nuxt-ui/src/runtime/components/FooterColumns.vue`
  - `zaidan/src/registry/kobalte/ui/sidebar.tsx`
  - `zaidan/src/registry/kobalte/ui/item.tsx`
  - target when resumed: `src/footer-columns/`
- Link:
  - `nuxt-ui/src/runtime/components/Link.vue`
  - `zaidan/src/registry/kobalte/ui/button.tsx`
  - target when resumed: `src/link/`
- Stepper:
  - `nuxt-ui/src/runtime/components/Stepper.vue`
  - `zaidan/src/registry/kobalte/ui/tabs.tsx`
  - `zaidan/src/registry/kobalte/ui/progress.tsx`
  - target when resumed: `src/stepper/`

## Delivery Phases (Active Scope Only)

### P1 - Breadcrumb + Tabs

- `breadcrumb` and `tabs` implemented with tests and exports.

### P2 - Pagination

- `pagination` implemented with Kobalte pagination root math and controls.

### P3 - Navigation Menu

- `navigation-menu` implemented with Kobalte horizontal flow and accordion vertical flow.

### P4 - Navigation QA Sweep

- Commands:
  - `bun run test --run src/breadcrumb/breadcrumb.test.tsx`
  - `bun run test --run src/pagination/pagination.test.tsx`
  - `bun run test --run src/tabs/tabs.test.tsx`
  - `bun run test --run src/navigation-menu/navigation-menu.test.tsx`
  - `bun run typecheck`
  - `bun run qa`

## Definition Of Done (Per Active Component)

- `src/<component>/<component>.tsx` implemented.
- `src/<component>/<component>.class.ts` implemented.
- `src/<component>/<component>.test.tsx` implemented.
- `src/<component>/index.ts` implemented.
- root export added in `src/index.ts`.
- targeted tests pass for the component.

## Status Tracker

### Phase Tracker

- [x] P1 complete (`breadcrumb`, `tabs`)
- [x] P2 complete (`pagination`)
- [x] P3 complete (`navigation-menu`)
- [x] P4 complete (`targeted tests`, `typecheck`, `qa`)

### Component Tracker

| Component         | Source Audit | API Contract | TSX | Class | Tests | Local Export | Root Export | Status   |
| ----------------- | ------------ | ------------ | --- | ----- | ----- | ------------ | ----------- | -------- |
| `breadcrumb`      | [x]          | [x]          | [x] | [x]   | [x]   | [x]          | [x]         | complete |
| `navigation-menu` | [x]          | [x]          | [x] | [x]   | [x]   | [x]          | [x]         | complete |
| `pagination`      | [x]          | [x]          | [x] | [x]   | [x]   | [x]          | [x]         | complete |
| `tabs`            | [x]          | [x]          | [x] | [x]   | [x]   | [x]          | [x]         | complete |
| `command-palette` | [ ]          | [ ]          | [ ] | [ ]   | [ ]   | [ ]          | [ ]         | SKIP     |
| `footer-columns`  | [ ]          | [ ]          | [ ] | [ ]   | [ ]   | [ ]          | [ ]         | SKIP     |
| `link`            | [ ]          | [ ]          | [ ] | [ ]   | [ ]   | [ ]          | [ ]         | SKIP     |
| `stepper`         | [ ]          | [ ]          | [ ] | [ ]   | [ ]   | [ ]          | [ ]         | SKIP     |

### Change Log

- 2026-02-23: re-scoped navigation to active 4 (`breadcrumb`, `navigation-menu`, `pagination`, `tabs`) and skip 4 (`command-palette`, `footer-columns`, `link`, `stepper`).
- 2026-02-23: implemented `src/breadcrumb/`, `src/navigation-menu/`, `src/pagination/`, and `src/tabs/` with tests and root exports.
- 2026-02-23: active component targeted tests pass; `bun run typecheck` and `bun run qa` pass.
