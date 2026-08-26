# Moraine documentation design contract

This document is the visual and interaction contract for the Moraine documentation site. The
executable tokens live in `docs/unocss.config.ts`; route and component work must use those tokens
instead of introducing a parallel docs system.

## Product Character and Copy

The documentation is a calm, dense technical workbench: ruled surfaces, clear hierarchy, and
useful detail take priority over promotional treatment. It keeps the navigation rail, sticky
content header, readable article column, and contextual table of contents as the default shell.

Write direct, factual copy that explains component behavior, inputs, and constraints. Describe the
project lifecycle as **pre-1.0; breaking changes may occur**. Do not invent metrics, testimonials,
accessibility guarantees, browser-compatibility claims, or performance claims. State a limitation
when it is known rather than implying support that the source does not demonstrate.

## Semantic Surfaces and Color Roles

Use the semantic variables configured in `docs/unocss.config.ts`; no raw documentation color
palette is allowed.

| Role           | Variables                                                                           | Use                                                                                       |
| -------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Background     | `--background`, `--foreground`                                                      | Page canvas and default readable text.                                                    |
| Raised surface | `--card` / `--card-foreground` or `--popover` / `--popover-foreground`              | Examples, transient surfaces, and grouped content.                                        |
| Border         | `--border`, `--input`                                                               | Rules, field boundaries, and quiet structural separation.                                 |
| Muted text     | `--muted-foreground`                                                                | Metadata and secondary explanation; never the sole signal for state.                      |
| Action         | `--primary` / `--primary-foreground`, with `--primary-hover` and `--primary-active` | Primary links, selected navigation, and deliberate calls to action.                       |
| Focus          | `--ring` with `--background` offset                                                 | Keyboard focus treatment through `docs-focus-visible`.                                    |
| Success        | `--primary` / `--primary-foreground`                                                | A confirmed non-destructive completion when no dedicated success token exists.            |
| Warning        | `--accent` / `--accent-foreground`                                                  | A caution paired with explicit text or an icon; do not imply a dedicated warning palette. |
| Destructive    | `--destructive` / `--destructive-foreground`, with state variants                   | Failures, destructive actions, and irreversible consequences.                             |

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
| `docs-shell-header`     | 52 px (`h-13`) sticky header height.                                         |
| `docs-anchor-offset`    | 52 px (`scroll-mt-13`) anchor margin below the sticky header.                |
| `docs-content-gutter`   | 20 px on narrow screens and 32 px from `sm` upward.                          |
| `docs-article-measure`  | Maximum article width of 896 px (`max-w-4xl`).                               |
| `docs-navigation-width` | Desktop navigation rail width of 256 px (`w-64`).                            |
| `docs-toc-width`        | Desktop contextual TOC width of 240 px (`w-60`).                             |
| TOC sticky boundary     | Align below the 52 px header; its scrollable height accounts for the header. |

At 320, 375, and 414 CSS pixels, content remains in one column with the navigation in its mobile
sheet and the contextual TOC hidden. At 768 pixels, retain the gutters and avoid overflow before
introducing secondary columns. At 1440 pixels, the navigation rail and contextual TOC may frame the
article without widening the article measure. The page must never create horizontal overflow, and
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

## Previews

Every interactive Playground has a clear preview and compact controls. Playgrounds do not include a
source panel; regular `Preview` blocks provide source for standalone previews. Controls are chosen by
the author to demonstrate meaningful behavior and must wrap or move below the preview on narrow
screens; they are not a generic property editor.

Use dedicated previews for complex props, state transitions, render functions, accessibility-related
attributes, or layout constraints. Keep the preview realistic enough to reveal behavior, but do not
add fake application chrome or duplicate production previews only to fill a grid.

## Landing composition

The landing page may be more expressive than reference pages, but it uses the same semantic colors,
typography, spacing, focus treatment, and motion rules. Compose it around an asymmetric product
statement and a real component specimen, followed by a setup flow, library principles, a dense
component directory, compatibility context supported by source, and resources.

Do not use equal-card hero templates, generic feature-card grids, fabricated social proof, fake
browser chrome, or decorative assets that do not explain the component library. Positioning may take
principles from shadcn/ui's direct, navigable hierarchy and Nuxt UI's useful usage coverage with
author-selected live controls, but it must not reuse their wording, layout, assets, or
framework-specific APIs.
