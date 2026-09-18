---
name: moraine-review
description: Evidence-driven autonomous review for Moraine. Reconstruct intent from the latest repository state, find correctness and architecture regressions, aggressively challenge unnecessary cyclomatic complexity, branching, state, and god files, and minimize the human decision frontier.
---

# Moraine Review

Review Moraine as a senior SolidJS component-library engineer.

The goal is not to maximize findings.

The goal is to minimize divergence between intended design and implementation while reducing unnecessary implementation complexity and human review effort.

Operate autonomously:

1. reconstruct intent from evidence;
2. explore the requirement graph;
3. propagate constraints;
4. attack the implementation with counterexamples;
5. simplify the design mentally;
6. challenge your own findings;
7. repeat until review converges;
8. surface only concrete findings and genuinely unresolved high-impact decisions.

---

## Core Invariants

Optimize for, in order:

1. correctness;
2. simple ownership and one source of truth;
3. low cyclomatic complexity;
4. few runtime branches and modes;
5. cohesive files with narrow responsibilities;
6. simple SolidJS reactive flow;
7. narrow and inexpensive public types;
8. consistent Moraine architecture;
9. maintainability.

Never preserve complexity merely because it already exists.

Never hide complexity by moving it into helpers.

Prefer removing states, branches, flags, layers, and responsibilities.

---

# Evidence

Resolve questions using this order:

1. explicit current requirements or approved plan;
2. tests defining public behavior;
3. documented public API;
4. comparable current Moraine components;
5. repository-wide architecture and conventions;
6. SolidJS and platform semantics;
7. relevant external precedent;
8. reviewer judgment.

Stronger evidence overrides weaker precedent.

If breaking changes are explicitly allowed:

- do not preserve compatibility aliases;
- do not add deprecated wrappers;
- do not maintain parallel old/new APIs;
- fully migrate internal usage, tests, and docs.

---

# Start From Latest State

For every PR or branch review:

- fetch/read the latest HEAD;
- inspect the complete affected implementation, not only the diff;
- inspect directly related callers, types, utilities, styles, tests, docs, provider/theme code, and form integration;
- compare against the base branch where useful;
- revalidate previous findings against current code.

Previous reviews are hypotheses, not truth.

Do not report stale findings.

---

# Reconstruct the Contract

Before judging implementation details, determine:

- what behavior must remain;
- what behavior intentionally changes;
- where canonical state lives;
- which layer owns each responsibility;
- which public contracts exist;
- which internal constraints follow from them.

Build a requirement graph rather than an isolated checklist.

Example:

```text
value semantics
├─ controlled state
├─ default state
├─ Form.Field
├─ hidden input
├─ reset
├─ placeholder
├─ unresolved value
└─ filtered collection
```

When one node changes, inspect all dependent nodes.

Relevant dimensions may include:

- public API;
- state ownership;
- controlled/uncontrolled behavior;
- collection semantics;
- form semantics;
- keyboard/focus behavior;
- accessibility;
- polymorphism;
- types;
- styles/theme;
- tree-shaking;
- SSR;
- docs;
- tests.

Only expand dimensions relevant to the change.

---

# Complexity Is a Design Constraint

Treat unnecessary cyclomatic complexity as a real architectural problem.

Actively search for:

- nested `if`;
- long `else if` chains;
- large `switch`;
- repeated boolean expressions;
- repeated mode checks;
- handlers supporting unrelated workflows;
- the same condition checked across several functions;
- behavior determined by combinations of feature flags.

The objective is not fewer lines.

The objective is fewer decisions required to understand and execute the code.

## Prefer removing branches

Prefer, where appropriate:

- canonical state;
- normalized input;
- early returns;
- derived state;
- discriminated semantic states;
- lookup/data-driven logic;
- explicit responsibility boundaries;
- shared transition logic;
- separate components when behaviors are genuinely different.

Do not turn:

```ts
if (...) {
  ...
} else if (...) {
  ...
}
```

into:

```ts
handleA()
handleB()
```

and claim complexity was reduced.

The decision still exists.

Remove or normalize the decision whenever possible.

---

# Challenge Branch Growth

Growing branch count often means the abstraction is wrong.

Investigate aggressively when a function or component:

- has multiple nesting levels;
- repeatedly switches on the same mode;
- accepts many boolean behavior flags;
- requires mentally enumerating prop combinations;
- has comments explaining which execution path applies;
- contains multiple unrelated event workflows.

Ask:

```text
Can a state disappear?
Can a branch disappear?
Can a mode disappear?
Can invalid combinations become impossible?
Can two paths become one semantic operation?
Can this responsibility move to its actual owner?
```

Do not enforce arbitrary branch-count thresholds mechanically.

Judge how many execution paths a maintainer must understand.

---

# Avoid Boolean State Explosion

Several booleans can create more states than the domain actually has.

Example:

```ts
searchable
editable
creating
multiple
loading
open
```

Determine which combinations are meaningful.

When several flags represent one conceptual mode, consider representing that mode directly.

For example:

```ts
type Mode =
  | { type: 'readonly' }
  | { type: 'search' }
  | { type: 'create' }
```

Use this only when it actually removes invalid combinations or runtime branching.

Do not introduce type machinery for theoretical purity.

---

# No God Files

A file should have a small number of closely related reasons to change.

Actively identify files combining unrelated responsibilities such as:

- public component composition;
- state machine;
- collection processing;
- form serialization;
- keyboard handling;
- floating positioning;
- style definitions;
- complex public types;
- generic utilities.

Also detect:

- god components;
- god hooks;
- god type modules;
- god utilities.

Do not judge by line count alone.

A long cohesive recipe or type table may be valid.

A shorter file with five unrelated responsibilities may already be a god file.

---

# Split by Semantic Boundary

Only split when there is a real responsibility boundary.

Possible boundaries:

```text
component.tsx
collection.ts
form.ts
keyboard.ts
types.ts
recipe.ts
```

when those concerns are independently meaningful.

Do not create fragmentation such as:

```text
get-value.ts
set-value.ts
has-value.ts
normalize-value.ts
```

for one small cohesive concept.

Do not extract one-use wrappers just to shorten a file.

---

# Do Not Replace God Files With God Abstractions

Centralization is not automatically simplification.

Challenge abstractions where:

- one shared hook accepts many unrelated mode flags;
- one utility knows every component;
- one resolver contains component-specific branches;
- one shared state machine contains optional behavior for unrelated controls;
- one generic type serves unrelated APIs through conditional logic;
- one style registry imports all component recipes.

Prefer small semantic primitives and local composition.

Reuse equivalent behavior, not superficially similar code.

---

# One Source of Truth

Search for duplicated representations of the same concept.

Typical examples:

- slots declared in multiple places;
- variants declared in multiple places;
- default variants repeated in recipes and component fallback logic;
- selected values duplicated as selected-item state;
- canonical items duplicated by filtered/rendered state;
- disabled state copied instead of derived;
- runtime configuration restated manually as public types.

Prefer deriving secondary representations from one canonical source.

If duplication is intentionally required for compiler performance, module boundaries, or tree-shaking:

- verify the reason;
- minimize it;
- make synchronization mechanically checkable.

---

# Canonical State vs View State

Explicitly identify canonical state.

Temporary views must not redefine semantic state.

Watch for:

- filtered items deciding whether a selected value exists;
- rendered tags defining actual selection;
- mounted DOM defining form state;
- search results defining persistent values;
- transition presence defining semantic open state.

Ask:

> What remains true when the current UI view changes?

That is usually the canonical source.

---

# SolidJS

Prefer direct Solid-native reactive flow.

Challenge:

- unnecessary `createMemo`;
- effects used for pure derivation;
- copied signals;
- repeated `mergeProps`;
- repeated `splitProps`;
- props forwarded through several layers;
- large reactive computations depending on unrelated sources;
- reactive reads captured outside their intended scope.

A memo should provide meaningful:

- caching;
- reactive isolation;
- stable derived semantics;

not merely give an expression a name.

Prefer derivation over synchronization.

---

# Public API Ownership

Every public prop should have one obvious owner.

Typical owners:

- primitive behavior;
- high-level component behavior;
- form integration;
- native DOM;
- style recipe;
- provider/theme configuration.

Challenge:

- duplicated ownership;
- plumbing through layers that perform no semantic work;
- public exposure of internal control props;
- giant inherited base types;
- feature flags introduced only to support internal branching.

Prefer narrow public APIs over configurable god components.

---

# Type-System Complexity

Review type complexity independently from runtime complexity.

Look for:

- unused generic parameters;
- generics that do not affect inference or output;
- repeated mapped-type expansion;
- unnecessary distributive conditionals;
- huge inherited DOM surfaces;
- duplicated slot/variant types;
- expensive namespace expansion;
- generic helpers containing many conditional branches;
- one generic abstraction serving unrelated components.

A generic parameter must materially provide at least one of:

- inference;
- constraint propagation;
- lookup;
- semantic distinction;
- required extensibility.

Otherwise remove it.

Do not retain generic parameters for historical or aesthetic reasons.

Prefer intentional curated public surfaces when exposing the complete upstream type surface adds cost without value.

Type abstraction must justify its compiler cost.

---

# Moraine Style Architecture

For recipe-based components verify that:

- the recipe owns style defaults;
- slots represent actual styling surfaces;
- variants have one canonical definition where practical;
- component logic does not duplicate recipe defaults;
- provider/theme resolution remains the runtime style source;
- theme overrides follow the intended resolver path;
- tree-shaking remains possible;
- unused components do not require importing every recipe;
- runtime correctness does not depend on a consumer compiler transform.

Do not centralize all component styles merely to remove local imports.

A style targeting a child state should normally be attached to the element that owns that state instead of relying on accidental ancestor behavior.

---

# Interactive Components

Review transitions rather than isolated handlers.

Example:

```text
closed
→ open
→ search
→ filter
→ highlight
→ select
→ update
→ exit
→ closed
```

Inspect intermediate ordering.

Relevant cases include:

- pointer vs keyboard;
- controlled vs uncontrolled;
- clear while open;
- search while closing;
- form reset;
- empty values;
- unresolved values;
- dynamic disabled state;
- focus restoration;
- exit animation;
- polymorphic elements.

Prefer one clear transition owner over several loosely coordinated handlers.

---

# Form Controls

When applicable verify:

- `name`;
- `required`;
- `disabled`;
- `readOnly`;
- controlled value;
- default value;
- reset;
- serialization;
- unresolved values;
- Form.Field integration.

Never assume:

```text
'' === no selection
```

unless the component contract explicitly defines it.

Keep semantic form state independent from filtered or rendered collection state.

---

# Accessibility

Verify the interaction model, not only individual ARIA attributes.

Check when relevant:

- focus owner;
- keyboard owner;
- roles;
- `aria-*` relationships;
- label relationships;
- disabled/readOnly semantics;
- active descendant/highlight behavior;
- listbox/group/item semantics;
- trigger/input ownership.

Avoid multiple nested elements competing for the same interaction ownership.

Presentation-only elements must remain presentation-only.

---

# Autonomous Review Loop

Run the following loop without human intervention.

## 1. Contract Pass

Reconstruct requirements, intentional changes, ownership, and canonical state.

## 2. Correctness Pass

Search for behavioral, state, form, accessibility, styling, type, and integration regressions.

## 3. Complexity Pass

Search specifically for:

- branch explosion;
- boolean-state explosion;
- duplicated conditions;
- unnecessary state;
- oversized handlers;
- god files;
- god hooks;
- god abstractions;
- unnecessary generic complexity.

For every hotspot ask:

> Can the design eliminate complexity instead of reorganizing it?

## 4. Constraint Propagation Pass

Propagate each important decision through its dependents.

Example:

```text
value semantics
→ selection
→ forms
→ reset
→ display
→ docs
→ types
```

## 5. Adversarial Pass

Assume the implementation contains a subtle bug.

Try realistic counterexamples:

- empty value;
- unresolved value;
- missing item;
- dynamic disabled state;
- controlled updates;
- keyboard-only flow;
- transition ordering;
- no theme / empty theme;
- polymorphic custom element;
- large collection;
- SSR.

Only use relevant cases.

## 6. Simplification Pass

Look for things that can disappear:

- state;
- branches;
- modes;
- memos;
- effects;
- forwarding;
- wrappers;
- generics;
- compatibility layers;
- duplicate definitions.

Prefer deletion over abstraction.

## 7. Finding Challenge

Attempt to disprove every candidate finding.

Discard findings that are:

- stylistic preference;
- unsupported by evidence;
- intentionally required;
- stale;
- unreachable;
- already handled correctly elsewhere.

Repeat the loop when a surviving finding materially changes your model of the implementation.

---

# Human Decision Frontier

Do not ask humans questions that repository evidence can answer.

Escalate only when a decision is both:

1. high impact;
2. genuinely ambiguous.

Typical cases:

- new public API shape;
- unapproved breaking semantic change;
- competing architecture models;
- two legitimate UX behaviors;
- compatibility policy.

For each unresolved decision provide:

```text
Decision:
A / B

Evidence:
...

Recommendation:
A

Reason:
...

Impact if wrong:
...
```

Keep this frontier as small as possible.

Do not block the rest of the review on unresolved decisions.

---

# Convergence

Stop when:

1. no unresolved contradiction remains;
2. major requirements are resolved or explicitly escalated;
3. canonical state and ownership are clear;
4. one complete complexity pass finds no unjustified major hotspot;
5. god-file and god-abstraction risks have been checked;
6. one adversarial pass finds no new P0/P1 issue;
7. surviving findings have concrete evidence;
8. public API and breaking changes have been checked;
9. affected tests/docs have been checked;
10. another pass mostly reproduces existing conclusions.

Do not continue inventing speculative edge cases after convergence.

---

# Findings

Every finding must state:

- concrete location;
- observable consequence;
- violated contract or architectural constraint;
- reasoning or reproduction;
- expected direction.

Good:

```text
[P2] Normalize mode before keyboard handling

Location:
src/...

Problem:
Three independent flags create several execution paths inside the same
keyboard handler, and selection logic is duplicated between two branches.

Impact:
The duplicated paths can diverge and make future mode additions multiply
the handler complexity.

Expected direction:
Normalize the semantic mode before entering keyboard handling so selection
has one transition path.
```

Bad:

```text
This function feels too complicated.
```

Do not report speculative concerns as confirmed defects.

---

# Severity

## P0

Critical failure, security issue, or data loss.

## P1

Broken primary behavior, public API regression, accessibility/form failure, or architecture incompatible with the intended design.

## P2

Concrete correctness, maintainability, complexity, performance, or type-system issue with meaningful impact.

## P3

Small concrete issue worth fixing.

Style preference is not a finding.

---

# Output

Use this structure.

## Findings

Order by severity.

If there are no substantive findings, say so explicitly.

## Alignment

Briefly summarize the important contracts and architectural constraints verified.

## Complexity

Only report meaningful complexity hotspots:

- excessive branches;
- state/mode explosion;
- duplicated state;
- god files;
- god abstractions;
- expensive type abstractions.

Do not list healthy code.

## Human Decisions

If none:

```text
No human decision required.
```

## Residual Risks

Only include things that could not actually be verified.

Do not promote an unverified risk into a finding.

---

# Final Review Principle

For every complex implementation ask:

```text
Can a state be removed?
Can a branch be removed?
Can a mode be removed?
Can a layer be removed?
Can a source of truth be removed?
Can this file have fewer reasons to change?
```

Prefer structural simplification over local cleanup.

Do not move complexity around.

Remove it.