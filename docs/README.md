# Docs Architecture

The docs app is a Vite + SolidJS application using `solid-file-router` for file-based routing and SSG prerendering.

## Build Pipeline

- `docs/build/plugin.ts` owns docs-specific build work.
- `buildStart` regenerates component API JSON from `dist/index.d.mts`.
- `docs/build/routes.ts` scans `docs/pages/**/*.mdx` and exposes a `solid-file-router` `routeSource`.
- `solid-file-router` loads virtual route modules from the docs route source, provides `virtual:routes`, and prerenders static HTML with its `ssg` option.

Generated route types are ignored by git and should not be edited by hand.

## Routing

Source content stays colocated:

```text
docs/pages/<group>/<page>/<page>.mdx
docs/pages/<group>/<page>/*.tsx
docs/pages/<group>/<page>/api.json
```

Generated routes use pathless groups to keep short URLs:

```text
docs/pages/general/button/button.mdx -> /button
docs/pages/form/input/input.mdx -> /input
docs/pages/introduction.mdx -> /
```

Route metadata is exposed through `routeInfo` from `virtual:routes` and consumed by the sidebar and command palette.

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

## MDX And Examples

- MDX page module generation lives in `docs/build/markdown/page.ts`.
- All docs pages use frontmatter for the visible header, route metadata, search, and per-route SEO.
- Component API reference sections render automatically from colocated `api.json`.
- Examples use the built-in MDX component with a static relative path:

  ```mdx
  <Example path="./variants" />
  <Example path="../shared/advanced.tsx" />
  ```

- Example paths may omit the `.tsx` extension, must resolve inside `docs/pages`, and cannot contain runtime expressions, queries, or hashes.
- Each example file directly exports exactly one component. The internal `?example` module exposes its component and highlighted source as a default descriptor.
- Fenced blocks, example sources, and package-manager tabs are rendered by the shared Expressive Code instance in `docs/build/core/expressive-code.ts`.
- Expressive Code base CSS, theme CSS, and copy interaction code are emitted once through docs virtual modules; individual rendered blocks only contain their block-specific styles.
- During SSR, example descriptors avoid importing browser-only modules; the client loads the interactive preview while SSG retains the example container and source.
- Previous/next cards use the flattened sidebar order and continue across group boundaries.

## SSG

`docs/vite.config.ts` configures:

- `solid({ ssr: true })`
- `fileRouter({ routeSource: createDocsRouteSource(projectRoot), ssg: { serverEntry: 'entry-server.tsx', id: 'app' } })`

`bun run docs:build` emits the prerendered site under `docs/dist/client`.

## LLM-Friendly Documentation

The docs build emits an `llms.txt` index and a Markdown representation for every page:

- `/llms.txt` lists all documentation pages by group with absolute Markdown URLs.
- `/index.md` is the Markdown version of the introduction page.
- `/<page>.md` contains the page prose, expanded example source, installation commands, and generated API reference when available.

The same endpoints are served by the Vite development server. Markdown output is generated from the page frontmatter, MDX source, colocated examples, and API JSON, so it should not be edited by hand.
