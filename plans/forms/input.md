# Input Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11 from the working tree rooted at `3c02b36`.
- Reference revisions are fixed at Base UI `3011fba8f` and Kobalte `2e8ce473`.
- Focused Input coverage passes 27/27; Textarea, Checkbox, FormField, and Form dependencies pass 82/82.

## Goal

Align Input's native text-entry, event, controlled value, modifier, accessibility, form, pointer, browser, and SSR behavior with pinned prior art while preserving Moraine's wrapper, icon/loading slots, and FormField integration.

## Local Surface

- Source: `src/forms/input/input.tsx`
- Styles: `src/forms/input/input.class.ts`
- Tests: `src/forms/input/input.test.tsx`
- SSR fixture: `src/forms/input/input.ssr.fixture.tsx`
- Value processing: `src/shared/input-modifiers.ts`
- Shared interactive-target guard: `src/forms/shared/is-interactive-target.ts`
- Field integration: `src/forms/form-field/form-field-context.ts`

## Upstream Evidence

- Base UI `input/Input.tsx` delegates to `Field.Control`; `field/control/FieldControl.tsx` uses native input value/defaultValue semantics, explicit controlled ownership, registration, and native change events.
- Base UI Field tests cover controlled values, field registration, native validity, form reset, and focus/validation behavior.
- Kobalte `text-field/text-field-root.tsx` snapshots defaults, listens for native form reset, updates from input events, and explicitly restores the controlled DOM value because Solid does not do so automatically.
- Kobalte `text-field/text-field-input.tsx` keeps the native input as the semantic owner and composes required, disabled, readonly, invalid, labelled-by, and described-by state.

## Implemented Invariants

1. Native `input` remains the value, keyboard, selection, FormData, validity, disabled, and readonly owner. Programmatic property writes publish nothing until a native event occurs.
2. The caller's native `onInput` runs first. A cancelable prevented event stops modifiers and value publication; accepted IME/input events publish one `onValueChange`, while `onChange` remains the commit callback.
3. Explicit controlled values are restored after non-lazy input and after lazy change. Synchronous parent acceptance is retained; rejected requests keep DOM and FormField state aligned.
4. External controlled prop changes and Formisch `setInput` update the DOM without user callbacks. Controlled FormField synchronization uses one reactive source rather than a parallel state machine.
5. Uncontrolled `defaultValue` is snapshotted at mount, initializes both live/default DOM values, ignores later default changes, and returns to the snapshot on native reset without callbacks.
6. Native reset restores explicit controlled values in a microtask after the browser reset and respects cancellation. Moraine Form's later canonical reset remains authoritative for Formisch metadata.
7. Wrapper primary-pointer presses focus the input only from non-interactive padding/text. Direct input presses, secondary buttons, nested links/buttons/inputs, and caller-cancelled events remain native.
8. Delayed autofocus is cancelled on owner cleanup, rechecks the latest disabled state, and preserves native readonly focusability.
9. Leading, trailing, loading icon, modifier config, and children are single-evaluated in their owner. SSR and hydration preserve controlled value, root/input/child identity, and leading-input-child-trailing order.

## Native and Modifier Classification

| Surface                                      | Outcome                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `type`, placeholder, autocomplete, maxLength | Forwarded to the native input; no redundant role                                           |
| required/disabled/readonly/invalid           | Native properties plus FormField ARIA/data state                                           |
| FormData                                     | Readonly included; disabled omitted; names and values remain native                        |
| trim                                         | Callback payload is trimmed; commit synchronizes uncontrolled DOM text                     |
| lazy                                         | Draft remains native until change; controlled value restores after commit                  |
| number/empty                                 | Existing Moraine conversion contract retained and reactive                                 |
| IME/paste/autofill                           | No composition or keyboard interception; native input events are the only publication path |
| password/file/mobile types                   | Browser restrictions remain authoritative; no synthetic compatibility state                |

## Intentional Divergences

- Moraine keeps its comprehensive wrapper, icons/loading, children, modifiers, delayed autofocus, and value callback API instead of copying Base UI/Kobalte primitive decomposition.
- `autocomplete="off"` remains the documented local default.
- Modifier number/null/undefined payloads are Moraine-owned; upstream text fields expose strings.
- Input does not manufacture events for programmatic writes, reset, external controlled props, or Formisch updates.

## Validation

- `bun run test src/forms/input/input.test.tsx` — 27/27.
- `bun run test src/forms/textarea/textarea.test.tsx src/forms/checkbox/checkbox.test.tsx` — 43/43.
- `bun run test src/forms/form-field/form-field.test.tsx` — 29/29.
- `bun run test src/forms/form/form.test.tsx` — 10/10.
- `bun run typecheck` and targeted oxlint pass.
- Real IME candidate UI, paste/autofill dispatch, mobile input keyboards, password-manager behavior, OS file selection, caret painting, native validation UI, and assistive-technology announcements remain `unverified-platform`.

## Completion Criteria

- Native, modifier, field, platform, and SSR behavior is classified.
- Every compatible gap has a regression test; browser-only uncertainty is explicit.
- Native browser behavior remains primary, with only controlled/default/reset convergence implemented locally.
- No public API was added and no unclassified Input parity gap remains.
