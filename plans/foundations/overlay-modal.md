# Modal Overlay Foundation Base UI Parity Plan

Status: Ready for hand-off

## Goal

Stabilize the shared modal engine that owns presence, dismissal, focus containment/restoration, nested overlay ordering, portal behavior, and scroll locking for Dialog, Popup, Sheet, and SidebarFrame.

## Local Surface

- Core: src/overlays/base/modal.tsx
- Shared support: src/overlays/base/overlay-stack.ts, trigger.ts, and utils.ts
- Tests: src/overlays/base/modal.test.tsx plus consumer suites under dialog, popup, sheet, and sidebar-frame.

## Upstream References

- Base UI 3011fba8f: dialog, alert-dialog, drawer, internals/FocusGuard, hideOtherElements, InternalBackdrop, useAnchoredPopupScrollLock, and useSwipeDismiss.
- Kobalte 2e8ce473: dialog, dismissable-layer, create-focus-scope, create-hide-outside, create-interact-outside, and create-escape-key-down.

## Audit and Implementation

1. Map open, present, trigger, content, overlay, and top-layer states, including controlled close during exit.
2. Compare initial focus, tab containment, focus-in recovery, restore target capture, removed/disabled triggers, and nested overlay restore order.
3. Audit Escape, outside pointer/focus, event cancellation, non-dismissible feedback, trigger/content competition, and descendant portals.
4. Verify background accessibility isolation, aria-modal/role ownership, scroll-lock reference counting, scrollbar compensation, and cleanup.
5. Cover open-on-mount, no trigger, no content/overlay, rapid reopen, unmount while open, and transition completion ordering.
6. Port only the smallest shared behavior. Keep Dialog-specific labelling and Sheet-specific gestures in their component plans.
7. If JSX presence or render props change, cache raw values once and prove server/client creation order with the SSR safety gate.

## Public API

- Preserve ModalRoot, ModalTrigger, and ModalContent contracts and all consumer props.
- Do not copy Base UI render/event-detail APIs. Add no new public component props as part of this foundation.

## Test Plan

- Expand modal foundation tests for focus entry/trap/restore, nested stacks, outside interaction, cancellation, scroll-lock ownership, unmount, rapid reopen, and SSR.
- Run: bun run test src/overlays/base/modal.test.tsx
- Run Dialog, Popup, Sheet, SidebarFrame, Popover, DropdownMenu, ContextMenu, Tooltip, and Select suites to catch stack competition.
- Finish with bun run typecheck and bun run test.
- If conditional JSX changes, run bun run docs:preview and inspect representative overlay routes in production hydration.

## Completion Criteria

- Only the top eligible overlay dismisses and restores focus in deterministic order.
- No scroll lock, listener, hidden-background state, or overlay-stack entry leaks.
- All confirmed gaps have regression tests; platform-only proof limits are recorded.

## Dependencies and Handoff

- Requires useControllableValue, useEventListener, and useTransitionPresence.
- Must be completed before Dialog, Popup, Sheet, and SidebarFrame plans.
- One owner controls all base overlay files during this phase.
