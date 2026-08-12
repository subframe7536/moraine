# Popup Base UI Parity Plan

Status: Complete

## Goal

Classify Popup's Modal-backed portal, dismissal, accessible naming, JSX ownership, and SSR behavior while retaining Moraine's comprehensive shell API.

## Local Surface

- Implementation and tests: src/overlays/popup/popup.tsx and popup.test.tsx.
- Shared foundations: Modal, overlay stack, trigger, transition presence, and createLazyMemo.

## Parity Outcome

- `title`, `description`, and `ariaLabel` provide deterministic dialog naming; zero and empty JSX values remain valid content.
- Content/title/description are cached once, closed content stays uninstantiated, and hydration preserves the trigger through the first open.
- Popup intentionally remains a high-level Modal shell instead of exposing Base UI compound parts, portal primitives, or event-detail APIs.
- Touch synthesis, viewport geometry, focus paint, and assistive-technology announcements remain platform-owned and are verified in production browsers only.

## Test Plan

- Cover title/description relationships, explicit labels, getter single reads, closed-content laziness, controlled dismissal, nested overlays, and SSR hydration.
- Run Popup, Modal, Dialog, and shared overlay foundation suites plus typecheck.
