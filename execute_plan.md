# Implementation Plan — Plan 006: Prove acceptance and retire legacy styling

## Execution context

- The next execution continues on the existing `style-refactor` branch.
- Read and execute `plans/006-prove-acceptance-and-retire-legacy-styling.md`
  in full; Plan 005 and Plan 005.5 are complete prerequisites.
- Do not create a historical Codex branch.
- This file only prepares Plan 006 for the next execution; do not execute Plan
  006 as part of the completed Plan 005.5 task.
- Real npm tarball/package installation and release validation remains a manual
  check owned by the user. Do not add an automated pack/install fixture or make
  that manual check an automated STOP condition.
- Do not start any later plan, and do not push or open/update a PR unless
  explicitly requested.

## Required outcome for the next execution

Execute Plan 006's repository-wide acceptance audit, isolated built-dist
consumer checks, docs preview lifecycle check, and final quality gates. Keep
the Tailwind v4-only and UnoCSS Wind3/Wind4 support decisions intact, and
update the Plan 006 status only after its own done criteria pass.
