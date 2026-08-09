# Progress Base UI Parity Plan

## Status

Complete. The local implementation and focused regression suite were audited against both pinned upstream state models. All compatible behavior gaps were closed, Moraine-owned API differences were preserved, and browser-only visual behavior remains explicitly unverified-platform.

Completed coverage includes non-finite indeterminate values, invalid and zero maxima, exact fractional percentages, synchronized part state, lazy single-evaluated renderers, stable duplicate steps, renderer failure containment, passive interaction, and deterministic SSR hydration through determinate, indeterminate, and complete transitions.

## Goal

Align Progress value normalization, status transitions, ARIA output, render callbacks, orientation, reactivity, SSR, and numeric boundaries while retaining Moraine's step-capable API.

## Local Surface

- Source: `src/elements/progress/progress.tsx`; public surface: `Progress`, `ProgressProps`, and `ProgressT` status/step render types and slots.
- Variants: `src/elements/progress/progress.class.ts`.
- Focused tests: `src/elements/progress/progress.test.tsx`.

## Upstream References

- Base UI pin `3011fba8f`: `base-ui/packages/react/src/progress/`, especially root normalization/status-cycle tests and indicator/label/value synchronization.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/progress/`, especially clamping, negative/custom ranges, indeterminate and complete/loading state tests.
- Moraine has fixed minimum zero and array steps; compare behavior without copying compound parts, min/format/locale APIs, or styles.

## Audit and Implementation

1. **Keyboard and focus:** Progress is read-only and must add no tab stop or keyboard interaction.
2. **ARIA and disabled semantics:** verify role, labels, determinate `aria-valuemin/max/now/text`, indeterminate omission, orientation exposure where applicable, and complete/loading/indeterminate data state. Do not invent disabled semantics.
3. **Pointer and touch:** remain passive with no event cancellation or hit-target behavior.
4. **Controlled and nested composition:** audit reactive value/max/status/renderers, numeric max versus step array, callback getter freshness, multiple Progress instances, and stable status/step node identity. All composed parts must update in one consistent reactive cycle.
5. **SSR and platform behavior:** normalization, percent, transforms, status/steps, and renderer output must be deterministic through hydration; animation rendering is structural only in jsdom and visual claims remain unverified.
6. **Empty, error, and boundary states:** cover null/undefined/NaN/infinities, below zero/above max, zero/negative/invalid max, empty/single-step arrays, duplicate labels, fractional values, rounding ties, custom label failures, and transitions determinate↔indeterminate↔complete.
7. Add a failing regression before each smallest equivalent normalization/state fix and classify unsupported upstream range/format APIs explicitly.

## Public API

Preserve `ProgressProps`, zero minimum, numeric-or-step `max`, render callbacks, slots, orientation, animations, and variants. Do not add upstream compound parts, min/locale/format APIs, or styling.

## Test Plan

- Focused: `bun run test src/elements/progress/progress.test.tsx`.
- Validate types: `bun run typecheck`.
- Conditional status/steps JSX changes require getter-backed single evaluation and `renderToString -> hydrate -> determinate/indeterminate updates` coverage.

## Completion Criteria

- Normalization, ARIA, synchronization, states, renderers, boundaries, SSR, and visual-platform limits have dispositions.
- Every fix is covered and focused/type checks pass.
- API and styling differences are recorded, not ported.

## Dependencies and Handoff

Progress is largely isolated; coordinate only if shared render-prop behavior changes, in which case the shared helper owner runs its suite first. Preserve the current matrix mapping to both direct counterparts.
