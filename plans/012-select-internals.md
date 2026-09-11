# Plan 012: Separate Select behavior from optional collection metadata and presentation

> Executor: read this file plus `plans/README.md` before implementation. This plan is internal-only groundwork for the composition-first Select API in plan 013.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: [005-overlay-lifecycle.md](005-overlay-lifecycle.md), [006-floating-bindings.md](006-floating-bindings.md)
- **Category**: architecture
- **State**: TODO

## Why this matters

The Select behavior layer must no longer assume that root `options` is always the only collection source, but it also must not fall back to scanning JSX.

Separate:

1. selection/open/highlight/query state;
2. form adaptation and serialization;
3. collection metadata;
4. filtered/virtual views;
5. styled rendering.

A single behavior authority must be able to consume either:

- an explicit complete `options` collection supplied by the root; or
- declarative item registrations from mounted `Select.Item` parts when no complete collection is supplied.

Those are metadata sources, not competing selection states.

## Required behavior boundaries

### Value authority

Identify one authority for controlled/uncontrolled/form-bound value. Rejected controlled changes must not serialize prematurely. Mounted item registration must never become the canonical value source.

Preserve:

- controlled/uncontrolled value contracts;
- required/form/readOnly/disabled behavior;
- hidden input serialization;
- reset behavior;
- current callback semantics.

### Collection metadata

Define one internal interface for semantic option metadata such as:

- value;
- disabled;
- text/search value;
- display label metadata when explicitly available;
- ordering/index information where deterministically known.

A root `options` prop supplies a complete collection. Declarative items supply registrations for parts that actually mount.

Do not evaluate item JSX to derive metadata. Labels/content may remain lazy render values separate from searchable text metadata.

### Search/filter/typeahead

Search and filtering over a complete dataset require a complete data source. When `options` is absent:

- typeahead/search may operate only on explicitly registered searchable metadata;
- virtualized/unmounted entries cannot be invented;
- public plan 013 must document when complete `options` is required for built-in filtering/virtualization.

Do not create a hidden Search input or a second query state.

### Selected label

A selected value may exist before popup items mount. The behavior layer must distinguish the raw selected value from optional display metadata.

If root metadata cannot resolve a label, public `Select.Value` must have a deterministic fallback or accept explicit children/rendering. Do not mount popup content solely to discover a label.

### Virtualization

Virtualization requires a complete logical collection independent of mounted DOM nodes. Keep virtual entries distinct from mounted item registrations and filtered metadata.

### Presentation

Remove styled List nodes, recipe output and FormField objects from the reusable behavior interface. BaseSelect may remain an internal JSX composition layer only if it does not become a second public anatomy or behavior owner.

## Scope

- `src/forms/select` internal behavior modules
- shared selectable/typeahead utilities only where multiple consumers justify them
- Select/MultiSelect focused regression tests
- form adapter tests
- no public parts API changes in this unit

## Acceptance tests

Cover both metadata modes:

- complete root options with unmounted entries;
- declarative registered items without root options;
- controlled rejection does not serialize;
- reset and hidden-input behavior;
- search/query/highlight distinctions;
- typeahead over registered metadata;
- complete-data filtering;
- selected value before popup mount;
- missing display metadata does not force popup mount;
- virtualization uses complete logical data rather than DOM registrations;
- item mount/unmount does not clear a controlled selected value;
- duplicate values and inconsistent root-vs-registration metadata produce actionable development diagnostics.

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

- [ ] Selection/form state has one authority.
- [ ] Complete root metadata and declarative item registration feed one behavior model.
- [ ] No JSX scanning/eager label evaluation is used for collection discovery.
- [ ] Search/virtualization boundaries are explicit and tested.
- [ ] Selected-label resolution does not require mounting popup content.
- [ ] Public Select/MultiSelect APIs remain unchanged until their respective structure plans.

## STOP conditions

Stop if declarative mode requires scanning child JSX, if mounted items become the source of controlled/form value truth, if virtualization is implemented from mounted DOM registrations, or if selected-label correctness requires hidden popup mounting.