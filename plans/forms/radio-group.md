# RadioGroup Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11 from the working tree rooted at `3c02b36`.
- Reference revisions are fixed at Base UI `3011fba8f` and Kobalte `2e8ce473`.
- Focused RadioGroup coverage passes 27/27; navigation, FormField, Form, Checkbox, and CheckboxGroup dependencies pass 117/117 when SSR fixtures run in isolation.

## Goal

Bring RadioGroup selection, roving focus, keyboard, native form, ARIA, pointer, controlled-state, and SSR behavior to pinned upstream parity while preserving Moraine's data-driven list/card/table API.

## Local Surface

- Source: `src/forms/radio-group/radio-group.tsx`
- Styles: `src/forms/radio-group/radio-group.class.ts`
- Tests: `src/forms/radio-group/radio-group.test.tsx`
- SSR fixture: `src/forms/radio-group/radio-group.ssr.fixture.tsx`
- Shared dependencies: `src/shared/hidden-input.tsx`, `src/shared/use-selectable-collection-navigation.ts`, and `src/forms/form-field/form-field-context.ts`
- Public surface: `RadioGroup`, `RadioGroupProps`, and the existing `RadioGroupT` namespace members.

## Upstream Evidence

- Base UI `radio-group/RadioGroup.test.tsx` proves Space selection on keyup, no Enter selection, root/input cancellation, automatic arrow selection, Shift+Arrow focus movement, disabled/readOnly behavior, initial tab-stop ownership, native naming/validation, and Field ARIA relationships.
- Base UI `radio-group/RadioGroup.tsx` separates composite item identity from submitted values, owns one roving tab stop, skips disabled items for navigation, and synchronizes hidden native radios with controlled group state.
- Kobalte `radio-group/radio-group-root.tsx` provides the Solid controlled-state and single-select collection ownership model.
- Kobalte item input, label, and description sources combine group and item ARIA relationships while retaining native radio form semantics.
- Upstream compound-part, render-prop, event-detail, and polymorphic APIs are evidence only; the plan preserves Moraine's comprehensive item-array contract.

## Implemented Invariants

1. Explicit `value` is authoritative, a string FormField value is next, and the mount-time `defaultValue` snapshot is the uncontrolled fallback. External Formisch updates apply only when no explicit value owns the group.
2. Controlled requests publish once but immediately restore rejected native checked state. Synchronous parent acceptance and later external prop changes converge with FormField without duplicate callbacks.
3. Space arms on keydown and selects on keyup; Enter is ignored. Arrow/Home/End navigation remains automatic, wraps, follows orientation and RTL, skips disabled items, permits Shift, and ignores Alt/Ctrl/Meta.
4. The enabled selected item owns the roving tab stop. A stale, missing, or disabled selection falls back to the first enabled item; empty and all-disabled groups expose no tab stop.
5. Each item has collision-free DOM/ref identity derived from group ID, encoded value, and occurrence index. Duplicate public values retain independent focus targets while the first occurrence is the sole selected/native serialized representative.
6. Removing a focused item restores focus to the current enabled tab stop after Solid reconciles the collection. Ref cleanup is item-ID based and cannot collide on duplicate values.
7. Native reset restores the initial uncontrolled snapshot or latest explicit controlled value, updates FormField and checked properties without callbacks, and respects cancellation.
8. Same-name native radios preserve FormData ordering, required validity, disabled omission, and readonly submission. Boundary/no-op or duplicate-value selection emits no callbacks or FormField events.
9. Item inputs reference their own label and description plus group/FormField descriptions. Group required, disabled, readonly, invalid, orientation, and labelling state remain synchronized through ARIA and data attributes.
10. Card/table label activation honors canceled root clicks and ignores nested interactive descendants; list variants retain label-only activation.
11. Items, layout props, and item label/description JSX are cached once. The SSR fixture reuses root/item/input nodes, stable IDs, descriptions, checked state, and the first post-hydration keyboard action.

## Behavior Classification

| Surface            | Outcome                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| Space / Enter      | Space selects on keyup; Enter does not select                                                       |
| Arrow / Home / End | Automatic selection and focus, wrapping, orientation/RTL aware, disabled items skipped              |
| Modifiers          | Shift+Arrow remains active; Alt/Ctrl/Meta navigation is ignored                                     |
| Roving tab stop    | Enabled selected item, otherwise first enabled item; none for empty/all-disabled groups             |
| Duplicate values   | Unique DOM/ref identities; first occurrence is the canonical selected and serialized representative |
| State authority    | Explicit controlled value, then FormField string value, then initial uncontrolled snapshot          |
| Reset              | Initial uncontrolled snapshot or latest explicit value; no callbacks; cancellation respected        |
| Native form        | One selected same-name entry, required validity, disabled omission, readonly submission             |

## Intentional Divergences and STOP Decisions

- Moraine retains one comprehensive `items` API, list/card/table variants, slots, classes, and styles instead of copying compound RadioGroup/Radio parts, polymorphism, or event-detail APIs.
- Duplicate values remain accepted by the existing public contract. The first occurrence is the canonical selected/native representative; later duplicates can receive focus, and selecting the same public value is a no-op.
- Radio-specific Space/Enter/modifier policy stays in RadioGroup. `useSelectableCollectionNavigation` was not changed, so Select, Menu, Tabs, Stepper, and other consumers keep their established behavior.
- Native autofill, browser-generated keyboard/touch clicks, Safari platform navigation differences, validation UI, and assistive-technology announcement order remain `unverified-platform`.

## Validation

- `bun run test src/forms/radio-group/radio-group.test.tsx` — 27/27.
- `bun run test src/shared/use-selectable-collection-navigation.test.ts` — 25/25.
- FormField and Form — 39/39.
- Checkbox and CheckboxGroup — 53/53; their SSR fixtures pass when isolated from concurrent fixture compilation.
- `bun run typecheck`, targeted oxlint, formatting, `bun run build`, and `git diff --check` pass.
- Full QA remains blocked by the pre-existing `src/shared/use-loading-auto.test.ts` lint finding; production preview remains blocked by the pre-existing client-only `solid-toaster` server import.

## Completion Criteria

- Keyboard, focus, pointer, controlled, native form, ARIA, collection, and SSR behavior have explicit invariants and evidence.
- Every compatible verified gap has a regression test or an intentional/platform classification.
- The public comprehensive API and shared navigation contract remain intact.
- No unclassified RadioGroup parity gap remains.
