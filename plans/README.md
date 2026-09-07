# Implementation Plans

Plan 001 was generated on 2026-09-06 against `1653a377` (`style-refactor`) and completed on 2026-09-07. The Design migration, compound DOM ownership, namespace extraction, legacy removal, CSS consumers, and docs are implemented. Typecheck has zero errors; QA, all 1786 tests, both type fixtures, production docs build, and diff checks pass. Production browser verification covers 13 routes at three widths plus nested overlays and reactive Design/native-ref behavior; see the plan's execution evidence.

## Execution order and status

| Plan                                  | Title                                                              | Priority | Effort | Depends on | Status |
| ------------------------------------- | ------------------------------------------------------------------ | -------- | ------ | ---------- | ------ |
| [001](001-design-and-component-dx.md) | Move presentation into Design and finalize component DOM ownership | P1       | L      | None       | DONE   |

Statuses: TODO, IN PROGRESS, DONE, BLOCKED (include reason), REJECTED (include rationale).

## Dependency notes

Execute plan 001 as one migration in this order: baseline/inventory → Design core → Button reference (extracting `button.types.ts`) → ordinary component families (`*.types.ts` type decoupling & Design migration) → native refs → Dialog and other overlay parts (`dialog.types.ts`, etc.) → legacy removal → CSS consumer integration → docs and production verification. Do not ship a mixed old/new presentation architecture. Tests and direct callers migrate with each stage; user-facing docs prose is finalized after the APIs work.

## Decisions and rejected approaches

- Move component public namespaces (`<Component>T`) and top-level `{Component}Props` into dedicated, colocated `*.types.ts` files across all component families. This cleanly decouples component type declarations from JSX/Solid runtime (`*.tsx`) and style recipes (`*.class.ts`), preventing circular dependencies and bundle leaks when `Design` imports component schemas.
- Missing Provider produces a development warning and empty presentation, not an exception or automatic official fallback; this resolves contradictory wording in the source draft.
- Keep component-local official recipe definitions; remove their component runtime ownership, not the files that Design still needs.
- Modal remains Design-backed. Collapsible is a documented structural exception: it retains only its height-transition behavior and exposes no Design slots.
- Reuse Modal primitives for Dialog/Sheet; do not duplicate lifecycle/focus algorithms.
- Named native refs use callbacks as the documented reliable form; variable-assignment shorthand must be proven with a compiler/runtime fixture before being claimed.
- Keep fixed component variants, high-level menu/select APIs, and existing docs design. Generic slotProps, runtime variant augmentation, dependency upgrades, and unrelated cleanup are excluded.

## Coverage limits

Recon and focused investigation covered styling/Provider/recipe architecture, representative component paths, overlay anatomy, native-ref sites, package/export and CSS integration, test infrastructure, and docs generation. No general security audit, full behavioral audit of every component, external prior-art comparison, or remote branch freshness verification was performed.
