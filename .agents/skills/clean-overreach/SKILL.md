---
name: clean-overreach
description: >
  Clean unnecessary AI-generated complexity and narrative residue from code changes.
  Use when an implementation works but includes unrelated features, speculative
  abstractions, excessive defensive logic, historical comments, redundant tests,
  or PR/commit wording that reflects the agent's exploration rather than the user's
  requested end state. Optimize for the smallest complete implementation that matches
  the requested behavior and the repository's existing conventions.
---

# Clean AI Overreach

Refine a code change so the final result reflects the requested end state, not the
agent's path to get there.

The objective is not minimum line count. The objective is **minimal necessary
complexity**: everything required for correctness, maintainability, supported
contracts, and appropriate tests; nothing that exists only because the implementation
temporarily wandered beyond scope.

## Core principle

Treat the user's requested end state as the product.

Anything introduced only because the agent:

- misunderstood the scope;
- explored an unnecessary alternative;
- generalized prematurely;
- added speculative flexibility;
- over-defended against unsupported cases;
- later reverted an idea;
- wanted to explain or justify its own reasoning;

should normally disappear from the final change unless it represents a real,
still-relevant constraint.

The final diff should look as though the task had been understood correctly from the
beginning.

## Small example

Suppose the task is:

> Add a `disabled` state to a button.

During implementation, the agent also adds a generic state plugin system, then later
removes it after review.

The clean final result should contain the `disabled` behavior and its necessary tests.
It should not leave behind comments such as "we intentionally don't use the plugin
system here", test names about the removed plugin system, or a PR title like
"Add disabled state without generic plugins".

## Workflow

### 1. Establish the actual scope

Read the user request, issue, plan, review discussion, and current implementation.

Identify:

- required behavior;
- explicit constraints;
- existing supported contracts;
- repository conventions;
- implementation details genuinely necessary to support the request.

Do not promote optional ideas, exploratory discussion, rejected proposals, or
agent-generated possibilities into requirements.

### 2. Inspect the current diff

Classify changed code into four categories:

1. **Required** — directly implements requested behavior.
2. **Supporting** — necessary for correctness, maintainability, compatibility, or
   meaningful validation of the requested behavior.
3. **Overreach** — adds capability, abstraction, configurability, compatibility, or
   refactoring that the task does not need.
4. **Residue** — exists only because overreach happened or because the implementation
   narrates its own history.

Keep 1 and the necessary parts of 2. Remove 3 and 4.

### 3. Remove overreach completely

When removing an unnecessary idea, also remove artifacts that exist only for that idea:

- code;
- imports;
- types;
- helpers;
- flags;
- branches;
- configuration;
- tests;
- fixtures;
- examples;
- comments;
- documentation;
- changelog entries;
- commit wording;
- PR wording.

Do not replace removed code with comments explaining that the code is intentionally
absent.

### 4. Simplify comments

Keep a comment only when it explains a durable, important, non-obvious constraint.

Good reasons include:

- a platform or runtime quirk;
- a protocol requirement;
- a security invariant;
- a subtle ordering or lifecycle requirement;
- an active compatibility constraint;
- a workaround that cannot currently be removed.

Remove comments that mainly describe:

- what the code already makes obvious;
- what was previously attempted;
- what was removed;
- why an unrelated feature is absent;
- why a rejected design was rejected;
- why the implementation is deliberately simple;
- a problem that no longer exists in the final code.

When historical context is genuinely necessary, rewrite it as the current invariant.
Prefer linking to an issue, specification, or upstream bug over narrating the full
implementation history.

### 5. Remove speculative abstractions

Prefer the simplest pattern already established by the repository.

Review newly introduced:

- wrappers used once;
- factories with one concrete use;
- generalized utilities for a single case;
- extension points nobody requested;
- configuration for values that do not need to vary;
- fallback paths for unsupported or impossible states;
- compatibility branches outside the supported range;
- generic type machinery with no real reuse;
- refactors unrelated to the requested behavior.

Keep them only when they solve a concrete requirement or follow an established project
pattern.

Do not redesign adjacent code merely because a broader architecture is imaginable.

### 6. Clean defensive code

Defensive code is justified when it protects against a realistic state allowed by the
current contract.

Remove defensive branches that exist only because:

- "it might happen someday";
- the agent is uncertain about an invariant that the codebase already guarantees;
- an unsupported environment was considered during implementation;
- a rejected design required the branch;
- the branch silently hides programmer errors that should remain visible.

Do not remove validation, error handling, or safety checks for states that can actually
occur.

### 7. Clean tests

Tests should protect:

- requested behavior;
- meaningful edge cases;
- existing supported contracts;
- realistic regressions;
- important invariants.

Remove or collapse tests that exist only to:

- prove a rejected feature is absent;
- preserve an accidental implementation detail;
- exercise speculative flexibility;
- validate abstractions that are no longer needed;
- duplicate coverage without increasing confidence;
- memorialize a previously reverted approach.

Do not reduce meaningful coverage merely to shrink the diff.

### 8. Clean names and prose

Describe the positive end state.

Prefer:

- `Fix style precedence`
- `Support reactive overrides`
- `Handle disabled form submission`

Avoid wording such as:

- `Fix style precedence without fallback logic`
- `Support overrides without the old cache`
- `Handle disabled submission without extra state`

The same principle applies to:

- commit messages;
- PR titles;
- PR descriptions;
- changelogs;
- comments;
- test names;
- documentation headings.

A reader should not need the implementation conversation to understand the final
result.

### 9. Remove historical residue

Search changed files and surrounding prose for signs that the implementation is
describing its own development history.

Common signals include phrases such as:

- `intentionally`
- `previously`
- `formerly`
- `for completeness`
- `for future use`
- `to be safe`
- `not needed`
- `rather than`
- `instead of`
- `avoid`
- `fallback`
- `just in case`
- `currently unused`
- `reserved for`
- `kept for compatibility`

These phrases are not automatically wrong.

For each one, ask:

> Does this describe a current, durable constraint, or merely the path taken to reach
> the current implementation?

If it is path narration, remove or rewrite it.

### 10. Validate the minimal result

Run the narrowest relevant checks first, then the repository's normal validation when
appropriate.

Confirm:

- the requested behavior still works;
- supported contracts remain intact;
- removed symbols have no remaining references;
- stale comments, tests, docs, and examples do not mention discarded behavior;
- unrelated files are no longer changed;
- the diff reads like a direct implementation of the task.

Useful checks may include:

- `git diff`
- `git diff --stat`
- targeted tests
- type checking
- linting
- repository-wide search for removed terminology

Use only checks appropriate to the repository.

## Decision rule for comments

Before keeping a comment, ask:

1. Would a competent maintainer likely misunderstand the code without it?
2. Is the reason still true in the final implementation?
3. Does it describe a current constraint rather than development history?
4. Would removing it materially increase the chance of a future regression?

If not, remove or shorten it.

## Decision rule for extra code

Before keeping code not directly requested, ask:

1. Is it required for correctness?
2. Is it required by an existing supported contract?
3. Is it necessary for a real edge case?
4. Is it the repository's established pattern?
5. Does removing it cause a concrete failure in the requested use case or supported
   environment?

If not, remove it.

## Decision rule for abstractions

Before keeping a new abstraction, ask:

1. Does the current task require multiple concrete uses?
2. Does the repository already organize this kind of behavior behind the same
   abstraction?
3. Does the abstraction reduce current complexity rather than merely move it?
4. Would an inline or local implementation be clearer for the actual scope?

Prefer the concrete implementation when abstraction is only speculative.

## Scope guardrails

This skill is for cleanup, not broad redesign.

- Do not remove pre-existing behavior merely because it looks unnecessary.
- Distinguish complexity introduced by the current change from established project
  behavior.
- Do not silently change public APIs, compatibility guarantees, persisted formats, or
  security behavior unless the task authorizes it.
- Do not remove a workaround without verifying that the underlying constraint no
  longer applies.
- Do not turn "smallest implementation" into fragile, incomplete, or under-tested code.
- Do not rewrite unrelated files solely to make the change aesthetically uniform.

The target is the smallest implementation that is complete and appropriate for the
project.

## Final response behavior

After cleanup:

- lead with the resulting behavior and validation status;
- mention removals only when they are materially relevant;
- do not defend every deletion;
- do not restate rejected ideas unless the user asks;
- do not describe the result in terms of features that were never requirements.

When preparing commit or PR text, write it as if discarded approaches had never been
part of the implementation.

## Success criterion

The cleanup is successful when a reviewer can read the final diff in isolation and
reasonably conclude:

> This is the straightforward implementation of the requested change.

The diff, comments, tests, and surrounding prose should reveal the current design and
its real constraints—not the agent's exploratory history.
