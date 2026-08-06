# Dialog Base UI Parity Plan

Status: Ready for hand-off — the pinned upstream audit is not complete; existing fixes and tests are baseline evidence only.

## Goal

Align Dialog's modal focus lifecycle, accessible naming, trigger/content ownership, nested overlays, portal, scroll lock, dismissal, controlled state, transition presence, and SSR behavior while preserving its Card-based shell.

## Local Surface

- Implementation and classes: src/overlays/dialog/dialog.tsx and dialog.class.ts.
- Public export: src/overlays/dialog/index.ts.
- Focused tests: src/overlays/dialog/dialog.test.tsx.
- Component family: Dialog shell, title/description/header/body/footer/close, ModalRoot, ModalTrigger, ModalContent, Popup/Card styling composition, and CommandPalette consumer coverage.
- Shared infrastructure: src/overlays/base/modal.tsx, overlay-stack.ts, trigger.ts, utils.ts, and transition/controllable shared hooks.

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/dialog/ and alert-dialog/, plus utils/InternalBackdrop.tsx, useAnchoredPopupScrollLock.ts, and useSwipeDismiss.ts/tests where behavior is applicable.
- Kobalte 2e8ce473: kobalte/packages/core/src/dialog/, alert-dialog/, dismissable-layer/, and focus/escape/interact-outside/hide-outside primitives.
- Compare source and tests, adapting ownership to Solid and the existing comprehensive Dialog API.

## Audit and Implementation

1. Map controlled/uncontrolled open, trigger, initial/last focus, focus trap, title/description IDs, top overlay, dismiss attempts, exit presence, focus restore, and callback ordering.
2. Compare Enter/Space trigger activation, Tab/Shift+Tab trapping, Escape top-layer dismissal, close control behavior, autofocus selection, and nested Dialog/CommandPalette focus transitions.
3. Verify role=dialog, aria-modal, labelledby/describedby, missing title/description behavior, backdrop hiding, inactive-content isolation, disabled/custom triggers, and close naming.
4. Audit pointer/touch outside press, backdrop clicks, drag/release across boundaries, text-selection clearing, prevented events, scrollbar interactions, and duplicate onClosePrevent suppression.
5. Cover controlled rejection, rapid open/close, trigger removal, no trigger, no content/header, fullscreen/scrollable, dismissible=false, overlay=false, nested/sibling overlays, and unmount during exit.
6. Verify portal targets, overlay stack, body scroll lock reference counting, outside focus, descendant-overlay containment, top-only dismissal, and deterministic focus restoration after exit.
7. Audit iOS/Android virtual keyboard, Safari focus/scroll, pointer versus touch, reduced motion, and browser-specific backdrop behavior; mark real-engine-only proof unverified-platform.
8. Preserve current JSX single evaluation and add renderToString-to-hydrate open/close/focus coverage whenever trigger, content, header, body, footer, close, or conditional presence changes.

## Public API

- Preserve DialogProps/DialogT, shell slots, controlled props, dismissible/onClosePrevent, overlay, scrollable/fullscreen, trigger renderer, and defaults.
- Do not port Base UI compound parts, event details, alert-dialog API, polymorphism, styling, or animation design.

## Test Plan

- Add focused regressions for every confirmed keyboard, focus, ARIA, pointer/touch, controlled, nested, portal, dismissal, SSR, platform, and boundary gap.
- Run: bun run test src/overlays/dialog/dialog.test.tsx
- Run: bun run test src/overlays/base/modal.test.tsx
- Run Popup, Sheet, SidebarFrame, and CommandPalette consumer suites for shared Modal changes, then bun run typecheck.

## Completion Criteria

- Focus trapping/restoration, naming, scroll lock, portal lifetime, and dismissal are deterministic for nested and controlled dialogs.
- Conditional JSX remains single-evaluation and hydration order matches server markup.
- parity-matrix.md records pinned evidence and tests with no unclassified Dialog or Modal-consumer gap.

## Dependencies and Handoff

- Requires useControllableValue, useEventListener, useTransitionPresence, overlay stack, and Modal foundation first; Popper and Menu foundations must be classified before nested consumer validation.
- Modal defects belong to the Modal foundation owner; this plan owns only Dialog shell/orchestration and consumer tests.
- Historical nested-overlay fixes do not complete the current pinned audit.
