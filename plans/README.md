# Base UI Parity Plan Index

Status: All form and navigation plans complete; 6 overlay component plans remain.

This directory splits the full Moraine behavior-parity sweep into independently assignable plans. Each component plan contains its own local surface, upstream references, audit dimensions, implementation constraints, tests, dependencies, and completion criteria.

## Fixed Reference Revisions

- Base UI: 3011fba8f
- Kobalte: 2e8ce473
- Local baseline: 71 test files and 1100 tests passing; bun run typecheck passing.

Base UI source and tests define the target behavior. Kobalte is the preferred translation reference for Solid ownership, reactivity, SSR, and hydration. Historical Moraine parity commits are evidence only and do not make a target audited against these revisions.

## Audit Snapshot

- The working tree rooted at `3c02b36` was audited on 2026-08-09 after Progress was completed.
- All 11 foundation plans plus every element and form plan are implementation-complete in the current working tree.
- All three navigation plans are implementation-complete with focused SSR/hydration, dynamic collection, identity, numeric-boundary, interaction, and platform-classification coverage. The 6 remaining overlay plans retain their verified missing-feature ledgers and execution constraints.
- No overlay implementation was started during navigation execution. Executors must re-check cited symbols against the current working tree before editing and record final classifications in `parity-matrix.md` as each plan is implemented.
- `todo.md` remains unchanged until every implementation plan and final repository validation have passed.
- Current repository validation passes 77 test files / 1498 tests, repository-wide `bun run qa`, TypeScript typecheck, library build, and both public type suites.
- Production docs build and render successfully. The shared search trigger forwards the Modal trigger contract, and production browser checks for `/`, `/button`, `/dialog`, and `/form-field` pass at desktop, tablet, and mobile widths without error-level console messages.

## Global Decisions

- Port behavior, not upstream API shape or styling.
- Preserve documented Moraine contracts. If parity requires a new component prop, record an intentional divergence instead of expanding the API in this sweep.
- Use the smallest local change that closes a confirmed observable gap.
- Every closed gap requires a regression test. Shared behavior receives focused state-machine coverage plus one smoke test per distinct consumer pattern.
- Keep styles, spacing, sizes, and visual transition design out of scope; those belong to the following Shadcn design-system task.
- Do not add browser-mode or Playwright dependencies. Reuse platform guards proven by Base UI source/tests, simulate them in jsdom where reliable, and mark behavior requiring a real engine/device as unverified-platform.
- If conditional JSX, slots, children, content, labels, icons, or render props change, apply the SSR single-evaluation and hydration-order gate from build-ssr-safe-component.

## Handoff Protocol

1. Assign one plan to one owner. The owner audits upstream source and tests before editing local code.
2. Record each result in parity-matrix.md as verified, ported, intentional-divergence, or unverified-platform.
3. If a component audit finds a shared defect, stop local implementation and hand it to the matching foundation owner. Do not patch shared state, overlay base, form-field, or BaseSelect concurrently.
4. Add the narrowest failing test, implement the smallest equivalent behavior, run the focused and dependency suites listed in the plan, then run bun run typecheck.
5. A plan is complete only when it has no unclassified gaps and its matrix entry contains upstream evidence and local test references.
6. Check the todo.md item only after every plan below is complete and final repository validation passes.

## Execution Order

1. State and lifecycle foundations.
2. Collection, virtualization, disclosure, and overlay foundations.
3. Leaf elements and form infrastructure.
4. Stateful form and disclosure components.
5. Select and overlay consumers.
6. Navigation and responsive composites.
7. Full validation: bun run qa, bun run test, bun run build, bun run test:types, and git diff --check.

## Foundation Plans

- [useControllableValue](foundations/use-controllable-value.md)
- [useEventListener](foundations/use-event-listener.md)
- [useTransitionPresence](foundations/use-transition-presence.md)
- [useMediaQuery](foundations/use-media-query.md)
- [useDisclosureState](foundations/use-disclosure-state.md)
- [useLoadingAuto](foundations/use-loading-auto.md)
- [useSelectableCollectionNavigation](foundations/use-selectable-collection-navigation.md)
- [useListVirtualizer](foundations/use-list-virtualizer.md)
- [Modal overlay foundation](foundations/overlay-modal.md)
- [Popper overlay foundation](foundations/overlay-popper.md)
- [Menu overlay foundation](foundations/overlay-menu.md)

## Element Plans

- [Accordion](elements/accordion.md)
- [Avatar](elements/avatar.md)
- [Badge](elements/badge.md)
- [Button](elements/button.md)
- [Collapsible](elements/collapsible.md)
- [Progress](elements/progress.md)
- [Separator](elements/separator.md)

## Form Plans

- [Checkbox](forms/checkbox.md)
- [CheckboxGroup](forms/checkbox-group.md)
- [FileUpload](forms/file-upload.md)
- [Form](forms/form.md)
- [FormField](forms/form-field.md)
- [Input](forms/input.md)
- [InputNumber](forms/input-number.md)
- [RadioGroup](forms/radio-group.md)
- [Select](forms/select.md)
- [MultiSelect](forms/multi-select.md)
- [Slider](forms/slider.md)
- [Switch](forms/switch.md)
- [Textarea](forms/textarea.md)

## Navigation Plans

- [Breadcrumb](navigation/breadcrumb.md)
- [Pagination](navigation/pagination.md)
- [Tabs](navigation/tabs.md)

## Overlay Plans

- [ContextMenu](overlays/context-menu.md)
- [Dialog](overlays/dialog.md)
- [DropdownMenu](overlays/dropdown-menu.md)
- [Popover](overlays/popover.md)
- [Sheet](overlays/sheet.md)
- [Tooltip](overlays/tooltip.md)

## Final Acceptance

- All 29 component plans with direct upstream counterparts and 11 foundation plans are classified in parity-matrix.md.
- Every compatible gap is either fixed with tests or explicitly preserved as an intentional divergence.
- No code gap remains hidden behind unverified-platform; that label is only for proof that jsdom cannot provide.
- No new test warning, generated output, dependency, lockfile, or unrelated formatting change is introduced.
- todo.md is updated only after the final validation commands pass.
