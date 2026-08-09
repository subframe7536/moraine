# useListVirtualizer Parity Plan

Status: Complete

## Goal

Make the public Solid adapter around TanStack Virtual reliable for delayed refs, dynamic item sizes, cleanup, scrolling, and SSR while keeping List semantics in the List component plan.

## Local Surface

- Implementation: src/shared/use-list-virtualizer.tsx
- Public export: src/utils.ts
- Primary consumers and examples: src/elements/list/ and Select/MultiSelect virtualization paths.
- New focused tests: src/shared/use-list-virtualizer.test.tsx

## Upstream References

- Primary algorithm contract: installed @tanstack/virtual-core 3.17.x.
- Base UI 3011fba8f: virtualized collection behavior where present in select/menu examples and tests; no direct public hook.
- Kobalte 2e8ce473: listbox, collection, and selection primitives; no direct virtualizer adapter.

## Audit and Implementation

1. Verify construction before and after the scroll element becomes available.
2. Audit reactive count/options changes, estimate size changes, dynamic measurement, and observer cleanup.
3. Verify scrollToIndex/offset behavior is forwarded without stale instances or detached elements.
4. Cover zero items, rapid replacement, unmount, nested scroll containers, and missing browser observers.
5. Ensure server rendering does not read window, element geometry, or browser-only constructors.
6. Keep option identity and reactivity simple; do not introduce another abstraction over TanStack Virtual.

## Public API

- Preserve the current adapter contract and peer dependency model.
- Do not add Base UI collection APIs or move ARIA responsibility out of List/Select.

## Test Plan

- Add focused lifecycle tests with deterministic observer and geometry mocks.
- Run: bun run test src/shared/use-list-virtualizer.test.tsx
- Run: bun run test src/elements/list/list.test.tsx src/forms/select/select.test.tsx src/forms/select/multi-select.test.tsx
- Finish with bun run typecheck and bun run test:types.

## Completion Criteria

- Delayed mount, dynamic measurement, scrolling, cleanup, and SSR cases are classified and covered.
- No duplicate virtualizer or observer survives option changes or unmount.
- Matrix records that no direct Base UI/Kobalte counterpart exists.

## Dependencies and Handoff

- Complete before List, Select, and MultiSelect virtualization work.
- Geometry mocks must stay local unless at least two suites require an identical fixture.
