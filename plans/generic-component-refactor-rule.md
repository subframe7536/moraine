# Generic Component Refactor Rule

Use this rule when refactoring an existing Rock UI component toward a Zaidan-inspired internal structure while preserving an intentionally selected public API.

This is a decision-complete planning template and execution rule.  
Current project stage is pre-alpha, so breaking changes are allowed, but they must be explicit.

## 1) Required Plan Shape

Every refactor plan MUST include these sections:

1. `Summary`
2. `Public API Changes`
3. `Implementation Spec`
4. `Test and Validation Commands`
5. `Acceptance Criteria`
6. `Assumptions and Defaults Locked`

Do not start implementation until all six are filled and decision-complete.

## 2) Decision Lock Rules

Before coding, explicitly lock these decisions:

1. `Public component shape`
   - Single wrapper component only, or wrapper + subcomponents.
2. `Essential behavior API`
   - Which behavior props/events stay.
3. `Styling API`
   - Which style/icon/class override props stay.
4. `Breaking removals`
   - Which props/slots/events are removed.
5. `Data-slot contract`
   - Keep current slot names or migrate.
6. `Primitive policy`
   - Which third-party primitive is being removed (if any) and what replaces it.
7. `Scope`
   - Component-only vs component + playground/docs.

If any item is ambiguous, resolve it before implementation.

## 3) API Contract Rule

For refactors that replace internals:

1. Keep only the essential public API selected in the plan.
2. Define `Props` from Rock-owned props + native element passthrough (`ComponentProps<'...'>`) when removing external primitive prop inheritance.
3. Removed API must be reflected in:
   - exported TypeScript props
   - runtime rendering behavior
   - tests (including type-level checks for removed props when practical)
4. Preserve `classes` override semantics unless removal is explicitly approved.

## 4) Internal Architecture Rule

When dropping a third-party primitive:

1. Replace with semantic HTML structure (`nav/ul/li`, `button/a`, etc.) and Solid state logic.
2. Keep behavior parity for selected essential features:
   - controlled/uncontrolled state
   - computed ranges/items
   - boundary disabled behavior
   - callback emission semantics
3. Use existing Rock components as building blocks (`Button`, `Icon`, etc.) to keep design-system consistency.
4. Keep accessibility semantics (`aria-label`, `aria-current`, hidden assistive text, disabled behavior).

## 5) Styling Rule

1. Keep existing variant prop surface only if locked in plan.
2. Align slot styling with target Zaidan style guidance at slot level (not by importing Zaidan implementation).
3. Keep class merging predictable:
   - base style
   - variant style
   - per-slot override from `classes`
   - root `class` passthrough
4. If slot-level variants are unnecessary, prefer direct class composition in JSX.

## 6) Implementation Sequence

1. Update `*.tsx` props/types first.
2. Replace internals with Rock-owned behavior + semantic rendering.
3. Update `*.class.ts` to match locked style contract.
4. Rewrite `*.test.tsx` to the new contract.
5. Verify export surfaces (`index.ts`) if changed.
6. Run validation commands.

## 7) Test Matrix (Minimum)

Each refactor MUST test:

1. Core derived behavior math/state.
2. Controlled mode callbacks and stable active state.
3. Visibility toggles for optional controls/parts.
4. Link vs button rendering logic (if applicable).
5. Removed API no longer available (type-level guard where useful).
6. Boundary disabled behavior.
7. `classes` overrides merge into intended slots.
8. Data-slot names remain as locked in plan.

## 8) Validation Gate

Minimum required commands:

1. `bun run test <target-test> --run`
2. `bun run typecheck`
3. `bun run qa`

All must pass before closing the refactor.

## 9) Acceptance Checklist

A refactor is done only when all are true:

1. Target external primitive dependency is removed from the component implementation.
2. Public API matches the locked plan (including explicit removals).
3. Runtime behavior matches selected essential contract.
4. Tests validate both preserved behavior and removals.
5. QA pipeline passes cleanly.

## 10) Reusable Plan Template

Copy and fill this for each component:

```md
# <Component> Refactor Plan

## Summary

- ...

## Public API Changes

- Keep:
- Remove:
- Data-slot policy:

## Implementation Spec

1. <component>.tsx

- ...

2. <component>.class.ts

- ...

3. <component>.test.tsx

- ...

## Test and Validation Commands

- bun run test src/<component>/<component>.test.tsx --run
- bun run typecheck
- bun run qa

## Acceptance Criteria

- ...

## Assumptions and Defaults Locked

- ...
```
