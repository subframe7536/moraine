# Popper Overlay Foundation Base UI Parity Plan

Status: Complete

## Goal

Harden shared anchored positioning, presence, dismissal boundaries, and browser lifecycle behavior used by Popover, Tooltip, Popup, and Select-related floating surfaces.

## Local Surface

- Core: src/overlays/base/popper.tsx
- Shared positioning/dismissal helpers: src/overlays/base/menu/menu.utils.ts where consumed.
- Tests: src/overlays/base/popper.test.tsx and Popover, Tooltip, Popup, Select, DropdownMenu, and ContextMenu suites.

## Upstream References

- Base UI 3011fba8f: floating-ui-react, internals/useAnchorPositioning, usePositioner, and popup positioning tests.
- Kobalte 2e8ce473: popper source/tests.
- Floating behavior must remain implemented through the existing @floating-ui/dom dependency.

## Audit and Implementation

1. Compare anchor resolution, fixed/absolute strategy, placement, offset/gutter, flip/shift, overflow padding, transform origin, and available-size CSS variables.
2. Verify positioning starts only when anchor and floating elements exist and stops on close, replacement, and unmount.
3. Audit resize, scroll, layout shift, viewport changes, disconnected nodes, zero-size anchors, and nested scrolling containers.
4. Confirm virtual/context anchors used by context menu or popup remain compatible with the current local API.
5. Verify controlled open/presence timing, rapid reopen, portal mounting, z-index propagation, and no eager closed content.
6. Keep dismissal, focus, and role behavior in Modal/Menu or component owners unless Popper currently owns it.
7. For layout behavior not provable in jsdom, reuse upstream guards and record unverified-platform evidence instead of adding browser infrastructure.

## Public API

- Preserve current placement, sizing, trigger, and render contracts.
- Do not add Floating UI or Base UI API surface that has no current Moraine consumer.

## Test Plan

- Extend focused tests for lazy mount, lifecycle cleanup, placement data, anchor replacement, rapid close/reopen, missing geometry APIs, and SSR.
- Run: bun run test src/overlays/base/popper.test.tsx
- Run Popover, Tooltip, Popup, Select, DropdownMenu, and ContextMenu suites.
- Finish with bun run typecheck and bun run test.

## Completion Criteria

- Positioning observers/listeners exist only while required and never target detached nodes.
- State and CSS variable outputs match supported upstream behavior.
- Every real-layout limitation is explicitly classified in parity-matrix.md.

## Dependencies and Handoff

- Requires useControllableValue, useEventListener, and useTransitionPresence.
- Complete before Popover, Tooltip, Popup, and position-dependent menu/select work.
- One owner controls Popper and shared positioning helpers.
