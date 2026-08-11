# InputNumber Base UI Parity Plan

## Status

- Implementation complete on 2026-08-11 from the working tree rooted at `3c02b36`.
- Reference revisions are fixed at Base UI `3011fba8f` and Kobalte `2e8ce473`.
- Focused InputNumber coverage passes 72/72; useControllableValue, FormField, Form, and Slider dependencies pass 93/93 when the SSR fixtures run in isolation.

## Goal

Align InputNumber's spinbutton editing, locale parsing/formatting, stepping, hold-repeat, wheel, form, ARIA, controlled-state, platform, and SSR behavior without replacing Moraine's high-level number input API.

## Local Surface

- Source: `src/forms/input-number/input-number.tsx`
- Styles: `src/forms/input-number/input-number.class.ts`
- Tests: `src/forms/input-number/input-number.test.tsx`
- SSR fixture: `src/forms/input-number/input-number.ssr.fixture.tsx`
- Shared dependencies: `src/shared/use-controllable-value.ts` and `src/forms/form-field/form-field-context.ts`
- Public surface: `InputNumber`, `InputNumberProps`, and the existing `InputNumberT` namespace members.

## Upstream Evidence

- Base UI `number-field/root/NumberFieldRoot.tsx` initializes formatted input text during render, treats dirty input text as the step base, gates wheel handling on enabled/writable/focused state, and only commits wheel/keyboard changes when the validated number changes.
- Base UI `number-field/input/NumberFieldInput.tsx` distinguishes manual text authority from synchronized numeric authority so formatted display precision does not replace the committed number during stepping.
- Base UI `number-field/utils/validate.ts` removes arithmetic floating-point noise only from step operations and preserves unrelated input precision.
- Base UI increment/decrement tests expose stable `aria-controls`; root/input tests cover boundary no-ops, dirty controlled stepping, wheel guards, and precision.
- Kobalte `number-field` uses decimal-scale arithmetic, locale formatting, focused wheel handling, and `aria-controls`; `spin-button` exposes `aria-valuenow`, bounds, formatted `aria-valuetext`, and readonly semantics.

## Implemented Invariants

1. Editable text, committed numeric state, explicit controlled props, and FormField state are distinct layers. `rawValue` takes precedence over locale-parsed `value`; FormField is next; the mount-time default snapshot is the uncontrolled fallback.
2. SSR initializes visible text from the resolved numeric value. Explicit locale fixtures hydrate the same root/input/control nodes for horizontal, vertical, and hidden-control branches.
3. Partial tokens remain editable. Parseable dirty text is the authoritative base for Arrow, Page, wheel, and stepper operations; blur and Enter share the parse/commit path and restore canonical formatting.
4. Decimal stepping scales to the maximum safe relevant decimal precision. Unsafe large-magnitude operations retain the native result instead of rounding unrelated existing digits.
5. A clamped no-op publishes no `onRawValueChange`, `onChange`, FormField change, or input notification. Successful callbacks remain ordered as numeric first, locale-formatted text second.
6. Explicit controlled values remain authoritative for the visible committed value and FormField store. Rejected dirty requests stay editable, synchronous/external prop updates converge, and external Formisch writes cannot override an explicit prop.
7. Native reset restores the initial uncontrolled snapshot or latest explicit controlled value after the browser reset, updates FormField without callbacks, directly repairs an unchanged controlled DOM property, and respects cancellation.
8. Wheel handling requires the feature flag, exact input focus, writable/enabled state, non-zero delta, and no pinch-zoom modifier before cancellation. Eligible boundary no-ops still prevent page scrolling but publish nothing.
9. Steppers expose `aria-controls`, reactively disable at bounds and in readonly/disabled state, and the spinbutton exposes locale-formatted `aria-valuetext` alongside numeric ARIA values.
10. Hold-repeat owns its delay/interval timers and selection lock. Pointer up, cancel, leave, lost capture, and owner disposal stop both controls without an extra step; multiple active pointers cannot leak document styles.
11. Delayed autofocus is owner-cleaned and rechecks the latest disabled state. Conditional orientation/control props are single-evaluated, and Button receives an icon name rather than owner-sensitive pre-instantiated JSX.

## Parsing, Step, and Form Classification

| Surface | Outcome |
| --- | --- |
| Empty/sign/decimal partials | Preserved as draft text until blur, Enter, or a step interaction |
| Locale decimal/group strings | Parsed through the configured locale; callbacks format through the same locale |
| Scientific notation | Accepted when JavaScript numeric parsing yields a finite value; no new notation API |
| NaN/infinity | Never committed as numeric state |
| Decimal step noise | Cleaned with safe integer scaling; unrelated unsafe-magnitude precision is not rounded |
| `rawValue` / `value` | `rawValue` is authoritative; `value` accepts locale-formatted string or finite number |
| FormData/validity | The visible native text input remains the single serialized, required, disabled, and readonly owner |
| Reset | Mount-time uncontrolled snapshot or latest explicit controlled value; no callbacks |

## Intentional Divergences and STOP Decisions

- Moraine keeps one comprehensive component, orientation/layout variants, repeat options, delayed autofocus, and dual numeric/formatted callbacks instead of copying compound NumberField, scrub-area, or translation APIs.
- Home and End act only when their corresponding explicit bound exists. Modifier-specific Base UI `smallStep`, snap-to-step, scrub-area, paste filtering, and event-detail reasons are not added to the current API.
- Inverted bounds and non-finite, zero, or negative `step` props are classified as unsupported invalid configurations. This patch adds no normalization contract for them; finite numeric commits are required, zero naturally no-ops, and callers must provide ordered bounds and a positive finite step.
- Actual iOS software-keyboard presentation, native passive-wheel behavior across browsers, OS locale input methods, validation UI, and screen-reader announcements remain `unverified-platform`.

## Validation

- `bun run test src/forms/input-number/input-number.test.tsx` — 72/72.
- `bun run test src/shared/use-controllable-value.test.ts src/forms/slider/slider.test.tsx` — 54/54.
- `bun run test src/forms/form-field/form-field.test.tsx` — 29/29.
- Form's nine non-SSR tests and isolated hydration test pass; concurrent SSR fixture execution can exceed its existing hard-coded timeout.
- `bun run typecheck`, targeted oxlint, formatting, and diff checks pass.
- Real-device/browser behavior listed above remains `unverified-platform`.

## Completion Criteria

- Text, numeric, form, controlled, reset, pointer, wheel, keyboard, ARIA, and SSR layers have explicit invariants and evidence.
- Every compatible verified gap has a regression test or a recorded intentional/platform classification.
- Public high-level APIs and slots remain intact; no upstream compound API was copied.
- No unclassified InputNumber parity gap remains.
