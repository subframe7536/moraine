---
name: parity-port
description: 'Audit and port missing keyboard, accessibility, browser-compatibility, and edge-case behavior from mature prior-art libraries like Kobalte or Base UI into the current component. Use when closing parity gaps, comparing implementation details, or hardening interaction flows.'
argument-hint: [target component or feature, optional prior-art library]
---

# Parity Port

Use this skill when the user wants to close interaction parity gaps between the current implementation and a mature reference library.

## Inputs

1. `$ARGUMENTS` if it names the target component, feature, or reference library.
2. The nearest open file or selected code if it clearly identifies the target.
3. Otherwise ask for:
   - target component or feature
   - reference library or component
   - audit only, or implement + test

## Workflow

1. Identify the exact component surface, state machine, and user flows in scope.
2. Find the original implemention of component in `src/<category>/*`
3. Find the closest upstream components in `kobalte/packages/core/src/*` and `base-ui/packages/react/src/*`. clone it if not available.
4. Compare the target across:
   - keyboard map and focus order
   - ARIA roles, labels, and disabled semantics
   - pointer, touch, and click behavior
   - controlled, uncontrolled, and nested composition cases
   - portal, overlay, and focus-trap behavior if relevant
   - SSR, hydration, browser, and platform quirks
   - empty, disabled, error, and boundary states
5. Build a gap list sorted by user impact and regression risk.
6. If the user asked for audit only, stop here and return the gap list plus the recommended order.
7. Otherwise port the smallest behaviorally equivalent change into the local architecture.
8. Add or update tests for every gap you close.
9. Validate the touched slice with the narrowest useful test run, then typecheck or lint if needed.
10. Summarize what was ported, what intentionally diverged, and any remaining gaps.

## Decision Rules

- Prefer upstream source and tests over docs when they disagree.
- Prefer local conventions and APIs over copying upstream structure wholesale.
- Do not port styling or API shape unless the user explicitly asks for it.
- No polymorphism. Keep components comprehensive instead of primitive and headless.
- If a behavior requires a large refactor, split it into the smallest shippable increment and call out the remainder.
- If upstream behavior is undocumented or platform-specific, confirm it with code or tests before porting it.
- If parity would break a documented local contract, preserve the local contract and document the difference.

## Completion Checks

- Keyboard-only interaction covers the happy path and the boundary cases.
- Focus, escape, dismissal, and disabled-state behavior match the chosen reference.
- The relevant ARIA and semantics are correct in the rendered DOM.
- Regression tests cover the newly ported gaps.
- Validation passes for the touched files or component slice.
