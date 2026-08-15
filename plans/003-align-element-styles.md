# Plan 003: Align element spacing, sizing, surfaces, and motion

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If a STOP condition occurs,
> stop and report; do not improvise. Update this plan's row in `plans/README.md` when
> finished unless a reviewer owns the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- src/elements src/shared/cva-common.class.ts src/shared/style style-parity-matrix.md`.
> Plan 001 is expected to change the matrix. For every element file in scope, a
> substantive difference from the current-state summary below is a STOP condition
> until reconciled.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/001-freeze-vega-style-baseline.md`
- **Category**: tech-debt
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

Elements establish the visual scale consumed by forms, navigation, and overlays.
Moraine currently diverges from Vega most visibly in control heights, Badge/Kbd type
scale, Card spacing, and Accordion density, while several built-in classes remain
inline. Aligning these leaf surfaces first prevents later domains from compensating
with local padding and keeps the final design system compositional.

## Current state

- `src/elements/button/button.class.ts` maps `xs`–`xl` to heights 6, 7, 8, 9, and 10;
  the matrix must map Vega `xs`/`sm`/`default`/`lg` anchors to Moraine without removing
  Moraine's `xl` surface.
- `src/elements/badge/badge.class.ts` uses fractional text sizes and heights from 3.5
  through 5.5. Vega Badge supplies a 20 px (`h-5`) compact anchor with `text-xs`,
  `gap-1`, `px-2`, and a large-radius tier, but Moraine keeps a visibly rounded
  rectangular badge rather than a fully round pill.
- `src/elements/card/card.tsx` has inline root/header/body/footer utilities. Vega Card
  expresses default and compact spacing through one spacing variable, `rounded-xl`,
  a one-pixel surface ring, and `shadow-xs`.
- `src/elements/accordion/accordion.tsx` has inline trigger/content utilities. Vega
  uses item dividers, `py-4` triggers, `text-sm`, a 16 px icon, and state-driven
  accordion height motion.
- `src/elements/collapsible/collapsible.tsx` has inline transition geometry but Zaidan
  Collapsible intentionally supplies structure only. Preserve Moraine's height
  behavior and normalize it to shared motion rules rather than inventing a surface.
- `src/elements/list/list.tsx` is intentionally headless and exposes no slot overrides.
  It must stay headless.
- Avatar, Progress, Resizable, and Separator already have dedicated class files and
  richer Moraine APIs. Zaidan provides anchors, not a reason to delete those features.

## Commands you will need

| Purpose                  | Command                                                                                                           | Expected on success          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Focused element          | `bun run test <element-test-file>`                                                                                | selected suite passes        |
| Domain                   | `bun run test src/elements`                                                                                       | every element suite passes   |
| Shared motion if touched | `bun run test src/shared/use-transition-presence.test.tsx src/unocss/theme.test.ts src/tailwind/tailwind.test.ts` | all pass                     |
| Types                    | `bun run typecheck`                                                                                               | exit 0                       |
| Public types             | `bun run test:types`                                                                                              | build and both fixtures pass |

## Suggested executor toolkit

- Use `parity-port` for each matrix row; Zaidan UI structure and Vega selectors are
  evidence, while Moraine's public API remains authoritative.

## Selector ownership rule

Zaidan's `has-*`, `group-has-*`, `group-data-*`, and `in-data-*` selectors describe
relationships in open-ended primitives. Moraine's element components own a mostly
static tree, so use existing props/accessors and apply classes at the final slot:
Button and Badge derive icon padding from resolved leading/trailing values, Avatar
and AvatarGroup pass size directly to their class calls, and Card/Accordion apply
optional-slot styles in their existing branches. Keep only the smallest direct-child
or sibling selectors needed for arbitrary ButtonGroup children. Do not add
`data-icon`, `data-size`, group names, slot renames, visual-only nodes, or new ARIA
attributes to make a Vega selector portable.
Pass existing size/variant values through the current `cva` axes or direct slot classes,
and keep runtime styling on Moraine's existing `data-*`, ARIA, and pseudo-class states.

## Scope

**In scope:**

- `src/elements/accordion/{accordion.tsx,accordion.class.ts,accordion.test.tsx}`
- `src/elements/avatar/{avatar.tsx,avatar-group.tsx,avatar.class.ts,avatar.test.tsx}`
- `src/elements/badge/{badge.tsx,badge.class.ts,badge.test.tsx}`
- `src/elements/button/{button.tsx,button.class.ts,button-group.tsx,button-group.class.ts,button.test.tsx,button-group.test.tsx}`
- `src/elements/card/{card.tsx,card.class.ts,card.test.tsx}`
- `src/elements/collapsible/{collapsible.tsx,collapsible.class.ts,collapsible.test.tsx}`
- `src/elements/icon/{icon-button-inner.tsx,icon-button.class.ts,icon.test.tsx}` only for
  the shared icon-button scale; `Icon` itself stays headless.
- `src/elements/kbd/{kbd.tsx,kbd-group.tsx,kbd.class.ts,kbd.test.tsx}`
- `src/elements/progress/{progress.tsx,progress.class.ts,progress.test.tsx}`
- `src/elements/resizable/{resizable.tsx,resizable.class.ts,resizable.test.tsx}`
- `src/elements/separator/{separator.tsx,separator.class.ts,separator.test.tsx}`
- relevant `*.ssr.fixture.tsx` files only when a class move changes an existing
  fixture assertion; preserve their intended trees.
- `src/shared/cva-common.class.ts` or `src/shared/style/**` only for a matrix-approved
  token used by at least three later domains; otherwise keep the change local.
- element rows in `style-parity-matrix.md`
- Plan 003 status in `plans/README.md`

**Out of scope:**

- `src/elements/list/**` beyond verifying and recording
  `headless-no-visual-surface`.
- New variants, removal of existing variants, Zaidan `.z-*` names, theme infrastructure,
  or changing public component behavior.
- Forms, navigation, overlays, docs pages, generated API JSON, dependencies, and
  lockfiles.
- A global radius or motion rewrite unsupported by at least three completed matrix
  rows.

## Git workflow

- Branch: `codex/003-element-style-parity`.
- Commit by dependency-safe batch: controls, content/disclosure, then display/layout.
- Use messages such as `refactor(elements): align control style scale`.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Align Button, ButtonGroup, Badge, and IconButtonInner

Use the completed matrix rows and the Zaidan Button/Badge/ButtonGroup UI and Vega
selectors. Make Button `md` match Vega `default`, make `sm` match Vega `sm`, retain
`xs`/`lg` anchors, and derive `xl` once. Normalize icon-only sizes on the same height
scale and preserve Moraine's loading and polymorphic behavior. Match Vega's semantic
focus/invalid border + 3 px ring through existing Moraine effects, transparent base
border, direct icon-aware gap/padding from existing accessors, and active translation.

Align Badge's compact rounded geometry and variants to the matrix while preserving the
public `default`, `outline`, and `solid` names. Align ButtonGroup joins, logical
start/end radii, focus stacking, and separator surface without renaming its existing
`data-slot` or importing the nested-group `has-*` hook. Use ButtonGroup context for
known Button children and retain direct-child/sibling joins only for arbitrary content.

Add tests for every size anchor, grouped orientation, loading/disabled selectors,
static slot overrides, and root override precedence.

**Verify**:

```sh
bun run test src/elements/button/button.test.tsx src/elements/button/button-group.test.tsx src/elements/badge/badge.test.tsx src/elements/icon/icon.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 2: Align Accordion, Card, and Collapsible

Create the missing `.class.ts` files. Move built-in reusable utilities out of TSX;
static-only groups use `*_CLASS`, and real variant axes use `cva`. Do not create a
static-only `cva`.

For Accordion, align divider rhythm, trigger padding/type/icon geometry, focus surface,
and content spacing. Translate Vega expanded/closed motion onto Moraine's existing
presence/data attributes and retain `unmountOnHide` semantics; apply trailing-icon
classes from the existing item accessors instead of re-keying a selector. For Card,
express default/compact spacing directly across header/body/footer, align the semantic
surface/radius/shadow, and retain conditional sections with no empty wrappers; do not
add a `data-size` marker. For Collapsible, keep it visually neutral but move its
height/overflow/transition classes to the class file and align reduced-motion behavior.

Keep Card's cached arbitrary JSX props and Accordion/Collapsible presence branches in
their current single-evaluation and hydration order. Add explicit class anchors plus
existing state-selector and hydration regression tests.

**Verify**:

```sh
bun run test src/elements/accordion/accordion.test.tsx src/elements/card/card.test.tsx src/elements/collapsible/collapsible.test.tsx
bun run typecheck
```

Expected: all suites and types pass with no hydration regression.

### Step 3: Align Avatar, AvatarGroup, Kbd, and KbdGroup

Use Vega Avatar sizes 6/8/10 as the small/default/large anchors and the matrix's
five-size interpolation. Preserve Moraine loading/fallback transitions and badge
placement. Pass the existing size value directly to root/fallback/badge and group
item/count class calls; do not add `data-size`, group names, or slot re-keying just to
reuse Vega's group selectors.

Align Kbd default geometry to Vega's `h-5`, `min-w-5`, `px-1`, `text-xs`, `rounded-sm`
anchor while keeping Moraine's outline/invert variants and five sizes. Use logical
spacing and retain symbol/accessibility behavior. When Tooltip composes Kbd, pass the
context class through its existing slot map instead of using `in-data-[slot=…]`. Align
KbdGroup gap and divider rhythm without changing render-prop semantics.

Test group geometry, overflow count, Avatar load-state class updates, Kbd
sequence/chord layout, static slot overrides, and absent badge/divider branches.

**Verify**:

```sh
bun run test src/elements/avatar/avatar.test.tsx src/elements/kbd/kbd.test.tsx
bun run typecheck
```

Expected: both suites and types pass.

### Step 4: Align Progress, Resizable, and Separator

Use Vega's 1.5-unit Progress track and value type as the default anchor while
preserving Moraine's orientations, size range, steps, status slot, and indeterminate animations.
Keep transform animations GPU-friendly and reduced-motion safe.

For Resizable, use Vega's 24-by-4 rounded handle visual as evidence for the visible
grip, but preserve Moraine's one-pixel divider, larger invisible hit area, intersection
targets, keyboard focus, and collapse behavior. Style the existing `withHandle`/handle
slot directly; do not add a visual-only grip node. Move remaining reusable panel/handle
inline classes into `resizable.class.ts` when doing so does not hide computed geometry.

For Separator, align plain horizontal/vertical rules to a one-pixel semantic border
while retaining Moraine's content and size variants. Keep the before/after border
segments visually consistent around optional content.

Add tests for determinate/indeterminate/step class changes, panel and handle states,
separator orientation/content, static slot overrides, and style merge precedence.

**Verify**:

```sh
bun run test src/elements/progress/progress.test.tsx src/elements/resizable/resizable.test.tsx src/elements/separator/separator.test.tsx
bun run typecheck
```

Expected: all suites and types pass.

### Step 5: Complete matrix dispositions and run the domain gate

Run the existing public type fixtures as a regression gate. Update every
element/foundation matrix row to `aligned`, `intentional-divergence`, or
`headless-no-visual-surface`, with test references and final class anchors.

**Verify**:

```sh
bun run test src/elements
bun run typecheck
bun run test:types
git diff --check
rg -n '\| Elements? \|.*(pending|ready-for-implementation|unclassified)' style-parity-matrix.md
```

Expected: tests/types pass; diff check is clean; final `rg` exits 1 with no output.

## Test plan

- Each changed component keeps its existing behavior suite and gains targeted class
  anchors from its matrix row.
- Every component with slots tests static overrides and merge precedence.
- Fixed optional-slot tests assert classes on the direct final owner; ButtonGroup tests
  cover only the existing direct-child/sibling joins needed for arbitrary children.
- Existing SSR fixtures remain regression gates for critical conditional trees.
- Domain-wide tests and existing public type fixtures run after focused batches.

## Done criteria

- [ ] Every non-headless element row is classified and linked to final tests.
- [ ] Inline reusable element utilities live in class files; no static-only `cva`
      exists.
- [ ] The five-size scale follows the matrix with no component-local reinvention.
- [ ] Static overrides and root precedence remain valid.
- [ ] Fixed optional slots use direct final-owner classes; no parity-only marker,
      slot rename, Progress slot split, or visual-only DOM node was added.
- [ ] No behavior, DOM, ARIA, dependency, docs, or generated JSON changed.
- [ ] `bun run test src/elements`, `bun run typecheck`, `bun run test:types`, and
      `git diff --check` pass.
- [ ] Plan 003 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- A matrix row is missing, pending, or contradicts the fixed scale.
- Visual alignment appears to require removing a Moraine variant, changing DOM/state
  attributes, or altering interaction behavior.
- A shared token would serve fewer than three domains or changes an unrelated
  component outside this plan.
- A Vega selector appears to require a new marker attribute, slot name, wrapper, or
  ARIA attribute for a fixed Moraine branch; record the visual divergence and stop.
- An element test fails because the completed behavior-parity contract conflicts with
  Vega structure; keep the behavior and record an intentional visual divergence.
- A verification fails twice after a reasonable correction.

## Maintenance notes

Button, Badge, icon-button, Kbd, and surface spacing become downstream anchors after
this plan. Later plans should compose them instead of applying compensating arbitrary
heights or padding. Reviewers should compare the final class files against matrix
values, verify one final DOM owner per conditional style, and reject presentational
data markers introduced solely to copy Vega selector topology.
