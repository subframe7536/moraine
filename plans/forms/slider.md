# Slider Base UI Parity Plan

## Status

- Ready for audit and implementation after shared controllable-value and FormField semantics are stable.
- Reference revisions are fixed at Base UI 3011fba8f and Kobalte 2e8ce473.

## Goal

Align Slider's single/range state machine, keyboard, pointer/touch, focus, ARIA, native form, controlled state, direction/orientation, platform, and SSR behavior with pinned upstream evidence while preserving Moraine's comprehensive API and visual variants.

## Local Surface

- Component source: src/forms/slider/slider.tsx
- State engine: src/forms/slider/hook/use-slider.ts
- Math/direction helpers: src/forms/slider/utils.ts
- Styles: src/forms/slider/slider.class.ts
- Tests: src/forms/slider/slider.test.tsx
- Shared/form dependencies: src/shared/hidden-input.tsx and src/forms/form-field/form-field-context.ts
- Public surface: Slider, SliderProps, SliderT members Value, Slot, Variant, Classes, Styles, Item, Base, Props; useSlider and UseSliderReturn are also exported from the slider entrypoint.

## Upstream References

- Base UI 3011fba8f direct counterpart: base-ui/packages/react/src/slider, especially root, control, track, thumb, indicator, value/label, utils, and tests.
- Kobalte 2e8ce473 direct Solid counterpart: kobalte/packages/core/src/slider, especially create-slider-state.ts, root, track, fill, thumb, input, value-label, utils, and any pinned tests.
- Historical Moraine commits are evidence only.

## Audit and Implementation

1. Create an evidence-linked state-machine ledger covering value normalization, active thumb, focus thumb, interaction phase, and commit phase.
2. Audit value math: min/max inversion or equality, omitted versus zero/invalid step, snapping/rounding precision, number/range normalization, duplicate values, minStepsBetweenThumbs, crossing enabled/disabled, external bound changes, and stable thumb identity.
3. Audit keyboard/focus: Arrow direction by orientation/RTL/inverted, PageUp/Down, Home/End per-thumb boundaries, blocked movement and adjacent-thumb focus, repeat keydown with one commit, missed keyup/blur, disabled/readOnly, focus-visible, and overlapping thumbs.
4. Audit pointer/touch/pen: track press chooses the correct thumb, overlapping-thumb tie-break, pointer capture/move/release/cancel/lost capture, cross-thumb dragging and reversal, scroll suppression, multi-pointer guards, live versus commit callbacks, pointer focus styling, and unmount cleanup.
5. Audit ARIA: slider roles per thumb, value min/max/now/text, orientation, labels and described-by, disabled/readonly/invalid/required policy, set ownership for range thumbs, and unique stable IDs.
6. Audit native form behavior: one or repeated same-name hidden inputs for ranges, selection order, disabled omission, required validity policy, reset to defaults, controlled reset, FormData numbers-as-strings, and FormField event flow.
7. Audit controlled state: scalar/array payload preservation, external updates during drag, no-op emissions, callback cloning/order, controlled DOM stability, prop changes while focused, and Object.is/array equality decisions.
8. Audit SSR/hydration and platform quirks: geometry only after mount, deterministic thumb/hidden-input order, no document access on server, stable style variables/IDs, touch-action behavior, and browser pointer-capture differences.
9. Port state invariants into useSlider/utils and rendering semantics into Slider. Conditional thumb/divider JSX changes require prop single evaluation plus renderToString-to-hydrate tests for scalar/range and horizontal/vertical cases.

## Public API

- Preserve Slider, SliderProps, SliderT.Value, useSlider exports, callback phase semantics, variants, and slots.
- Do not copy Base UI/Kobalte compound primitives, styling, tooltips, labels, or animations.
- Add no upstream API solely for parity; document unsupported capabilities as intentional differences unless required for current-contract correctness.

## Test Plan

- Focused: bun run test src/forms/slider/slider.test.tsx
- State/math helpers: run focused test files under src/forms/slider/hook and src/forms/slider when present.
- Form integration: bun run test src/forms/form-field/form-field.test.tsx src/forms/form/form.test.tsx
- Shared hidden input/control smoke: bun run test src/forms/input-number/input-number.test.tsx
- Final touched slice: bun run typecheck
- Add math precision/bound cases, RTL/inverted keyboard matrix, dynamic controlled updates, pointer lost-capture/multi-pointer/unmount, overlapping thumb identity, native FormData/reset, ARIA per-thumb values, JSX evaluation, and hydration.

## Completion Criteria

- Value, focus, active-thumb, input, and commit transitions are decision-complete and evidence-classified.
- Keyboard, pointer, native form, ARIA, controlled state, and SSR gaps have regression tests.
- Slider, helper, FormField, InputNumber smoke, and typecheck pass.
- Thumb DOM identity and callback phase semantics remain stable.

## Dependencies/Handoff

- Coordinate shared controllable-value, hidden-input, and FormField changes with other form owners.
- Treat useSlider as the owner of interaction/value invariants; avoid parallel fixes in rendering.
- Handoff must include the state transition table, math/direction policy, native range serialization, callback timing, platform caveats, and validation results.
