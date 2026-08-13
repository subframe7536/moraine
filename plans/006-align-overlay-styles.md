# Plan 006: Align overlay surfaces, menus, and transitions

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If a STOP condition occurs,
> stop and report; do not improvise. Update this plan's row in `plans/README.md` when
> finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- src/overlays src/forms/select src/navigation/sidebar-frame src/elements/card src/elements/button src/elements/kbd src/shared/style src/unocss src/tailwind style-parity-matrix.md`.
> Plans 001–005 are expected to change the matrix and consumers. Re-read the final Card,
> Button, Kbd, BaseSelect, and SidebarFrame contracts. An unexplained overlay-source
> change is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001–005
- **Category**: tech-debt
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Overlays are where inconsistent surfaces and timing are most visible, and their
classes span public wrappers plus Modal, Popper, and OverlayMenu foundations. Resolving
the same public override in both layers would duplicate callbacks and produce unclear
precedence; styling only wrappers would leave submenus and portals inconsistent. This
plan assigns final DOM ownership to the shared foundations, aligns Vega geometry and
motion, and preserves all completed dismissal/focus/presence behavior.

## Current state

- `src/overlays/base/modal.class.ts` defines the shared backdrop and default popup
  motion. Dialog and Sheet pass public overlay/content overrides into `Modal.Content`.
- `src/overlays/base/popper.tsx` owns the positioner, content presence attributes,
  runtime placement, transform origin, and viewport geometry. Popover/Tooltip own
  their final visual content nodes inside `contentRender`.
- `src/overlays/base/menu/menu.tsx` owns every menu panel/group/item/submenu DOM node,
  while DropdownMenu and ContextMenu define trigger behavior and pass slot overrides
  inward. Shared menu styling must be implemented once in this engine.
- Dialog composes Card for its inner surface. Sheet and Dialog cache arbitrary JSX
  title/header/body/footer/close content and already have SSR fixtures.
- Vega's common menu/popover/dialog motion is a 100 ms fade/95%-scale/side displacement;
  Moraine's fixed system uses 150 ms enter and 100 ms exit. Match the motion shape and
  state selectors while retaining the asymmetric shared duration decision in
  `plans/README.md`.
- Vega Sheet uses a 150 ms backdrop and 200 ms side transition, which already matches
  Moraine's fixed sheet primitive.

## Commands you will need

| Purpose         | Command                                                                                                                                                          | Expected on success          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Foundations     | `bun run test src/overlays/base/modal.test.tsx src/overlays/base/popper.test.tsx src/overlays/base/menu/menu.utils.test.tsx`                                     | all pass                     |
| Menus           | `bun run test src/overlays/dropdown-menu/dropdown-menu.test.tsx src/overlays/context-menu/context-menu.test.tsx`                                                 | both pass                    |
| Public overlays | `bun run test src/overlays/dialog/dialog.test.tsx src/overlays/popover/popover.test.tsx src/overlays/sheet/sheet.test.tsx src/overlays/tooltip/tooltip.test.tsx` | all pass                     |
| Consumers       | `bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx src/navigation/sidebar-frame/sidebar-frame.test.tsx`                       | all pass                     |
| Domain          | `bun run test src/overlays`                                                                                                                                      | every overlay suite passes   |
| Types           | `bun run typecheck`                                                                                                                                              | exit 0                       |
| Public types    | `bun run test:types`                                                                                                                                             | build and both fixtures pass |

## Suggested executor toolkit

- Use `parity-port` to translate direct Zaidan menu/dialog/popover/sheet/tooltip
  evidence onto Moraine's foundation architecture.
- Use `solid-js-1.x-best-practices-and-api` for open/presence/placement and item state.
- Apply every gate in `build-ssr-safe-component`: closed content must remain lazy,
  arbitrary JSX props stay cached, and callback resolution cannot add component
  boundaries or alter hydration order.

## Scope

**In scope:**

- `src/overlays/base/modal.tsx`, `modal.class.ts`, `modal.test.tsx`
- `src/overlays/base/popper.tsx`, `popper.test.tsx`
- `src/overlays/base/menu/**`
- `src/overlays/context-menu/**`
- `src/overlays/dialog/**`
- `src/overlays/dropdown-menu/**`
- `src/overlays/popover/**`
- `src/overlays/sheet/**`
- `src/overlays/tooltip/**`
- `src/shared/style/**`, `src/unocss/theme.ts`, `src/tailwind/index.ts`, and their
  focused tests only if the completed matrix requires a missing reusable animation
  primitive shared by three or more overlay families.
- `test/types/default/index.tsx`, `test/types/autocomplete/index.tsx`
- overlay/foundation rows in `style-parity-matrix.md`
- Plan 006 status in `plans/README.md`

**Read-only regression consumers:**

- `src/forms/select/**`
- `src/navigation/sidebar-frame/**`
- final Card, Button, and Kbd implementations.

**Out of scope:**

- Dismissal, focus trap/restore, scroll lock, overlay stack, pointer/hover delays,
  long-press, submenu grace, selection, keyboard/typeahead, placement, collision,
  presence state machines, portal ownership, or DOM/ARIA changes.
- Making low-level Modal `ContentProps.class/style/overlayClass/overlayStyle` stateful;
  public wrapper slot maps are stateful, low-level imperative composition props remain
  static.
- Changing completed consumer classes or adding a cross-library overlay dependency.
- Zaidan translucent-menu variants, registry/theme support, docs pages, generated JSON,
  dependencies, or lockfiles.

## Git workflow

- Branch: `codex/006-overlay-style-parity`.
- Commit shared foundations before public consumers, then run all consumer regressions.
- Use messages such as `refactor(overlays): align surfaces and motion`.
- Do not push or open a pull request unless instructed.

## Required state contexts and ownership

- Public trigger top-level `class`/`style` stays static and is forwarded unchanged by
  wrappers.
- Modal-backed wrapper slots: open, present, exiting, dismissible, overlay enabled,
  layout/side/inset/transition, and optional region presence. Resolve public
  overlay/content callbacks in the wrapper immediately before passing static results
  to Modal. Modal does not resolve them again.
- Popper-backed wrapper slots: open, present, positioned, disabled, mode/invert, desired
  placement, runtime placement/side, and optional content/text/kbd presence. Resolve
  public content callbacks in the wrapper's final visual node; Popper retains only
  static positioner/content primitive props.
- Menu slots: generic source item/group, group/item indices, depth, item type/color/
  size, highlighted/selected/checked/disabled state, submenu open/hasChildren state,
  root open/present/placement/side, and optional subslot presence. OverlayMenu is the
  sole resolver for public menu panel/item slots.

Callbacks receive readonly plain snapshots. Do not expose DOM nodes, accessors,
placement controllers, close/open actions, focus strategy, private normalized groups,
or item ids. A submenu item uses its original source item and depth. The same slot
callback may run once per rendered instance; no hidden/closed slot callback runs.

## Steps

### Step 1: Align shared backdrop, popup, and positioner motion primitives

Use the completed matrix to align `MODAL_OVERLAY_CLASS`, `MODAL_CONTENT_CLASS`, and
shared animation utilities. Common backdrops use the semantic black alpha/blur and
explicit enter/exit state selectors. Common popup motion uses opacity, 95% scale, and
side-aware displacement where the wrapper has runtime placement. Keep fixed durations:
150 ms enter, 100 ms exit, 200 ms sheet/layout. Include `motion-reduce` handling that
removes transforms/animation without removing content.

Do not change Modal/Popper state machines. Add or modify a shared keyframe/utility only
if Dialog, Popover/Menu, and Tooltip all use it and UnoCSS/Tailwind tests assert the
same generated CSS. Preserve transform-origin and computed position styles before
public style overrides.

Add foundation tests for data-state class mapping, reduced motion, computed/public
style precedence, and no closed content instantiation.

**Verify**:

```sh
bun run test src/overlays/base/modal.test.tsx src/overlays/base/popper.test.tsx src/shared/use-transition-presence.test.tsx src/unocss/theme.test.ts src/tailwind/tailwind.test.ts
bun run typecheck
```

Expected: all suites and types pass.

### Step 2: Align OverlayMenu, DropdownMenu, and ContextMenu once

Use both direct Vega menu families. Align shared panel min-width/padding/radius/ring/
shadow, group label/separator rhythm, item min-height/gap/padding/radius/type, 16 px
icons/indicators, description and shortcut hierarchy, highlighted/selected/expanded/
destructive/disabled states, submenu panel motion, and logical side spacing.

Keep only true size/color variants in `menu.class.ts`; state styles remain ordinary
selectors. Translate Vega `focus` to Moraine's current `data-highlighted`/selected
attributes and retain semantic active tokens where the matrix requires a pressed
state. Do not duplicate a class in ContextMenu/DropdownMenu wrappers.

Migrate shared menu slot types to the generic state map and resolve at final DOM sites
in `menu.tsx`. Ensure default content, custom itemRender, checkbox/radio, submenus,
groups, contentTop/contentBottom, and KbdGroup composition do not double-resolve or
eagerly evaluate callbacks. The overlay backdrop callback runs only when that backdrop
is rendered.

Add tests for exact item/group/depth/type states, highlight/select/check/submenu
updates, root/submenu placement, absent icons/descriptions/indicators, static
compatibility, custom renderer ownership, and SSR/hydration.

**Verify**:

```sh
bun run test src/overlays/base/menu/menu.utils.test.tsx src/overlays/dropdown-menu/dropdown-menu.test.tsx src/overlays/context-menu/context-menu.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 3: Align Dialog and Sheet on the Modal foundation

For Dialog, use Vega Dialog/AlertDialog as surface evidence and the completed Card
scale. Align content max-width/gap/padding/radius/ring/shadow, title/description, close
placement, footer action layout, and scrollable/fullscreen variants. Avoid stacking
duplicate Card padding or surface rings; the matrix must identify whether Dialog or
Card owns each layer.

For Sheet, align backdrop, side border/size, 200 ms motion, header/wrapper/actions/body/
footer padding, title/description, and close placement. Preserve inset and transition
variants even where Zaidan has no direct counterpart. Use logical positioning for
start/end where the component already supports it.

Resolve stateful public slots in the wrapper exactly once before Modal's static props
or at the final nested DOM slot. Cached title/description/header/body/footer/action/
close values cannot be reread or eagerly instantiated. Add tests for open/present/exit,
layout/side/inset, optional slot presence, callback laziness, merge precedence, and
production-equivalent hydration fixtures.

**Verify**:

```sh
bun run test src/overlays/dialog/dialog.test.tsx src/overlays/sheet/sheet.test.tsx src/overlays/base/modal.test.tsx src/navigation/sidebar-frame/sidebar-frame.test.tsx
bun run typecheck
```

Expected: all suites and types pass, including the SidebarFrame mobile consumer.

### Step 4: Align Popover and Tooltip on the Popper foundation

For Popover, align the Vega surface to semantic popover colors, 16 px padding, 16 px
gap, medium radius, ring/shadow, `text-sm`, transform origin, and side-aware
fade/scale/displacement. Preserve hover/click modes and delays.

For Tooltip, align gap, `px-3 py-1.5`, `text-xs`, medium radius, Kbd composition, arrow
radius if Moraine renders one, and side-aware motion. Preserve Moraine invert variant,
instant-open motion suppression, skip-delay coordination, and forceMount behavior.

Resolve runtime side from `context.currentPlacement()` before callbacks. Do not use the
desired placement when collision logic has selected another side. Hidden/closed content
and absent text/kbd/body slots remain lazy. Keep Popper computed position/visibility/
transform-origin styles ahead of final stateful content style overrides.

Add tests for desired versus runtime placement, open/present/positioned state, mode/
invert/instant motion, absent content, Kbd item context handoff, static overrides, and
SSR/hydration.

**Verify**:

```sh
bun run test src/overlays/popover/popover.test.tsx src/overlays/tooltip/tooltip.test.tsx src/overlays/base/popper.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 5: Lock overlay types, consumer regressions, and matrix dispositions

Add type fixtures for Dialog open/layout state, Sheet side state, Popover runtime side,
Tooltip invert state, and generic menu item/depth/type state. Prove low-level Modal
class/style fields and public trigger top-level props remain static, source item types
remain exact, and cross-slot/private fields fail.

Update every overlay, Modal, Popper, and OverlayMenu matrix row with final class/motion
values, ownership, tests, and disposition. Run all consumers that share popup/motion
infrastructure.

**Verify**:

```sh
bun run test src/overlays
bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx src/navigation/sidebar-frame/sidebar-frame.test.tsx
bun run typecheck
bun run test:types
git diff --check
rg -n '\| Overlays? \|.*(pending|ready-for-implementation|unclassified)' style-parity-matrix.md
```

Expected: all tests/types pass; diff check is clean; final `rg` exits 1 with no output.

## Test plan

- Foundation tests protect presence, transform origin, computed-style precedence, and
  closed-content laziness.
- Menu tests cover root and submenu panels plus every item type and optional subslot.
- Dialog/Sheet tests cover stateful callbacks without rereading arbitrary JSX.
- Popover/Tooltip tests use runtime placement after collision resolution.
- Existing SSR fixtures remain required; state callbacks add hydration assertions but
  do not create new node branches.
- Select/MultiSelect and SidebarFrame are mandatory downstream regressions.

## Done criteria

- [ ] Every overlay/foundation matrix row is final with ownership and test evidence.
- [ ] Shared Modal/Popper/Menu DOM resolves each public slot override exactly once.
- [ ] Motion shape matches the matrix and fixed duration primitives; reduced motion is
      safe in UnoCSS and Tailwind.
- [ ] Runtime placement, generic source item, and nested depth state are precise and
      readonly without internal objects.
- [ ] Behavior, DOM/ARIA, focus/dismissal, placement, presence, and hydration remain
      unchanged.
- [ ] All overlay/domain/consumer tests, typecheck, type fixtures, and diff check pass.
- [ ] Plan 006 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- A matrix row or slot-ownership decision remains pending.
- One public override is consumed at multiple DOM layers and singular ownership would
  require changing the public API.
- Styling requires changing presence, focus/dismissal, scroll lock, placement,
  submenu, long-press, or pointer behavior.
- Runtime placement or item state can only be exposed through DOM/accessor/private
  normalized objects.
- A shared animation change breaks either UnoCSS or Tailwind generation, or would
  alter unrelated non-overlay components.
- Conditional JSX is evaluated early or production hydration changes.
- A verification fails twice after a reasonable correction.

## Maintenance notes

Public wrappers own styling state definitions; Modal/Popper/Menu own final primitive
DOM. Keep that boundary when adding slots. A future animation change must update both
UnoCSS and Tailwind tests and rerun Select plus SidebarFrame consumers, because overlay
regressions often appear outside `src/overlays`.
