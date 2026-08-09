# Avatar Base UI Parity Plan

## Status

Complete.

## Goal

Harden `Avatar` image loading, fallback visibility, status callbacks, accessibility, source changes, and SSR hydration without changing Moraine's visual or item-oriented API.

## Local Surface

- Source: `src/elements/avatar/avatar.tsx`; public surface: `Avatar`, `AvatarProps`, `AvatarT`, `AvatarStatus`, and the currently re-exported `AvatarFace`/`AvatarFaceProps` implementation surface.
- Variants: `src/elements/avatar/avatar.class.ts`.
- Focused tests: `src/elements/avatar/avatar.test.tsx` (shared with `AvatarGroup`).
- Direct dependency: `src/elements/icon/icon.tsx` for fallback and badge icons.

## Upstream References

- Base UI pin `3011fba8f`: `base-ui/packages/react/src/avatar/`, especially `image/useImageLoadingStatus.ts`, image/fallback tests, and the cached-image SSR hydration case.
- Kobalte pin `2e8ce473`: `kobalte/packages/core/src/image/`, especially root/image/fallback state and `image.test.tsx`.
- Kobalte calls the equivalent primitive `Image`; compare behavior, not naming or API shape.

## Audit and Implementation

1. **Keyboard and focus:** Avatar is non-interactive; verify it creates no tab stop and that custom root attributes cannot accidentally alter image/fallback ownership. Badge icons remain non-interactive unless a consumer provides semantics on the root.
2. **ARIA and disabled semantics:** verify image `alt` behavior for meaningful and decorative avatars, fallback text exposure, icon fallback hiding, status/badge duplication, and caller `aria-label`/`aria-hidden` overrides. Disabled behavior is not applicable and must not be invented.
3. **Pointer and touch:** preserve passive rendering with no internal pointer cancellation or click behavior; confirm composed badges do not intercept events unexpectedly.
4. **Controlled and nested state:** audit reactive `src`, `alt`, `text`, `fallback`, and callback changes; stale loaders must not win after rapid source replacement or unmount. `onStatusChange` must be ordered, deduplicated, and observe cached success/error without spurious idle transitions.
5. **SSR and platform behavior:** compare cached-image hydration, server fallback markup, `window.Image` availability, image cache timing, load/error events, and hydration without fallback flash. Ensure server output is deterministic and browser-only loading starts after ownership is established; mark real cache/engine cases not proven in jsdom as `unverified-platform`.
6. **Empty, error, and boundary states:** cover missing/whitespace `src`, empty `alt`/`text`, broken URLs, cached errors, source churn, load after cleanup, fallback initials for unusual whitespace, and image/fallback exclusivity during transitions.
7. Add a failing test for each confirmed gap before the smallest local state-machine change. Classify every audited behavior with exact Base UI/Kobalte source or test evidence.

## Public API

Preserve `AvatarProps`, `AvatarT.Item`, `AvatarStatus`, status callback values, fallback rules, and current slots/defaults. Do not add Base UI fallback-delay/compound-part props or copy upstream styles. Treat the re-exported `AvatarFace` surface as compatibility-sensitive unless separately approved.

## Test Plan

- Focused: `bun run test src/elements/avatar/avatar.test.tsx`.
- Icon regression when fallback semantics change: `bun run test src/elements/icon/icon.test.tsx src/elements/avatar/avatar.test.tsx`.
- Validate types: `bun run typecheck`.
- If image/fallback conditional JSX changes, add getter-backed single-evaluation tests and a `renderToString -> hydrate -> image load/error` gate, including a cached-image scenario with identical server/client node order.

## Completion Criteria

- The status machine, stale-event cancellation, accessible output, and SSR/cache cases have current-pin dispositions.
- Every ported gap has a regression test; focused tests and typecheck pass.
- No upstream API or visual transition design is transplanted, and platform-only claims are labeled.

## Dependencies and Handoff

Coordinate with the `avatar-group` and `icon` plans because `AvatarFace` is shared. Avoid concurrent edits to `avatar.tsx` while the group audit is running. The parity matrix currently groups Avatar but must explicitly preserve evidence for the standalone and group surfaces before the parent todo can close.
