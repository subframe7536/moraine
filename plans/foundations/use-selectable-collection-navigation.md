# useSelectableCollectionNavigation Base UI Parity Plan

Status: Ready for hand-off

## Goal

Re-audit the shared keyboard navigation kernel against current Menu, Select, Tabs, Radio, Stepper, and Command Palette behavior without collapsing different ARIA patterns into one abstraction.

## Local Surface

- Implementation: src/shared/use-selectable-collection-navigation.ts
- Tests: src/shared/use-selectable-collection-navigation.test.ts
- Consumers: select, menu, radio-group, tabs, stepper, command-palette, and accordion where applicable.

## Upstream References

- Base UI 3011fba8f: menu, select, tabs, and toolbar navigation source/tests.
- Kobalte 2e8ce473: collection, list, selection, listbox, select, menu, tabs, and radio-group primitives.

## Audit and Implementation

1. Reconfirm orientation-aware arrows, RTL horizontal direction, Home/End, looping, disabled skipping, and empty collections.
2. Verify automatic versus manual activation keeps focus and selection intentionally separate.
3. Audit missing/current-value behavior, dynamic item removal, all-disabled collections, and boundary no-ops.
4. Confirm Enter and Space are handled only by ARIA patterns that own activation.
5. Keep typeahead in pattern-specific code unless identical normalization, timeout, and repeated-character behavior is proven across consumers.
6. Preserve caller cancellation and event.defaultPrevented semantics.

## Public API

- Preserve the current options and returned methods unless a confirmed shared invariant cannot be expressed.
- Do not add polymorphism or Base UI event-detail APIs.

## Test Plan

- Extend table-driven hook tests for direction, mode, disabled/boundary, dynamic collections, and cancellation.
- Run: bun run test src/shared/use-selectable-collection-navigation.test.ts
- Run affected Accordion, RadioGroup, Select, Tabs, Stepper, CommandPalette, DropdownMenu, and ContextMenu suites.
- Finish with bun run typecheck.

## Completion Criteria

- Shared behavior contains only invariants common to its consumers.
- Each consumer-specific difference is tested in the consumer plan, not hidden in the hook.
- Matrix cites current upstream source/tests rather than historical commits alone.

## Dependencies and Handoff

- Requires useControllableValue to be stable.
- Complete before stateful collection component plans.
