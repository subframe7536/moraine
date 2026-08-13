# Plan 001: Freeze the Vega baseline and map every Moraine visual surface

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the STOP conditions occurs, stop and report; do not improvise. When done, update
> this plan's status row in `plans/README.md` unless a reviewer told you they maintain
> the index.
>
> **Drift check (run first)**:
> `git diff --stat 620037aad7b5..HEAD -- todo.md src/elements src/forms src/navigation src/overlays src/shared/style src/unocss src/tailwind package.json`
> and
> `test "$(git -C zaidan rev-parse HEAD)" = b4855789c8a431575a4bc460d05f8f9b9024f06b`.
> If any listed Moraine path changed, compare the current component inventory and class
> excerpts below with the live code. If Zaidan is at another revision, stop.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `620037aad7b5`, 2026-08-13

## Why this matters

The TODO asks for a component-by-component styling audit, but copying isolated shadcn
classes would leave Moraine with inconsistent size interpolation, radii, and transition
timing. This plan creates one reviewable evidence ledger before implementation. Every
later class change will then trace to a pinned Zaidan UI file and Vega selector, while
Moraine-only components receive an explicit analogue or documented divergence.

## Current state

- `todo.md:9-10` contains the next unchecked item: compare every component's classes
  with shadcn/ui, understand spacing/sizing/transitions, apply the system, and make
  `classes` and `styles` stateful.
- `zaidan/src/lib/config.ts:17-27` sets `style: "vega"`; its style metadata describes
  Vega as the classic shadcn/ui look.
- `zaidan/src/registry/kobalte/ui/*.tsx` contains structure and `data-*` selectors.
  `zaidan/src/registry/kobalte/styles/style-vega.css` owns actual design values through
  `.z-*` rules. Both files are required evidence for a direct comparison.
- Moraine currently has 41 public component surfaces: 15 elements, 13 forms, 6
  navigation components, and 7 overlays including the public low-level `Modal`.
- `src/elements/button/button.class.ts` currently uses `h-6`, `h-7`, `h-8`, `h-9`, and
  `h-10` for `xs` through `xl`. Vega Button uses `h-6`, `h-8`, `h-9`, and `h-10` for
  `xs`, `sm`, `default`, and `lg`; this is the anchor evidence for the sweep's control
  scale, not permission to apply the same height to every component.
- Several style-bearing components still keep built-in utilities inline:
  `src/elements/accordion/accordion.tsx`, `src/elements/card/card.tsx`,
  `src/elements/collapsible/collapsible.tsx`, `src/forms/form/form.tsx`, and
  `src/navigation/pagination/pagination.tsx`. Later domain plans create their required
  `.class.ts` files.
- Baseline validation is green: `bun run typecheck` exits 0 and `bun run test` passes
  78 files / 1562 tests.

## Commands you will need

| Purpose        | Command                                                                                                 | Expected on success                                     |
| -------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Zaidan pin     | `test "$(git -C zaidan rev-parse HEAD)" = b4855789c8a431575a4bc460d05f8f9b9024f06b`                     | exit 0                                                  |
| Inventory      | `find src/elements src/forms src/navigation src/overlays -mindepth 2 -maxdepth 2 -name index.ts -print` | prints every component barrel                           |
| UI references  | `find zaidan/src/registry/kobalte/ui -maxdepth 1 -name '*.tsx' -print`                                  | prints the pinned UI registry                           |
| Vega sections  | `rg -n '^/\\* MARK:' zaidan/src/registry/kobalte/styles/style-vega.css`                                 | prints every Vega section                               |
| Baseline types | `bun run typecheck`                                                                                     | exit 0, no errors                                       |
| Baseline tests | `bun run test`                                                                                          | 78 files and 1562 tests pass before implementation work |

## Suggested executor toolkit

- Use the `parity-port` skill to keep the comparison evidence-based and to distinguish
  compatible translation from intentional divergence.
- This plan is an audit artifact only. Do not invoke a component implementation skill
  or edit production source.

## Scope

**In scope (the only file to create or modify besides the plan status row):**

- `style-parity-matrix.md` — canonical component-by-component evidence and decision
  ledger.
- `plans/README.md` — update only Plan 001's status.

**Read-only evidence:**

- `todo.md`
- `src/elements/**`, `src/forms/**`, `src/navigation/**`, `src/overlays/**`
- `src/shared/style/**`, `src/unocss/**`, `src/tailwind/**`
- `zaidan/src/lib/config.ts`
- `zaidan/src/registry/kobalte/ui/*.tsx`
- `zaidan/src/registry/kobalte/styles/style-vega.css`

**Out of scope:**

- Any production, test, generated API JSON, docs-page, package, or lockfile change.
- Other Zaidan styles, Zaidan registry/theme installation, or current online shadcn
  source. The local pinned Vega implementation is the requested source of truth.
- Behavior, accessibility, keyboard, focus, DOM, or public variant changes.

## Git workflow

- Branch: `codex/001-vega-style-baseline`.
- Commit once after the matrix is complete; use `docs: add Vega style parity matrix`.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Create the matrix contract and global scale section

Create `style-parity-matrix.md` with these sections in order:

1. Fixed revisions and source precedence.
2. Translation rules from `plans/README.md`.
3. A scale table covering control height, horizontal/vertical padding, gap, icon size,
   text size/line height, radius tier, border/ring/shadow, disabled/invalid/focus state,
   and motion duration/easing/distance.
4. Component matrix.
5. Intentional divergences.
6. Production visual-validation log, initially marked `pending`.

For the size table, map Zaidan `default` to Moraine `md`; keep the upstream `xs`, `sm`,
and `lg` anchors; define `xl` as one consistent next step only for components that
already expose it. Record both source values and the Moraine target rather than hiding
interpolation behind prose. For motion, map Vega's effect to Moraine's existing
enter/exit/layout/sheet primitives when semantically equivalent and name exceptions.

**Verify**:

```sh
rg -n 'Fixed revisions|Scale|Component matrix|Intentional divergences|Production visual-validation log' style-parity-matrix.md
```

Expected: all six required concepts are present; the command exits 0.

### Step 2: Map every public component to direct or analogue evidence

Add one row for each name below. Use columns `Area`, `Moraine surface`, `Local source`,
`Zaidan UI evidence`, `Vega selector evidence`, `Audit axes`, `Disposition`, and
`Implementation plan`.

- Elements: Accordion, Avatar, AvatarGroup, Badge, Button, ButtonGroup, Card,
  Collapsible, Icon, Kbd, KbdGroup, List, Progress, Resizable, Separator.
- Forms: Checkbox, CheckboxGroup, FileUpload, Form, FormField, Input, InputNumber,
  RadioGroup, Select, MultiSelect, Slider, Switch, Textarea.
- Navigation: Breadcrumb, CommandPalette, Pagination, SidebarFrame, Stepper, Tabs.
- Overlays: Modal, ContextMenu, Dialog, DropdownMenu, Popover, Sheet, Tooltip.

Use the following analogue decisions when no same-name Zaidan component exists:

| Moraine surface | Required Zaidan evidence                                                       |
| --------------- | ------------------------------------------------------------------------------ |
| CheckboxGroup   | `checkbox.tsx` plus `field.tsx`                                                |
| FileUpload      | `attachment.tsx`, `field.tsx`, and `input.tsx`                                 |
| Form            | `field.tsx`; preserve Form as a structural/submission container                |
| FormField       | `field.tsx`                                                                    |
| InputNumber     | `input-group.tsx`, `input.tsx`, and `button.tsx`                               |
| MultiSelect     | `combobox.tsx`, `select.tsx`, and Badge                                        |
| CommandPalette  | `command.tsx`                                                                  |
| SidebarFrame    | `sidebar.tsx` plus `sheet.tsx`                                                 |
| Stepper         | `tabs.tsx`, `progress.tsx`, and `item.tsx`; record it as an analogue           |
| Icon            | no default visual surface; classify as `headless-no-visual-surface`            |
| List            | `item.tsx` only as spacing evidence; preserve List as headless and classify it |
| Modal           | `dialog.tsx` and `sheet.tsx` as foundation evidence; wrapper slots own styling |

Also add foundation subrows for `IconButtonInner`, `BaseSelect`, `OverlayMenu`, and
`Popper`, linked to their public consumers. These are not extra public component
counts, but later plans must not style their consumers independently.

**Verify**:

```sh
bun -e "const text=await Bun.file('style-parity-matrix.md').text(); const names=['Accordion','Avatar','AvatarGroup','Badge','Button','ButtonGroup','Card','Collapsible','Icon','Kbd','KbdGroup','List','Progress','Resizable','Separator','Checkbox','CheckboxGroup','FileUpload','Form','FormField','Input','InputNumber','RadioGroup','Select','MultiSelect','Slider','Switch','Textarea','Breadcrumb','CommandPalette','Pagination','SidebarFrame','Stepper','Tabs','Modal','ContextMenu','Dialog','DropdownMenu','Popover','Sheet','Tooltip','IconButtonInner','BaseSelect','OverlayMenu','Popper']; const missing=names.filter(name=>!text.includes('`'+name+'`')); if(missing.length) throw new Error('Missing rows: '+missing.join(', '));"
```

Expected: exit 0 with no missing rows.

### Step 3: Audit every row on the same axes

For each row, inspect the Moraine component/class file, matching Zaidan UI file, and
matching Vega selectors. Record concrete current and target values for:

- composition and slot geometry;
- control dimensions, padding, gap, icon, and type scale;
- radius, border/ring, background, shadow, and clipping;
- hover, active, highlighted, selected, checked, expanded, disabled, invalid, loading,
  and drag states that the component actually exposes;
- transition property, enter/exit state selector, duration, easing, transform origin,
  and displacement;
- responsive, logical-direction/RTL, dark-mode, and reduced-motion treatment.

Translate selector vocabulary rather than copying it. For example, a Vega
`data-open` rule can map to Moraine's existing `data-expanded` attribute, but the
matrix must state the translation. If a Vega selector depends on a DOM relationship
Moraine does not have, record an intentional divergence rather than changing DOM in
this styling sweep.

End every row with `ready-for-implementation`, `intentional-divergence`, or
`headless-no-visual-surface`. Link ready rows to Plan 003, 004, 005, or 006.

**Verify**:

```sh
rg -n 'Disposition.*pending|audit-pending|unclassified' style-parity-matrix.md
```

Expected: exit 1 and no output because no row is left unclassified.

### Step 4: Confirm the audit made no implementation changes

Run the baseline commands again and inspect the working tree.

**Verify**:

```sh
bun run typecheck
bun run test
git diff --check
git status --short
```

Expected: types pass; all tests pass; `git diff --check` is clean; only
`style-parity-matrix.md` and the Plan 001 status in `plans/README.md` are changed.

## Test plan

This is a read-only audit plan, so it adds no tests. Its machine-checkable coverage is
the complete-name script in Step 2, the no-pending grep in Step 3, and the unchanged
baseline in Step 4.

## Done criteria

- [ ] Zaidan is still exactly `b4855789c8a431575a4bc460d05f8f9b9024f06b`.
- [ ] All 41 public components and four shared styling foundations have matrix rows.
- [ ] Every row names exact local, UI, and Vega evidence or an explicit analogue.
- [ ] Every row records all applicable spacing/sizing/surface/state/motion axes.
- [ ] No row remains pending or unclassified.
- [ ] No production or test source changed.
- [ ] `bun run typecheck`, `bun run test`, and `git diff --check` pass.
- [ ] Plan 001 is marked `DONE` in `plans/README.md`.

## STOP conditions

Stop and report if:

- Zaidan is not at the pinned revision or lacks `style-vega.css`.
- The live public component inventory differs from the 41 names above.
- A Moraine component requires a behavior/DOM/API change to reproduce a visual rule.
  Record the evidence, but do not redesign it in this plan.
- A direct Zaidan counterpart is absent and the required analogue table does not cover
  the component.
- Baseline tests or typecheck fail before any source change.

## Maintenance notes

The matrix is a durable implementation and review ledger. When Zaidan is deliberately
upgraded, update the fixed revision and re-audit only changed UI/style sections; do not
silently reinterpret completed rows against a moving checkout.
