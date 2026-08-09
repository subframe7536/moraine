# useMediaQuery Base UI Parity Plan

Status: Complete

## Goal

Make media query state reactive, leak-free, SSR-safe, and compatible with modern and legacy MediaQueryList listener APIs.

## Local Surface

- Implementation: src/shared/use-media-query.ts
- Public export: src/utils.ts
- Primary consumer: SidebarFrame responsive behavior.
- New focused tests: src/shared/use-media-query.test.ts

## Upstream References

- Base UI 3011fba8f: base-ui/packages/react/src/unstable-use-media-query/.
- Kobalte 2e8ce473: no direct primitive; use browser-safe listener patterns only where applicable.

## Audit and Implementation

1. Compare initial matching, query changes, listener setup, and cleanup with Base UI.
2. Support addEventListener/removeEventListener and legacy addListener/removeListener only where confirmed by upstream compatibility logic.
3. Handle missing matchMedia during SSR and test environments without creating a hydration-only branch.
4. Verify rapid query changes cannot leave listeners attached to old MediaQueryList objects.
5. Define initial server fallback and first client update using the existing API.
6. Avoid global caches or shared mutable MediaQueryList state.

## Public API

- Preserve the existing accessor contract.
- Do not copy Base UI React options unless required by a current Moraine consumer.

## Test Plan

- Add focused tests for initial match, change events, query replacement, modern/legacy listeners, cleanup, missing matchMedia, and SSR.
- Run: bun run test src/shared/use-media-query.test.ts
- Run: bun run test src/navigation/sidebar-frame/sidebar-frame.test.tsx
- Finish with bun run typecheck.

## Completion Criteria

- Exactly one active listener exists for the current query.
- SSR and client initialization are deterministic under the current API.
- Browser-only proof limitations are marked unverified-platform in the matrix.

## Dependencies and Handoff

- Requires useEventListener lifecycle semantics to be settled first.
- Complete before SidebarFrame.
