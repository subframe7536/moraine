# useDisclosureState Base UI Parity Plan

Status: Ready for hand-off

## Goal

Harden disclosure attributes and content measurement used by Accordion and Collapsible across reactive state changes, stale elements, SSR, and transition timing.

## Local Surface

- Implementation: src/shared/use-disclosure-state.ts
- New focused tests: src/shared/use-disclosure-state.test.tsx
- Consumers: src/elements/accordion/ and src/elements/collapsible/.

## Upstream References

- Base UI 3011fba8f: collapsible state mappings and disclosure consumers under base-ui/packages/react/src/collapsible/.
- Kobalte 2e8ce473: kobalte/packages/core/src/primitives/create-disclosure-state/ and create-toggle-state/.

## Audit and Implementation

1. Compare open, closed, expanded, and disabled data semantics with both references.
2. Verify measurement on initial mount, open changes, reactive content replacement, and element replacement.
3. Prevent queued measurements from writing data for a detached or superseded element.
4. Audit zero-height, hidden, empty, and rapidly reopened content.
5. Confirm server execution never requires document, layout APIs, or a mounted element.
6. Add ResizeObserver only if upstream evidence shows the current open-time measurements cannot cover an observable supported case.

## Public API

- Preserve the current returned accessors and setContentElement contract.
- Do not add styling variants or copy upstream component APIs.

## Test Plan

- Add direct tests for attributes, disabled state, initial and queued measurement, stale elements, empty content, and SSR-safe construction.
- Run: bun run test src/shared/use-disclosure-state.test.tsx
- Run: bun run test src/elements/accordion/accordion.test.tsx src/elements/collapsible/collapsible.test.tsx
- Finish with bun run typecheck.

## Completion Criteria

- Measurement and state attributes have no unclassified difference from the references.
- Accordion and Collapsible regressions pass.
- Any platform-only limitation is recorded in parity-matrix.md.

## Dependencies and Handoff

- Requires useControllableValue to be frozen first.
- Complete before Accordion and Collapsible component plans.
