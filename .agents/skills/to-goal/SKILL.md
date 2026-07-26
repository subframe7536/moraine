---
name: to-goal
description: Convert free-form notes into a structured goal spec with title, context, scope, non-goals, success criteria, and references. Use when the user wants to turn rough input, an IDE selection, or arguments into a clear actionable goal definition.
argument-hint: [rough description of the goal]
---

# to-goal

Convert free-form input into a structured **goal spec**. A goal spec is a self-contained definition of one objective: what we're doing, why, where the edges are, and how we'll know it's done.

## Source of input (in priority order)

1. `$ARGUMENTS` if non-empty.
2. The user's IDE selection if present and non-trivial.
3. Otherwise, ask the user for the rough description in one short prompt and wait.

## Output format

Emit exactly this structure, in this order. Use Markdown headings as shown. Do not add other sections.

```
# Goal: <imperative one-line title>

**Context**
<1–3 sentences on why this goal exists: the motivating problem, prior incident, parity gap, user need, or constraint that triggered it. Avoid restating the title.>

**Scope**
- <concrete in-scope item>
- <concrete in-scope item>
- <…>

**Non-goals**
- <thing that could be confused with the goal but is explicitly excluded>
- <…>

**Success criteria**
- <observable, verifiable outcome — written so someone else can check it>
- <…>

**References** (optional)
- <file path, doc link, related goal, prior art — only if the input gives you one>
```

### Field rules

- **Title** — lead with a verb (Align, Port, Harden, Add, Improve, Stabilize, Tune, Fix, Replace, Migrate). Wrap concrete identifiers (components, hooks, files, APIs) in backticks. Aim for ≤ 120 chars.
- **Context** — explain _why_, not _what_. If the user gave no motivation, infer the most plausible one from the surrounding signal (parity reference, file under audit, bug report) — but don't fabricate incidents or stakeholders.
- **Scope** — bullets. Each item is a concrete change or behavior, not a vague theme. If scope is one thing, one bullet is fine.
- **Non-goals** — bullets. Include this section only if the input implies a boundary that's easy to overstep; otherwise omit the whole section (don't write "None").
- **Success criteria** — bullets. Each criterion must be checkable: a passing test, an observable behavior, a measured property, a green CI step. Avoid "works correctly" / "is robust" — name the behavior.
- **References** — bullets of file paths in backticks, URLs, or other goal titles. Omit the section entirely if there are none.

## Rules

- Preserve the user's intent — do **not** invent scope, files, components, criteria, or non-goals the user didn't imply.
- Never invent file paths, component names, ticket IDs, or people. If unsure, leave the detail out.
- Output **only** the goal-spec markdown — no preamble, no trailing commentary, no surrounding code fence.
- If the input clearly contains multiple distinct goals, merge them into one unified goal.
- Do not append to any file automatically. Just produce the text; the user places it.

## Steps

1. Resolve the input source.
2. Identify the action verb(s) and primary target(s) for the title.
3. Extract motivation → **Context**.
4. Extract concrete changes/behaviors → **Scope**.
5. Identify boundaries worth calling out → **Non-goals** (omit section if none are obvious).
6. Translate the desired end-state into checkable items → **Success criteria**.
7. Pull any cited files/links/prior art → **References** (omit section if none).
8. If multiple goals are detected, repeat per goal, joined by `---`.
9. Emit only the final markdown.
