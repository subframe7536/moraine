# useTransitionPresence Base UI Parity Plan

Status: Complete

## Goal

Ensure enter/exit presence settles reliably across no-motion, interrupted, reopened, multi-property, SSR, and detached-element cases.

## Local Surface

- Implementation: src/shared/use-transition-presence.ts
- Tests: src/shared/use-transition-presence.test.tsx
- Consumers: Accordion, Collapsible, Select, Modal, Popper, Menu, and all overlay components.

## Upstream References

- Base UI 3011fba8f: internals/useTransitionStatus.ts, getDisabledMountTransitionStyles.ts, and styles utilities/tests.
- Kobalte 2e8ce473: primitives/create-transition/.

## Audit and Implementation

1. Compare initial mount, delayed enter, exit retention, transitionend/animationend, and no-motion settlement.
2. Verify reopen cancels stale exit completion and never unmounts the new presence.
3. Audit multiple CSS properties/animations, bubbled child events, cancellation events, zero duration/delay, and detached elements.
4. Ensure fallback timing cannot fire after a newer transition or owner disposal.
5. Keep server and initial hydration trees identical; do not eagerly instantiate closed overlay content.
6. Preserve data attributes and onExitComplete ordering used by consumers.

## Public API

- Preserve the current returned accessors and setElement contract.
- Do not change visual duration/easing classes; styling parity is a separate task.

## Test Plan

- Extend focused tests for interruption, stale events/timers, nested targets, multiple properties, no motion, cleanup, SSR, and callback ordering.
- Run: bun run test src/shared/use-transition-presence.test.tsx
- Run all Accordion, Collapsible, Select, and overlay suites, then bun run typecheck.
- If JSX presence trees change, run production docs preview and inspect hydrated DOM.

## Completion Criteria

- Presence cannot settle from a stale event, timer, or detached element.
- Consumer exit callbacks fire once and only after the current exit completes.
- Matrix records any browser timing behavior not provable in jsdom as unverified-platform.

## Dependencies and Handoff

- Requires useEventListener to be complete.
- Freeze this behavior before overlay and disclosure component work.
