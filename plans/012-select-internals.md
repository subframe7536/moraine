# Plan 012: Separate Select behavior from metadata and namespace presentation

> Executor: read this file plus `plans/README.md` before implementation. This is internal groundwork for the renderer-free composition-first Select API in plan 013.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [005-overlay-lifecycle.md](005-overlay-lifecycle.md), [006-floating-bindings.md](006-floating-bindings.md)
- **Category**: architecture
- **State**: TODO

## Why this matters

Select behavior must accept complete root metadata or declarative Item registration without scanning JSX, while presentation remains entirely owned by namespace components in plan 013.

Separate one authoritative model into:

1. selection/open/highlight/query state;
2. form adaptation/serialization;
3. collection metadata;
4. filtered/virtual logical views;
5. namespace presentation consumers.

Metadata sources are not competing selection states and do not contain JSX renderer callbacks.

## Required boundaries

### Value authority

Keep one controlled/uncontrolled/form-bound value authority. Rejected controlled changes do not serialize prematurely. Mounted Item registration never becomes canonical value state.

### Collection metadata

Define semantic metadata such as value, disabled, searchable text, optional display text and deterministic ordering. Root `options` may supply a complete collection; mounted Items may register metadata when it is absent.

Do not evaluate Item JSX to derive metadata. Visible labels/content belong to namespace parts.

### Search/filter/typeahead

Complete-dataset filtering requires complete metadata. Without it, search/typeahead operates on registered searchable metadata only. There is one query state and one visible `Select.Search` consumer.

### Selected label

Distinguish raw selected value from optional display metadata. If complete metadata cannot resolve display text, `Select.Value` uses explicit children or a deterministic fallback. Never mount hidden popup content to discover a label.

### Virtualization

Virtualization requires a complete logical collection independent of mounted DOM. Its internal boundary exposes visible entries, indices, measurement/scroll information and state — **not JSX render callbacks**. Plan 013 removes public `virtualRender`; namespace Item parts remain the presentation model.

### Presentation

Behavior modules contain no recipe output, FormField layout, styled List nodes, `ComponentOrElement` renderer props or renderer-specific public context. BaseSelect may remain a private JSX integration layer only if it does not become a second public anatomy or require callback rendering.

## Round-two implementation constraints

The [second prototype](pr37-prototype-round2-findings.md) established string-value selection, complete/registered search, closed selected-label fallback, Form binding and a fixed-height virtual window. It is evidence for the separation above, not a drop-in replacement for numeric values, MultiSelect, grouped data or all existing filtering/virtualizer behavior.

1. Complete logical options must not depend on mounted virtual rows. The pilot initially merged registrations back into complete options, recreating row identities until the worker exhausted its heap. Keep filtering/order/window inputs stable across row registration; mounted entries supply DOM targets and local overrides without rebuilding the complete collection. Registered-only mode still needs explicit searchable text, including while a row is filtered out.
2. Preserve one value authority: explicit controlled value, otherwise the bound field store, otherwise standalone state. Reconcile the controlled value with the bound store before submission and after reset; rejected changes never reach native serialization. Preserve Formisch's existing bound JSON-path names and standalone native names.
3. Give native constraint validation and submission an explicit adapter. A visually hidden native select is a tested candidate; ensure exactly one successful value entry, disabled exclusion, required validity and invalid-focus routing. Do not add it alongside a duplicate named hidden input. If choosing another adapter, demonstrate equivalent behavior.
4. Synchronize native selection after option DOM updates. The pilot's cancelled-reset case displayed a selected value but submitted none because select.value was assigned before the new option value existed. Verify both immediate FormData and cancelled/ordinary reset; do not repair it by changing the controlled value or emitting extra changes.
5. For keyboard movement outside the virtual window, reveal/mount the target before emitting its active-descendant ID. Dispose list/search refs and reveal/scroll callbacks with their owning content. Test repeated opening, filtering to an unmounted entry and local disabled overrides without reintroducing a logical-data feedback loop.

The pilot used 1,000 entries with fewer than 15 mounted rows. Keep that bounded regression, then close variable-height/grouped/asynchronous-data gaps required by existing consumers. Do not remove existing capabilities based on the fixed-height result.

## Acceptance tests

Cover complete options, declarative registrations, controlled rejection, reset/hidden-input behavior, search/query/highlight distinctions, registered-only typeahead, complete-data filtering, selected value before popup mount, missing display metadata, renderer-free virtual logical entries, mount/unmount stability, duplicate/inconsistent metadata diagnostics, and no behavior-layer JSX renderer callbacks.

## Scope

- `src/forms/select` internal behavior modules
- shared selectable/typeahead/virtualization utilities only where genuinely reusable
- Select/MultiSelect focused regressions
- form adapters
- no public parts implementation until plan 013

## Verification

```sh
nub run test src/forms/select
nub run typecheck
nub run test:types
nub run test
nub run qa
git diff --check
```

## Done criteria

- [ ] Selection/form state has one authority, including controlled rejection and reset reconciliation.
- [ ] Native validation/serialization has one successful control and survives option-update timing and cancelled reset.
- [ ] Complete logical options stay stable through virtual row registration; off-window keyboard targets publish valid IDs.
- [ ] Complete metadata and declarative registration feed one model.
- [ ] No JSX scanning/eager label evaluation is used.
- [ ] Behavior/virtualization internals do not require JSX renderer callbacks.
- [ ] Selected-label resolution does not require popup mounting.
- [ ] Plan 013 can remove all Select public `*Render` APIs cleanly.

## STOP conditions

Stop if declarative mode requires scanning children, mounted items become controlled/form truth, virtualization depends on a JSX renderer callback, or selected-label correctness requires hidden popup mounting.