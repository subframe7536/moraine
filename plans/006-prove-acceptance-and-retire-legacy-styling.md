# Plan 006: Prove acceptance and retire legacy styling

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Update the plan status row when complete.
>
> **Drift check (run first)**: `git diff --stat 7a0c7768..HEAD -- src package.json tsdown.config.ts docs README.md test`
> This plan assumes plans 001–005 are complete. If their done criteria have
> not been recorded and verified, stop and execute the missing plan instead.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/005-ship-v4-only-consumer-integration.md`
- **Category**: tests
- **Planned at**: commit `7a0c7768`, 2026-09-03

## Why this matters

The PRD is a cross-cutting breaking refactor: compiling unit tests alone does
not establish that published source is scan-compatible, every public component
has provider ownership, no accidental legacy token remains, or documentation
works in production. This final gate turns its 12 acceptance criteria into
repeatable checks and prevents a partial migration from shipping.

## Current state

- `PRD.md §6` defines 12 acceptance criteria and the verification
  matrix. It requires zero legacy structural shortcuts only under `src/`; docs
  are deliberately excluded because their UnoCSS authoring syntax remains.
- Current source contains legacy tokens in class modules and engine
  transformers, and package builds still emit both `tw3.css`/`tw4.css`; plans
  003–005 are responsible for removing them.
- `package.json` provides `nub run test`, `nub run typecheck`, `nub run qa`,
  `nub run build`, `nub run docs:build`, and `nub run docs:preview`. `qa`
  includes formatting/lint fixes, so run it only after read-only gates are
  green and inspect its diff.
- No existing final acceptance script aggregates source audit, package artifact
  checks, consumer fixtures, SSR/hydration single-evaluation checks, docs
  build, and preview health check.

## Commands you will need

| Purpose           | Command                                             | Expected on success                     |
| ----------------- | --------------------------------------------------- | --------------------------------------- |
| Source audit      | `nub run test test/acceptance/style-system.test.ts` | exit 0                                  |
| Full test suite   | `nub run test`                                      | exit 0                                  |
| Build artifacts   | `nub run build`                                     | exit 0                                  |
| Type/quality gate | `nub run qa`                                        | exit 0                                  |
| Docs build        | `nub run docs:build`                                | exit 0                                  |
| Preview smoke     | `nub run test test/acceptance/docs-preview.test.ts` | exit 0; process starts, responds, stops |

## Scope

**In scope**:

- Create or update final acceptance tests/scripts under `test/acceptance/`.
- Existing test helpers, package scripts, and documentation-preview test helper
  only where necessary to make checks deterministic.
- Minimal final corrections exposed by a verification failure, but only when
  they belong to an already-completed plan; otherwise mark the owning prior plan
  BLOCKED and report it.

**Out of scope**:

- New features, public API expansion, visual redesign, or changing the PRD.
- Reformatting unrelated files produced by `qa`; revert/avoid unrelated churn
  through normal non-destructive edits.

## Git workflow

- Branch: `codex/006-prove-acceptance-and-retire-legacy-styling`.
- Commit acceptance infrastructure separately from any narrowly necessary
  correction. Do not push/open a PR unless instructed.

## Steps

### Step 1: Encode the source and public-surface audit

Create an acceptance test/script that scans `src/**/*.{ts,tsx}` (and only that
tree for syntax exclusions) for the PRD matrix patterns: `effect-`,
`surface-overlay`, `hidden-hitless`, legacy `style-*`, `rm-side-b`, `b-1`,
`b-[trblxy]` (such as `b-t`), `content-empty`, `not-dark:`, `not-last:`,
`not-first-of-type:`, `$` metric utilities, `var-(slider|stepper|progress)`,
`ring-3px`, semantic `animate-(overlay|popup|menu|popover|tooltip|sheet)-*`,
and parenthesized variant groups. It must name the matching file/token on
failure and explicitly not scan `docs/`.

In the same suite, inspect public entry files/package exports/declarations to
assert no `cva`, `extendCN`, `cls-variant`, `tw3.css`, `tw4.css`,
a Wind3-specific transformer/build pipeline, Moraine-specific `opacity-64` registration, variant-result cache, LRU, or `O(1)` claim is exposed. Assert all 36 class
modules are either a `recipe` user when variant-bearing or static `*_CLASS`
constants when not.

Add the Single Resolver Audit: scan `src/**/*.tsx` (excluding `resolveComponentStyle`
itself) and fail with the file/line on any `slots().root(` or `slots().<slot>(`
class/style ordering chain — every component must route precedence through
`resolveComponentStyle` (§3.5.3). Also assert the shared test that compares
`resolveComponentStyle` output to the §3.5.4 precedence table runs in this suite.

**Verify**: `nub run test test/acceptance/style-system.test.ts` → exit 0 and
the audit prints no prohibited match.

### Step 2: Verify provider, object style, and behavior acceptance criteria

Run and, if needed, complete tests proving the provider export inventory maps
every package-root export exactly once; outer/inner provider inheritance is
reactive; default/provider/composition/instance precedence is correct; root
and named slot class/style orders are distinct; strings are rejected at type
level; and style variables merge by property. Confirm test cases include an
owned composition primitive and an instance opt-out.

Run SSR/hydration single-evaluation tests for changed JSX render props and the
full existing interaction/accessibility suite. Do not accept a class migration
that passes CSS assertions but regresses keyboard, focus, dismissal, or
hydration behavior.

**Verify**: `nub run test && nub run typecheck && nub run test:types` → all
commands exit 0.

### Step 3: Validate published artifacts and real consumer compilation

Build the package, inspect the packed output, and run the Tailwind v4 and
UnoCSS consumer fixtures from plan 005. Assert `icon.css` exists and contains
expected Lucide mask selectors; `tw3.css`/`tw4.css` do not exist; the package
exports agree. Confirm fixture CSS uses required plugin/preset and a relative
published-dist scan, produces component classes/tokens/animations/state
variants, and succeeds with no icon CSS import. Then verify either runtime mask
asset or engine icon integration supplies icons independently.

**Verify**: `nub run build && nub run test test/consumer-fixtures` → exit 0.

### Step 4: Run production docs preview smoke test

Build docs. Implement/execute a deterministic smoke test that starts
`nub run docs:preview` via `child_process.spawn` (with `detached: true` or process
group handling), waits for an HTTP-success response with a bounded timeout,
checks a representative rendered docs page has no reported runtime or hydration
error, and guarantees process termination in `finally` / `afterAll` (using
`tree-kill` or sending `SIGTERM`/`SIGKILL` to `-child.pid`). A manually running
server is not a pass condition. Confirm docs describe the styling system
refactor, `cn` boundary, required plugin/preset, optional icon runtime asset,
migration from cva/string styles, and provider precedence.

**Verify**: `nub run docs:build && nub run test test/acceptance/docs-preview.test.ts` → exit 0; no preview process remains.

### Step 5: Execute the final quality gate and inspect scope

Run `nub run qa`, then `git diff --check` and inspect `git status --short`.
If `qa` alters files, retain only formatting/lint changes in files already
within completed-plan scope; report any unrelated edits rather than silently
including them. Re-run full test/build/docs checks after an allowed correction.

**Verify**: `nub run qa && git diff --check && git status --short` → qa and
diff check exit 0; status contains only intentional refactor/acceptance files.

## Test plan

- Machine-readable source audit with `src`-only scope and clear failure output.
- Runtime/provider/recipe/css-var/unit/type tests plus all interaction/a11y/SSR
  suites.
- Packed Tailwind v4 and UnoCSS fixtures including icon independence.
- Artifact and docs build/preview lifecycle checks.

## Done criteria

- [ ] All twelve `PRD.md` acceptance criteria are represented by a command or test and pass.
- [ ] `nub run test`, `nub run qa`, `nub run build`, and `nub run docs:build` exit 0.
- [ ] Consumer fixture and preview lifecycle tests exit 0; no child process remains.
- [ ] The source audit has no excluded token under `src/`; docs-only Uno syntax remains permitted.
- [ ] No former cva API/cache/O(1) assertion or precompiled component CSS artifact is published.
- [ ] `plans/README.md` marks plan 006 DONE.

## STOP conditions

- Any acceptance test fails because a previous plan's implementation is absent
  or incomplete; mark that plan BLOCKED and return to it instead of weakening
  the acceptance test.
- The only way to pass a source audit is to exclude additional `src` paths.
- The consumer fixture needs a source alias, unpublished file, precompiled
  component CSS, or `icon.css` for normal component styling.
- Preview smoke cannot cleanly terminate the process it starts.

## Maintenance notes

Keep the acceptance tests as release gates, especially the package-consumer
fixtures and source audit. When a new component or styling utility is added,
extend provider ownership and standard-token checks rather than bypassing
them. The documented separation remains fundamental: runtime `cn` resolves
class lists, engines generate CSS, and `icon.css` supplies only optional masks.
