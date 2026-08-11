# Select Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11 from the working tree rooted at `3c02b36`.
- Reference revisions are fixed at Base UI `3011fba8f` and Kobalte `2e8ce473`.
- Focused Select coverage passes 91/91; MultiSelect, Menu, navigation, FormField, and Form dependencies pass 106/106 when SSR fixtures run in isolation.

## Goal

Bring single Select keyboard, ARIA, pointer, controlled-state, native form, virtualization, overlay lifecycle, and SSR behavior to pinned upstream parity while preserving Moraine's comprehensive Select API and searchable mode.

## Local Surface

- Public source: `src/forms/select/select.tsx`
- Shared engine: `src/forms/select/base-select.tsx` and `src/forms/select/shared`
- Styles: `src/forms/select/select.class.ts`
- Tests: `src/forms/select/select.test.tsx`
- SSR fixture: `src/forms/select/select.ssr.fixture.tsx`
- Public surface: `Select`, `SelectProps`, and the existing `SelectT` namespace members.

## Upstream Evidence

- Base UI `select/root/SelectRoot.tsx` and its tests prove closed-trigger typeahead, repeated-character cycling, disabled skipping, Space/typeahead separation, controlled selection, item registration, and list navigation.
- Base UI Select trigger, item, group/label, list, popup, and positioner sources prove combobox/listbox ownership, selected and highlighted state, accessible groups, pointer separation, and popup lifecycle behavior.
- Kobalte Select root/base/trigger/listbox and hidden-select sources provide the Solid controlled-state, collection, native change, reset, and form-integration translation model.
- Upstream compound parts, polymorphism, event-detail APIs, scroll arrows, and public equality/item contracts are evidence only; Moraine retains its high-level options/render API.

## Implemented Invariants

1. Closed non-search Select opens from Space, Enter, and arrows. Home/End remain scoped to an open listbox. Printable typeahead commits while closed, highlights while open, cycles repeated characters, skips disabled options, and resets after 500 ms; searchable inputs retain normal Space behavior.
2. Normalized option identity includes value type, serialized value, text key, and occurrence. Numeric `1` and string `'1'` remain distinct, duplicate DOM IDs cannot collide, and the first same-typed duplicate is the canonical selected/native representative.
3. Groups own visible label IDs. Virtual groups expose the same `role=group`/`aria-labelledby` relationship plus `aria-owns`; virtual options retain `aria-posinset`, `aria-setsize`, and flattened scroll indexes.
4. Explicit `value` is authoritative, FormField input is next for uncontrolled Select, and the mount-time `defaultValue` snapshot is the fallback. Controlled requests publish once, synchronously accepted values commit, and rejected native/FormField state is restored without duplicate callbacks.
5. Unmatched controlled values stay visible, valid, and serializable through a synthetic native option, then resolve to the real option when it arrives. Typed native change and empty native change map back to the public scalar/null contract.
6. Native reset restores the initial uncontrolled snapshot or latest explicit controlled value, publishes no callbacks, updates FormField and native selected properties, and respects cancellation.
7. The hidden native select remains the single serialization and required-validity owner. Numeric values serialize predictably, disabled fields are omitted, search text never satisfies validity, and selected option order remains stable for the shared engine.
8. Mouse pointerdown preserves focus without transferring it to option rows. Touch and pen pointerdown retain browser defaults; pointer movement, cancellation, and pointerup alone never select.
9. Selection focus, highlight scrolling, positioner z-index, dismiss state, and reset microtasks carry disposal plus current-state guards, so close, reopen, replacement, or unmount cannot execute stale work.
10. BaseSelect caches children and render/virtual props; Select caches option, label, empty, and icon props. Option label/description getters are normalized once, closed popup trees stay uninstantiated, and `renderToString -> hydrate -> open` reuses the control/native nodes and handles the first keyboard action.
11. Existing portal positioning, width, collision padding, z-index, outside dismissal, exit presence, highlight retention, filtering, scroll-bottom, and virtualization contracts remain intact without changing shared Menu or Popper.

## Behavior Classification

| Surface         | Outcome                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Closed keyboard | Space/Enter/arrows open; printable typeahead commits; Home/End do nothing                       |
| Open keyboard   | Arrows/Home/End navigate; Enter/Space select; Escape closes; Tab is not trapped                 |
| Typed identity  | `Object.is` value equality, collision-free instance IDs, first duplicate canonicalization       |
| State authority | Explicit controlled value, then FormField scalar/null, then initial uncontrolled snapshot       |
| Native form     | Typed change/empty change, unmatched serialization, required validity, disabled omission, reset |
| Pointer         | Mouse focus preservation; touch/pen defaults; movement/cancel alone never select                |
| SSR             | Closed tree is lazy; getter reads are exact; server control nodes hydrate in place              |

## Intentional Divergences and STOP Decisions

- Moraine retains one comprehensive `options` API, searchable mode, render hooks, virtualization adapter, slots, classes, and styles instead of copying Base UI/Kobalte compound parts, polymorphism, event-detail objects, or scroll-arrow APIs.
- String/number equality is resolved internally with `Object.is`; no public equality or item-key API was added. Duplicate same-typed values remain accepted, with the first occurrence as the canonical selected/native representative.
- Select-specific typeahead and Space policy stay in BaseSelect. The shared selectable-navigation contract and shared Menu/Popper implementation were not changed.
- Search input text remains Moraine-owned filtering state rather than adopting a second upstream Combobox API.
- Real touch scrolling versus tap-generated click, browser autofill UI, native validation bubbles, platform-specific focus-visible behavior, and assistive-technology announcements remain `unverified-platform`.

## Validation

- `bun run test src/forms/select/select.test.tsx` — 91/91.
- `bun run test src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx` — 128/128.
- Menu and shared navigation — 30/30.
- FormField and Form — 39/39 when their SSR fixtures run in isolation.
- `bun run typecheck`, targeted oxlint/formatting, `bun run build`, and `git diff --check` pass.
- Full QA remains blocked by the pre-existing `src/shared/use-loading-auto.test.ts` lint finding; production preview remains blocked by the pre-existing client-only `solid-toaster` server import.

## Completion Criteria

- Keyboard, ARIA, identity, pointer, controlled, native form, overlay, virtualization, and SSR behavior have explicit invariants and evidence.
- Every compatible verified gap has a regression test or an intentional/platform classification.
- The public comprehensive API, shared navigation, Menu, and Popper contracts remain intact.
- No unclassified Select parity gap remains.
