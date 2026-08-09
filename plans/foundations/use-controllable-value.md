# useControllableValue Base UI Parity Plan

Status: Complete

## Goal

Make the public controlled/uncontrolled state primitive predictable for every current consumer without moving component callbacks into the hook.

## Local Surface

- Implementation: src/shared/use-controllable-value.ts
- New focused tests: src/shared/use-controllable-value.test.ts
- Public export: src/utils.ts
- High-risk consumers: accordion, collapsible, checkbox, input-number, radio-group, select, multi-select, switch, tabs, stepper, modal, popper, menu, and dropdown-menu.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/utils/src/useControlled.ts and its spec/test files.
- Kobalte 2e8ce473: kobalte/packages/core/src/primitives/create-controllable-signal/.
- Prefer upstream source and tests over documentation; adapt semantics to Solid rather than copying the React API.

## Audit and Implementation

1. Inventory every setter call and confirm whether callers expect a direct value, a functional updater, or a callback side effect.
2. Snapshot defaultValue once for uncontrolled initialization instead of treating it as a reactive fallback.
3. Determine controlled mode explicitly from value() !== undefined and preserve the last uncontrolled value across controlled/uncontrolled transitions.
4. Extend the setter to accept a direct value or a Solid-style functional updater, resolve it untracked against the current exposed value, and short-circuit with Object.is.
5. In controlled mode, compute safely but do not mutate local state. Do not add an onChange option; existing components remain responsible for their public callbacks.
6. Preserve support for undefined as the local uncontrolled value and document the resulting mode boundary.

## Public API

- Add functional updater support to the returned setter.
- Keep the options object and tuple shape unchanged.
- Do not copy Base UI event details or Kobalte helper API.

## Test Plan

- Cover default initialization, uncontrolled updates, controlled no-op writes, mode transitions, undefined, functional updaters, stale-closure avoidance, Object.is equality, and getter evaluation count.
- Run: bun run test src/shared/use-controllable-value.test.ts
- Run affected component suites, then bun run typecheck and bun run test.

## Completion Criteria

- Every current consumer is audited and remains callback-compatible.
- Focused and consumer regression tests pass with no new warnings.
- parity-matrix.md records the upstream evidence, outcome, and any intentional difference.

## Dependencies and Handoff

- Execute before all stateful component and overlay plans.
- Changes to this file have one owner; component agents must report shared gaps instead of modifying it concurrently.
