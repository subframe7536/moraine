# useLoadingAuto Parity Plan

Status: Ready for hand-off

## Goal

Define and test automatic loading state around synchronous and asynchronous actions without stale completion, unhandled rejection, or post-unmount updates.

## Local Surface

- Implementation: src/shared/use-loading-auto.ts
- Public export: src/utils.ts
- Primary consumer: Button asynchronous loading behavior.
- New focused tests: src/shared/use-loading-auto.test.ts

## Upstream References

- Base UI 3011fba8f and Kobalte 2e8ce473 have no direct counterpart.
- Use their Button disabled/pending interaction tests only as behavioral context; do not invent a copied API.

## Audit and Implementation

1. Document how plain values, thrown errors, native promises, and thenables affect loading.
2. Verify loading begins and settles at the intended event boundary.
3. Define deterministic behavior for overlapping actions and out-of-order completion using the existing public contract.
4. Preserve rejection propagation while guaranteeing loading cleanup.
5. Prevent stale async completion from updating disposed owners.
6. Confirm controlled Button loading and automatic loading do not double-disable or double-invoke actions.

## Public API

- Preserve the current hook and Button APIs.
- Do not add cancellation or task-management abstractions unless a confirmed current flow requires them.

## Test Plan

- Add direct tests for sync return, resolve, reject, throw, thenable, overlap, stale completion, and disposal.
- Run: bun run test src/shared/use-loading-auto.test.ts
- Run: bun run test src/elements/button/button.test.tsx
- Finish with bun run typecheck.

## Completion Criteria

- Every completion ordering has a documented result and regression test.
- Errors are not swallowed and loading cannot remain stuck.
- The no-direct-counterpart decision is recorded in parity-matrix.md.

## Dependencies and Handoff

- Complete before the Button plan.
- Coordinate with useControllableValue only if Button loading state shares controlled-state behavior.
