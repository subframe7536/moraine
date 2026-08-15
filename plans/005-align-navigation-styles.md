# Plan 005: Align navigation and application-shell components

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If a STOP condition occurs,
> stop and report; do not improvise. Update this plan's row in `plans/README.md` when
> finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- src/navigation src/forms/select src/forms/input src/forms/form-field src/elements/button src/elements/progress src/elements/resizable style-parity-matrix.md`.
> Plans 001 and 003–004 are expected to change the matrix and composed dependencies.
> Re-read their final class contracts. Any unexplained navigation-source change is a
> STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: Plans 001 and 003–004
- **Category**: tech-debt
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Navigation components expose the system at collection and application scale: repeated
items, current/highlighted states, indicators, virtual rows, and responsive shells.
Their current spacing is locally plausible but does not consistently compose the
Button, Input, field, and popup scales established by earlier plans. This plan aligns
those surfaces without changing navigation behavior or publishing internal accessors
through styling APIs.

## Current state

- Breadcrumb has direct Vega evidence for `text-sm`, 1.5/2.5 gaps, a 14 px separator,
  and a 20 px ellipsis surface.
- Pagination has inline root/list/item/link classes and no `.class.ts`; Vega Pagination
  is intentionally thin and composes Button dimensions.
- Tabs uses an animated absolutely positioned indicator. Vega's default tabs use a
  36 px list, 3 px inset padding, `text-sm` triggers, and selected shadow; Moraine also
  exposes a link variant and vertical orientation that must remain.
- CommandPalette is structurally analogous to Zaidan Command and shares field/option
  vocabulary with BaseSelect, but owns independent listbox behavior and virtualization.
- SidebarFrame's public render context contains accessors and setters. Styling changes
  must leave those render-prop APIs and the current `BaseContext` object unchanged.
- Stepper has no direct Zaidan component. Its completed matrix row must derive visual
  rhythm from Tabs, Progress, and Item while preserving step semantics.
- SidebarFrame composes Sheet on mobile. Plan 005 aligns the frame and passes semantic
  styling into Sheet; Plan 006 owns Sheet's final overlay surface and revalidates this
  consumer.

## Commands you will need

| Purpose              | Command                                                                                                                                        | Expected on success           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Focused component    | `bun run test <navigation-test-file>`                                                                                                          | selected suite passes         |
| Command dependencies | `bun run test src/navigation/command-palette/command-palette.test.tsx src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx` | all pass                      |
| Sidebar dependencies | `bun run test src/navigation/sidebar-frame/sidebar-frame.test.tsx src/elements/resizable/resizable.test.tsx src/overlays/sheet/sheet.test.tsx` | all pass                      |
| Domain               | `bun run test src/navigation`                                                                                                                  | every navigation suite passes |
| Types                | `bun run typecheck`                                                                                                                            | exit 0                        |
| Public types         | `bun run test:types`                                                                                                                           | build and both fixtures pass  |

## Suggested executor toolkit

- Use `parity-port` for direct and analogue evidence.
- Use `solid-js-1.x-best-practices-and-api` for measured indicator reactivity.
- Apply `build-ssr-safe-component` to item/render props, conditional content, virtual
  rows, and SidebarFrame render boundaries. Styling must not eagerly mount them.

## Selector ownership rule

Zaidan `has-*`, `group-has-*`, `group-data-*`, and `in-data-*` selectors remain visual
evidence only. Navigation's fixed wrappers and known item branches should receive
classes directly from existing props/accessors at their final DOM owners: CommandPalette
uses its existing highlighted state, Pagination keeps `data-current`, Tabs uses its
orientation/variant/size values, and SidebarFrame uses its existing frame context.
Keep only the smallest direct-child/sibling selectors needed for arbitrary caller-owned
children. Do not add `data-icon`, `data-size`, `data-placeholder`, group names, slot
renames, visual-only nodes, or styling-only ARIA to reproduce an upstream selector.
Pass size/variant values through existing `cva` axes or direct slot classes, and keep
runtime styling on the current `data-*`, ARIA, and pseudo-class states.

## Scope

**In scope:**

- `src/navigation/breadcrumb/**`
- `src/navigation/command-palette/**`
- `src/navigation/pagination/{pagination.tsx,pagination.class.ts,pagination.test.tsx,pagination.ssr.fixture.tsx}`
- `src/navigation/sidebar-frame/**`
- `src/navigation/stepper/**`
- `src/navigation/tabs/**`
- navigation rows in `style-parity-matrix.md`
- Plan 005 status in `plans/README.md`

**Read-only regression consumers:**

- final Button, Progress, Resizable, Input, BaseSelect, and Sheet implementations.

**Out of scope:**

- Keyboard/focus/selection/virtualization/scroll state machines, item normalization,
  measurement algorithms, route/link semantics, responsive breakpoint behavior, or
  render-prop APIs.
- Changes to completed element/form classes to compensate for navigation layout.
- Final Sheet visual values; Plan 006 owns them.
- New navigation components, docs pages, generated API JSON, dependencies, lockfiles,
  or theme infrastructure.

## Git workflow

- Branch: `codex/005-navigation-style-parity`.
- Commit by batch: simple collection navigation, command/virtual list, then shell.
- Use messages such as `refactor(navigation): align collection style system`.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Align Breadcrumb and Pagination

Use the direct Vega selectors and completed control scale. Align Breadcrumb list/item
gaps, typography, current/link colors, separator/ellipsis icon sizes, wrapping, and
logical direction. Preserve custom item rendering and link semantics.

Create `pagination.class.ts`. Move root/list/item/ellipsis/link utilities out of TSX;
use static constants unless a true size/variant axis exists. Compose final Button
sizes and variants rather than repeating height/padding. Align list gap, ellipsis size,
and text-control padding for prev/next text while preserving icon-only controls and
logical directions.

Test current-page classes, page count, disabled edges, links, static slot override
precedence, and hydration. Assert that current-page styling stays on the existing
`data-current` owner and does not introduce a `data-active` marker.

**Verify**:

```sh
bun run test src/navigation/breadcrumb/breadcrumb.test.tsx src/navigation/pagination/pagination.test.tsx
bun run typecheck
```

Expected: both suites and types pass.

### Step 2: Align Tabs and Stepper

For Tabs, align default list height/inset, trigger type/gap/icon/padding, selected
surface/shadow, content type, and link-variant indicator to the matrix. Preserve the
measured moving indicator and both orientations. Keep its 200 ms layout transition and
reduced-motion behavior; do not replace the indicator with a DOM branch that matches
Zaidan more literally.

For Stepper, implement the matrix's analogue using the final Tabs trigger scale,
Progress line weight, and Item title/description spacing. Preserve active/completed
semantics, linear reachability, and clickable/keyboard behavior. Any state selector
must use existing data attributes; do not add behavior state only for CSS.

Do not expose measured elements or create duplicate item normalization. Apply known
trigger/item state classes directly from existing accessors and keep relationship
selectors out of the fixed Tabs/Stepper tree. Add tests for size/orientation,
selected/completed selectors, indicator/separator geometry, controlled updates, absent
content, static overrides, and SSR/hydration.

**Verify**:

```sh
bun run test src/navigation/tabs/tabs.test.tsx src/navigation/stepper/stepper.test.tsx
bun run typecheck
```

Expected: both suites and types pass.

### Step 3: Align CommandPalette with Command and BaseSelect conventions

Use Zaidan Command for panel/input/list/group/item/empty/footer composition and the
final Input/BaseSelect classes for shared scale. Align panel radius/padding, compact
search row, icon opacity/size, list padding/max height, group label, item gap/padding/
radius/type, active/highlighted/disabled states, description/trailing layout, empty
state, and footer border/rhythm.

Do not import BaseSelect state or styling code merely to share a few strings. Reuse a
shared constant only if Plan 004 already created one; otherwise apply the same matrix
values in CommandPalette's class file. Preserve listbox semantics, search/filtering,
description placement, close timing, and virtualization.

Apply static slot overrides at the final render owner. `itemProps` and `itemRender`
continue to receive their existing render context, and virtual rows retain their
source item/group and semantic entry index. Use the existing item/highlight accessors
for fixed rows; do not add selected markers or group hooks just to mirror Command.

Add tests for grouped and virtual rows, loading/search/empty changes, active/focused/
disabled state, optional close/footer/description slots, static override compatibility,
and conditional JSX single evaluation.

**Verify**:

```sh
bun run test src/navigation/command-palette/command-palette.test.tsx src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 4: Align SidebarFrame without leaking render-context APIs

Use Zaidan Sidebar evidence only for frame surfaces the component actually owns:
sidebar background, floating ring/radius/shadow, inset main spacing/radius/shadow,
header/body/footer gaps and padding, and 200 ms width/layout motion. Do not port Zaidan
menu/group/button classes because SidebarFrame does not render those primitives.

Move remaining reusable root/body/main strings to `sidebar-frame.class.ts`. Keep
computed responsive/side composition in existing variants. Apply static slot
classes/styles at the final `root`, `sidebar`, region, and `main` DOM owners while
preserving the extra `classes`/`styles` passed by `FrameRender`. The fixed precedence is
built-in -> frame-render contribution -> public slot override -> top-level root
override. Do not spread the public `styles` map as a CSS object; only each slot's style
belongs on its DOM node.

Keep `FrameContext` unchanged for render props. Test mobile/open/scroll/variant/side
class changes and static override precedence. Mobile Sheet and desktop Resizable trees
must keep their creation order and behavior. Resolve side/variant/open classes from the
existing frame context and preserve semantic `data-state`/`data-side` attributes; do not
introduce group or content-presence markers for fixed frame regions.

**Verify**:

```sh
bun run test src/navigation/sidebar-frame/sidebar-frame.test.tsx src/elements/resizable/resizable.test.tsx src/overlays/sheet/sheet.test.tsx
bun run typecheck
```

Expected: all suites and types pass with no responsive/render-prop regression.

### Step 5: Complete the navigation matrix and run the domain gate

Run the existing public type fixtures as a regression gate. Update every navigation
matrix row with final values, test evidence, analogue decisions, and disposition. Check
that each Implementation plan entry names a direct final slot owner, documents the
allowed arbitrary-child relationship-selector boundary, and contains no structural
parity proposal.

**Verify**:

```sh
bun run test src/navigation
bun run typecheck
bun run test:types
git diff --check
rg -n '\| Navigation \|.*(pending|ready-for-implementation|unclassified)' style-parity-matrix.md
```

Expected: all commands pass; final `rg` exits 1 with no output.

## Test plan

- Direct components assert matrix anchors without full class snapshots.
- Repeated items cover current/selected/disabled class changes.
- CommandPalette tests matching virtual and non-virtual styling.
- Tabs tests measured indicator style precedence; SidebarFrame tests frame-render/public
  override precedence.
- Selector tests assert direct owners for fixed items and preserve only existing
  `data-*`/ARIA runtime state; no presentational marker is required for composition.
- Existing SSR fixtures remain the hydration gates for Breadcrumb, Pagination, Tabs,
  and SidebarFrame's responsive composition where applicable.

## Done criteria

- [ ] Every navigation row has a final classification and test evidence.
- [ ] Navigation composes completed Button/Input/field scales without compensating
      local dimensions.
- [ ] Pagination built-ins live in a class file with no static-only `cva`.
- [ ] Virtual and non-virtual rows share the same visual contract.
- [ ] SidebarFrame's render context and public styling API remain unchanged.
- [ ] Fixed navigation slots use direct final-owner classes; direct-child/sibling
      selectors remain only for arbitrary caller-owned children.
- [ ] No parity-only `data-icon`, `data-size`, `data-placeholder`, group name, slot
      rename, visual-only node, or styling-only ARIA attribute was added.
- [ ] Behavior, DOM, ARIA, keyboard/focus, selection, routing, responsiveness, and
      hydration remain unchanged.
- [ ] Domain tests, typecheck, type fixtures, and diff check pass.
- [ ] Plan 005 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- A matrix row is missing or an analogue decision is still pending.
- Visual alignment requires changing measured indicator, selection, virtualization,
  scroll, breakpoint, or render-prop behavior.
- Public and frame-render style precedence cannot be made deterministic without an API
  change.
- Mobile Sheet styling requires modifying Sheet before Plan 006; record the consumer
  requirement and defer it.
- A Vega relationship selector would require a new marker, group name, slot, wrapper,
  visual node, or ARIA attribute for a fixed navigation branch; record the divergence
  and stop.
- A verification fails twice after a reasonable correction.

## Maintenance notes

CommandPalette and BaseSelect intentionally share scale, not state architecture.
SidebarFrame owns only frame geometry; menu primitives rendered inside it remain caller
content. Plan 006 must rerun SidebarFrame tests after final Sheet changes because the
mobile composition is a required downstream consumer. Keep the final class owner
explicit in every future navigation row so selector topology cannot become an API
contract by accident.
