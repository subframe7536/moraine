# Plan 001: Establish the docs design foundation

> **Executor instructions**: Complete only this plan. Run each verification command before updating
> `plans/README.md` to DONE. Leave `todo.md` unchanged; Plan 008 closes the parent docs item.
>
> **Drift check**:
>
> ```bash
> git diff --stat 5173d35..HEAD -- docs/DESIGN.md docs/unocss.config.ts docs/index.html
> ```
>
> If either existing file changed materially, reconcile this plan with the live implementation before
> editing. Do not overwrite unrelated work.

## Status

- **Priority**: P1
- **Effort**: S (half day)
- **Risk**: LOW — docs-only tokens and written design constraints
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `5173d35`, 2026-08-23

## Goal

Create one explicit visual and interaction contract for the documentation site, then consolidate the
small set of shared docs measurements needed by every later plan. This prevents shell, examples,
landing, and responsive work from inventing separate spacing, color, and motion systems.

## Current state

- `docs/unocss.config.ts` already owns semantic colors, system sans/mono stacks, Markdown shortcuts,
  preflight, and docs motion tokens. It is the executable source of truth.
- Shared measurements such as article width, header height, sticky offsets, and focus treatment are
  repeated as inline utility strings across `_app.tsx`, Markdown components, and TOC code.
- There is no `docs/DESIGN.md`, so the intended shell, landing, example, responsive, and copy rules
  are implicit.

## Product decisions

- Use a modern-minimal technical editorial style: calm, dense, ruled surfaces and strong hierarchy,
  without generic card grids or fake browser chrome.
- Preserve Moraine semantic colors, 4-point spacing, and system font stacks. Add no raw color system,
  font package, animation dependency, or general-purpose docs framework.
- Retain the workbench shell: navigation rail, sticky content header, readable article, contextual
  TOC. The landing page may be more expressive, but must use the same tokens.
- Allow at most quiet opacity/transform feedback; reduced motion must remove spatial movement.
- Support 320, 375, 414, 768, and 1440 CSS-pixel widths without page-level horizontal overflow or
  wrapped primary control labels.
- Describe lifecycle as “pre-1.0; breaking changes may occur” until project sources agree on a more
  specific label.

## Scope

May modify:

- `docs/unocss.config.ts`

May create:

- `docs/DESIGN.md`

Do not modify:

- `src/**`, `package.json`, `bun.lock`, component pages, shell JSX, or `todo.md`.
- Generated routes, API JSON, `dist/**`, or `docs/dist/**`.

## Steps

### Step 1: Write the design contract

Create `docs/DESIGN.md` in English with these concrete sections:

1. **Product character and copy** — direct, factual, pre-1.0-aware, and free of fabricated metrics,
   testimonials, accessibility guarantees, or compatibility claims.
2. **Semantic surfaces and color roles** — map background, raised surface, border, text, muted text,
   action, focus, success, warning, and destructive states to existing variables.
3. **Typography** — assign existing sans/mono stacks to page title, section title, body, metadata,
   code, and compact UI; define a restrained scale rather than arbitrary per-component sizes.
4. **Spacing and layout** — record the 4-point rhythm, article measure, shell header/sidebar/TOC
   dimensions, gutters, sticky offsets, and narrow-screen behavior.
5. **Interaction states** — visible focus, hover, active, selected, disabled, loading, empty, and
   error behavior for navigation, search, examples, code, and theme controls.
6. **Examples** — preview/header/source anatomy, compact author-selected controls, responsive wrapping,
   and the rule that complex props receive dedicated examples rather than generic editors.
7. **Landing composition** — asymmetric product statement, real component specimen, setup flow,
   principles, dense directory, compatibility, and resources; ban equal-card hero templates.
8. **Motion and responsive validation** — exact reduced-motion behavior and required widths.

Reference shadcn/ui for direct positioning and navigable hierarchy, and Nuxt UI for useful component
usage coverage and author-selected live prop controls. Reuse principles, not wording, layout, assets,
or framework-specific APIs.

### Step 2: Consolidate shared docs measurements

Add named docs shortcuts or theme values in `docs/unocss.config.ts` for at least:

- shell header height and matching anchor scroll margin;
- readable article width and horizontal gutters;
- desktop navigation/TOC widths;
- shared focus-visible treatment;
- compact control height used by search and future example headers;
- reduced-motion-safe content entrance.

Keep semantic color variables as the palette source. Do not duplicate the complete library token
system, add static-only `cva()`, or move global preflight behavior into component files.

### Step 3: Verify the foundation

Run:

```bash
rg -n "Product|Color|Typography|Spacing|Examples|Landing|Motion|Responsive|Copy" docs/DESIGN.md
bun run typecheck
git diff --check
```

Expected: every contract area is present, typecheck exits 0, and diff check prints nothing.

## Done criteria

- [ ] `docs/DESIGN.md` states the product, layout, example, motion, accessibility, responsive, and
      copy rules used by Plans 002–007.
- [ ] Shared measurements are named once in `docs/unocss.config.ts` and use existing semantic tokens.
- [ ] No dependency, source-library, component-page, or generated file changed.
- [ ] `bun run typecheck` and `git diff --check` exit 0.
- [ ] `plans/README.md` marks Plan 001 DONE; `todo.md` remains unchanged.

## STOP conditions

Stop and report if the required design contract needs a new package, a second runtime token system,
or changes to public library components. Stop if project sources force an unsupported lifecycle,
browser, performance, or accessibility claim.

