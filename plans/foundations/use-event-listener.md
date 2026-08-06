# useEventListener Base UI Parity Plan

Status: Ready for hand-off

## Goal

Guarantee stable event listener registration, latest-handler dispatch, cleanup, and SSR behavior for shared and overlay consumers.

## Local Surface

- Implementation: src/shared/use-event-listener.ts
- Tests: src/shared/use-event-listener.test.ts
- Consumers include transition presence, media query, modal, popper, menu, context menu, select, and resizable behavior.

## Upstream References

- Base UI 3011fba8f: component-local listeners and utilities under base-ui/packages/react/src/internals and floating-ui-react.
- Kobalte 2e8ce473: component-local listener patterns throughout dialog, dismissable-layer, popper, and menu.
- There is no direct one-to-one primitive; compare lifecycle behavior rather than API shape.

## Audit and Implementation

1. Verify target changes detach the old listener before attaching the new target.
2. Ensure handler changes use the latest callback without duplicate registrations.
3. Compare capture, passive, once, AbortSignal, and boolean options where the local API supports them.
4. Verify listener maps add and remove exactly the registered event set.
5. Cover disabled or undefined targets, repeated setup, owner cleanup, and server execution without window/document.
6. Keep event typing precise and avoid any or framework-specific event wrappers.

## Public API

- Preserve current function names, arguments, and return behavior.
- Add options only if an existing consumer needs them to close a confirmed gap.

## Test Plan

- Extend focused tests for retargeting, latest handlers, option changes, duplicate prevention, cleanup, maps, and SSR.
- Run: bun run test src/shared/use-event-listener.test.ts
- Run affected overlay and transition suites, then bun run typecheck.

## Completion Criteria

- Registration and cleanup counts are deterministic in all supported lifecycle paths.
- No consumer retains a detached target or stale handler.
- Matrix outcome cites the exact upstream patterns used.

## Dependencies and Handoff

- Complete before useTransitionPresence, useMediaQuery, and overlay foundation plans.
- This shared file has a single implementation owner.
