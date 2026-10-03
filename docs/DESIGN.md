# Moraine documentation design contract

This document is the visual and interaction contract for the Moraine documentation site. The
preset supplies core colors, while `docs/unocss.config.ts` supplies documentation fonts and shadows;
route and component work must use those tokens instead of introducing a parallel docs system.

## Information architecture and page writing

The landing is independent. Header links lead to Docs (`/docs/getting-started`) and Components
(`/components`); these are navigation anchors, not ARIA tabs. The mobile Sheet starts with fixed,
vertically stacked Docs and Components links, separated from the independently scrolling directory
by a rule. Each link is 48 px tall, with sans-serif, 14 px, medium-weight text and a Lucide icon in a
24 px rounded tile. Start the links 16 px below the Sheet's top edge. Highlight Components for paths
starting with `/component` and Docs otherwise, using a muted surface, a thin border, and a short
2 px indicator at the start edge. Mark the selected section with `aria-current="location"`.
Ordinary section clicks navigate to their landing pages and close the Sheet; modified clicks preserve
browser behavior. Mobile and desktop directories show only the current surface, with all categories
expanded and no repeated surface heading. Previous/Next stays within the current surface; search
spans both.
Do not add a title or close-button row above the section links. Brand identity and the home link stay
in the page header. Dismiss the Sheet through its backdrop, Escape, or ordinary navigation; preserve
focus restoration to its trigger.
Docs groups are Overview, Guides, Styling, and Utils. Components groups are Overview,
General, Form, Navigation, and Overlay.

The Components overview is a grouped text-link directory: alphabetical within each category,
three or four columns on desktop and one or two on mobile. Use small badge labels when available.
No preview grid, card wall, or repeated description accompanies each link. Route descriptions
continue to support search, SEO, and agent Markdown.

Component pages lead with a short choice-oriented introduction, then Basic usage as copyable public
TSX, Playground for simple visual changes, optional annotated Anatomy, behavior-focused Usage, optional
real-task Examples, and generated API tables. Keep a single source for web and agent output.
Render Anatomy as a copyable text code block using the same tree as agent Markdown.
Do not re-list props, create a separate Import/Features/Related section, repeat native browser
keyboard behavior, or add examples only to show every variant and size. Simple components stay simple;
complex components explain their state and composition model.

## Product Character and Copy

The documentation is a calm, dense technical workbench: ruled surfaces, clear hierarchy, and
useful detail take priority over promotional treatment. It keeps the navigation rail, sticky
content header, readable article column, and contextual table of contents as the default shell.

Write direct, factual copy that explains component behavior, inputs, and constraints. Describe the
project lifecycle as **pre-1.0; breaking changes may occur**. Do not invent metrics, testimonials,
accessibility guarantees, browser-compatibility claims, or performance claims. State a limitation
when it is known rather than implying support that the source does not demonstrate.

Use `Usage` to explain choices, state models, composition, and consequences that a generated API table
cannot convey. Keep accessibility guidance beside the behavior it explains. Avoid standalone feature
lists and repeating native keyboard behavior where Moraine adds no special rule.

## Semantic Surfaces and Color Roles

Use the semantic variables configured in `docs/unocss.config.ts`; no raw documentation color
palette is allowed.

| Role           | Variables                                                                           | Use                                                                                    |
| -------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Background     | `--background`, `--foreground`                                                      | Page canvas and default readable text.                                                 |
| Raised surface | `--card` / `--card-foreground` or `--popover` / `--popover-foreground`              | Examples, transient surfaces, and grouped content.                                     |
| Border         | `--border`, `--input`                                                               | Rules, field boundaries, and quiet structural separation.                              |
| Muted          | `--muted` / `--muted-foreground`                                                    | Quiet static surfaces, metadata, and secondary explanation.                            |
| Accent         | `--accent` / `--accent-foreground`, with hover and active states                    | Hover, highlight, and other interactive emphasis.                                      |
| Action         | `--primary` / `--primary-foreground`, with `--primary-hover` and `--primary-active` | Primary links, selected navigation, and deliberate calls to action.                    |
| Focus          | `--ring` with `--background` offset                                                 | Keyboard focus treatment through `docs-focus-visible`.                                 |
| Success        | `--primary` / `--primary-foreground`                                                | A confirmed non-destructive completion when no dedicated success token exists.         |
| Warning        | `--foreground` on `--background`                                                    | A caution paired with explicit text or an icon; there is no dedicated warning palette. |
| Destructive    | `--destructive` / `--destructive-foreground`, with state variants                   | Failures, destructive actions, and irreversible consequences.                          |

Form surfaces use `--control`, independently of `--input` boundaries and neutral tracks/separators.
Outline fields, unchecked choices, and upload controls use `control`; subtle fields use `muted`.
Both text-field variants retain the same boundary and shadow. Grouped containers own their surface;
child inputs stay transparent. Ordinary field text uses global `foreground`, with
`muted-foreground` for placeholders. There is no control foreground or state-token family.

The built-in light/dark control values are opaque RGB (255, 255, 255) / (23, 23, 23), while input
remains RGB (229, 229, 229) / (47, 47, 47). Opaque fills make compositing predictable but remove
parent-dependent tinting. shadcn/ui's input-derived alpha treatment is intentional and semantic;
this is a Moraine theme extension and visual change. External palettes must define `--control` in
both themes. Primitive references and custom alpha remain valid; verify foreground, placeholder,
focus, validation, and field identification against the rendered surface. Dark control and card
share a value, so their boundary needs particular scrutiny; no blanket accessibility claim follows.

FileUpload's entire visible dropzone is the action and focus target. Its default and readonly
backgrounds use control; hover/active retain the existing background state colors, and dragging
retains muted fill. Border, focus, validation, and state selectors retain their existing behavior.
Previews and removal actions remain outside the picker hit area.

## Typography

Use the existing `font-sans` stack for page titles, section titles, body copy, metadata, and compact
controls. Use the existing `font-mono` stack only for code, API names, command lines, and other
literal values.

The scale is restrained: page titles are `text-2xl` on narrow screens and `sm:text-3xl`; section
titles follow the existing `docs-h2` through `docs-h5` hierarchy; body copy is `text-sm` with
`sm:text-base` only where readability needs it; metadata and compact UI are `text-xs` or
`text-sm`. Do not introduce one-off display sizes or decorative font treatments.

## Spacing and layout

The docs use the existing 4-point rhythm (`--spacing: 0.25rem`). Prefer spacing values that are
multiples of four pixels, and use a rule or surface change when sections need stronger separation.

| Token or area           | Contract                                                                     |
| ----------------------- | ---------------------------------------------------------------------------- |
| `docs-shell-width`      | Full viewport width for the shell and header content.                        |
| `docs-shell-header`     | 52 px (`h-13`) sticky header height.                                         |
| Header desktop inset    | 24 px at the start edge, aligned with navigation category text.              |
| `docs-anchor-offset`    | 24 px (`scroll-mt-6`) anchor margin below the sticky header.                 |
| `docs-content-gutter`   | 20 px on narrow screens and 32 px from `sm` upward.                          |
| `docs-article-measure`  | Maximum article width of 896 px (`max-w-4xl`).                               |
| `docs-navigation-width` | Desktop navigation rail width of 256 px (`w-64`).                            |
| `docs-toc-width`        | Desktop contextual TOC width of 240 px (`w-60`).                             |
| TOC sticky boundary     | Align below the 52 px header; its scrollable height accounts for the header. |

Below 1024 CSS pixels, content remains in one column with a compact header and complete navigation
in its mobile Sheet. At 1024–1279 pixels, show the full header and current-surface navigation rail.
Below 1280 pixels, provide a default-closed On This Page disclosure after the page title and actions;
selecting an anchor closes it. At 1280 pixels and above, show the contextual TOC on the right with
a bounded, independently scrollable height, without widening the article measure. Navigation links
in the mobile Sheet have at least 44 px hit areas, allow long names to wrap, and keep the active page
visible when opening. Ordinary navigation and path changes close the Sheet; modified clicks preserve
browser behavior. The page must never create horizontal overflow, and
primary control labels must remain on one line; controls may wrap as groups or move below content.

## Interaction states

Navigation, search, previews, code controls, and theme controls must all expose a visible keyboard
focus state using `docs-focus-visible`; hover never substitutes for focus. Hover gives quiet
foreground or surface feedback, active gives a small color or opacity change, and selected state is
distinguished with the action or accent surface plus text contrast.

Disabled controls remain recognizable, non-interactive, and preserve their label. Loading keeps the
current context visible, announces its state where the component supports it, and does not shift the
shell. Empty states explain what is absent and the next useful action. Error states use the
destructive role with explicit text, rather than color alone. Search and theme controls keep compact
hit areas using `docs-compact-control` where their component API permits it.

## Usage and examples

Every interactive Playground has a clear preview and compact controls. Playgrounds do not include a
source panel; regular `Preview` blocks provide source for usage subsections and standalone examples.
Controls are chosen by the author to demonstrate meaningful behavior and must wrap or move below the
preview on narrow screens; they are not a generic property editor.

Playground headings retain section anchors but omit the standard heading rule, with a 12 px gap
before the panel. Frame the panel with a muted ribbon, 8 px on narrow screens and 12 px from `sm`,
between an outer `rounded-2xl` radius and an inner `rounded-xl` radius. Use semantic borders and
background colors, without additional elevation. Both outlines use the same opaque `input` color
to stay consistent across surfaces. The preview leads, with Props and Slots stacked in
the right pane from `md` and below the preview on narrow screens. Separate Slots from Props with a
full-width top rule that meets both edges of the control pane. Narrow-screen value controls use two
columns. Group switches below value controls; use two columns when their labels fit and let long
labels occupy a full row. On desktop, stack both groups in one column. Keep switch labels on one
line and preserve the visual order in keyboard navigation. Slot badges wrap within the control pane.

Use dedicated previews in `Usage` for core API guides and in `Examples` for useful application tasks,
complex compositions, state transitions, or layout constraints. A Preview is the copyable TSX source;
keep its data and helpers in the same file. Prefer replacing a redundant prop demonstration with a
realistic task over adding examples to reach a count. Do not add fake application chrome or duplicate
Playground controls in standalone examples.

## Landing composition

The dedicated TSX landing route explains that Moraine provides styled SolidJS components which can
adapt to an application's design system. Lead with that promise in a centered title and description,
followed by the primary actions and install command. Follow with a theme, recipe, and slot
customization preview; then a mixed-size interactive component sampler and a footer with an install
action, relevant documentation paths, and project metadata.
Documentation search and the sidebar own full component discovery.

The landing may use a wider measure than article pages, while keeping the same semantic colors,
typography, spacing, focus treatment, and motion rules. Real Moraine components are its primary
visual content. Each visible interactive control should have a meaningful local response. Use open
sections, spacing, and quiet rules to organize the landing. Reserve card framing for actual component
previews rather than enclosing every section in another card. The component sampler uses a square,
ruled grid with cells of different sizes.

Do not use equal-card hero templates, generic feature-card grids, fabricated social proof, fake
browser chrome, or decorative assets that do not explain the component library.
