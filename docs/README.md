# Docs Architecture

The docs app is the private `@moraine/docs` pnpm workspace package. It imports the root `src/`
directly, so component edits update the development server through Vite HMR. The app uses Vite +
SolidJS with `solid-file-router` for file-based routing and SSG prerendering.

## Build Pipeline

- `docs/build/plugin.ts` owns docs-specific build work.
- `configResolved` regenerates component API JSON from `src/` types, recipes, and JSX.
- `docs/build/markdown/page.ts` configures the built-in `mdxRouteProvider` with docs metadata, previews, code tabs, and rendered Markdown layout.
- `solid-file-router` discovers `docs/routes` through its built-in `fsRouteProvider`, discovers `docs/pages/**/*.mdx` through its built-in `mdxRouteProvider`, provides `virtual:routes`, and prerenders static HTML with its `ssg` option.

Generated route types are ignored by git and should not be edited by hand. MDX routes use the
same file-name resolution as the default file router: `index.mdx` removes the final segment and
directories wrapped in parentheses are pathless groups.

## Routing

Source content stays colocated:

```text
docs/pages/(<group>)/<page>/index.mdx
docs/pages/(<group>)/<page>/*.tsx
docs/pages/(<group>)/<page>/api.json
```

Generated routes use pathless groups to keep short URLs:

```text
docs/pages/(general)/button/index.mdx -> /button
docs/pages/(form)/input/index.mdx -> /input
docs/routes/index.tsx -> / (dedicated landing route)
docs/pages/start.mdx -> /start
```

The app layout is defined in `docs/routes/_app.tsx`; its route-local implementation components live in
`docs/routes/components/`, which the built-in router ignores during route discovery.

Route metadata is exposed through `routeInfo` from `virtual:routes` and consumed by the sidebar and command palette.

`docs/DESIGN.md` is the visual and interaction contract. Keep it aligned with the shared shell instead
of introducing page-local visual systems. Route headings, including generated API sections, flow from the
MDX build into the section-search index, so every search result is a semantic destination with a stable
route and hash. The sidebar uses the same route metadata and path-derived group ordering as search, which
keeps its navigation order and search destinations consistent.

Every MDX page owns its navigation and discovery metadata:

```yaml
---
title: Button
description: Button component with polymorphic rendering and automatic loading state.
sidebar:
  order: 2
  badge: New # optional
search:
  tags: [action, click, submit, loading]
---
```

`title`, `description`, `sidebar.order`, and a non-empty `search.tags` array are required.
Orders must be unique within a path-derived group. The visible group order is root, form, general,
navigation, and overlay; pages are sorted by `sidebar.order` inside each group.

## MDX And Previews

- MDX page module generation is handled by `solid-file-router`; `docs/build/markdown/page.ts` only supplies the provider extensions.
- All docs pages use frontmatter for the visible header, route metadata, search, and per-route SEO.
- Component API reference sections render automatically from colocated `api.json`.
- Previews use the built-in MDX component with a static relative path:

  ```mdx
  <Preview path="./variants" />
  <Preview path="../shared/advanced.tsx" />
  ```

- Preview paths may omit the `.tsx` extension, must resolve inside `docs/pages`, and cannot contain runtime expressions, queries, or hashes.
- Each preview file directly exports exactly one component. The internal `?preview` module exposes its component and highlighted source as a default descriptor.
- Keep each preview self-contained in one TSX file. Its data, types, and helpers must be in that file so the displayed source and generated Markdown have no local docs imports.
- Fenced blocks, Preview sources, and package-manager tabs are pre-rendered at build time with Shiki using `docs/build/core/shiki.ts`.
- Code block styling uses dual-theme CSS variables in `docs/code.css` without runtime highlighter overhead; `<CodeBlock />` provides the shared interactive container for normal blocks, `<CodeTabs />`, and `<Preview />`.
- During SSR, Preview descriptors avoid importing browser-only modules; the client loads the interactive preview while SSG retains the Preview container and source.
- Previous/next cards use the flattened sidebar order and continue across group boundaries.

Each page's `<Playground>` selects a few meaningful primitive Input, Switch, or Select controls and
renders its live specimen in MDX. `<Preview>` loads a separate, self-contained TSX example and its
copyable source. JSX, callbacks, object values, render props, and complex state belong in those
dedicated examples. The `llms` output omits Playground implementation and expands Preview source.

## Shell, Scrolling, And Theme

`docs/routes/_app.tsx` owns route and hash scrolling. The table of contents only observes heading visibility
and exposes the active section; it never competes to scroll the document. The shared shell provides the
skip link, navigation, responsive inline/rail table of contents, search, pagination, code-block controls,
and heading permalinks.

Theme preference is persisted and applied before paint, then reconciled by the theme runtime. Keep this
pre-paint behavior intact so a saved dark theme does not flash light during navigation or reload.

## Landing and Getting Started

`/` is a dedicated TSX product landing route with a lightweight shell and live Moraine components.
It is separate from the docs route registry. `/start` is the first MDX documentation page,
with installation, required styling setup, and first component usage. The docs shell, sidebar,
search, and Markdown rendering apply to `/start` and other documentation routes.

## SSG

`docs/vite.config.ts` configures:

- `solid({ ssr: true })`
- `fileRouter({ pagesDir: 'routes', mdx: createDocsMdxOptions(projectRoot), ssg: { id: 'app' } })`

`pnpm run docs:build` emits the prerendered site under `docs/dist/client`.

## Verification

Run focused checks while changing the relevant area, then run the complete production gates before release:

```bash
# Focused checks, selected for the area being changed.
pnpm run test docs/build/routes.test.ts docs/build/markdown/page.test.ts
pnpm run test sidebar.test.tsx docs-command-palette.test.tsx
pnpm run test docs/build/content.test.ts docs/build/previews/source.test.ts

# Repository and SSG gates.
pnpm run test
pnpm run qa
pnpm run docs:build
git diff --check

# Production browser verification after the SSG build.
pnpm run docs:preview
```

Use the production preview to check representative component routes at narrow and desktop widths,
including Playground controls, Preview source and rendering, anchors, themes, keyboard focus, and
overlays. Check the browser console for errors and uncaught exceptions. Generated output under
`docs/dist` must never be edited to make a check pass.

## LLM-Friendly Documentation

The docs build emits an `llms.txt` index and a Markdown representation for every page:

- `/llms.txt` lists all documentation pages by group with absolute Markdown URLs.
- `/start.md` is the Markdown version of Getting Started; the landing has no Markdown export.
- `/<page>.md` contains the page prose, expanded example source, installation commands, and generated API reference when available.

The same endpoints are served by the Vite development server. Markdown output is generated from the page frontmatter, MDX source, colocated previews, and API JSON, so it should not be edited by hand.
