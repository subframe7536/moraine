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

## MDX And Examples

- MDX page module generation lives in `docs/build/markdown/page.ts`.
- Component docs pages use frontmatter for docs header rendering.
- Component API reference sections render automatically from colocated `api.json`.
- Demo imports still use `?example`.
- Example modules are wrapped by `docs/build/examples/module.ts`.
- During SSR, demo wrappers avoid importing browser-only demo modules; the client loads the interactive examples.

## SSG

`docs/vite.config.ts` configures:

- `solid({ ssr: true })`
- `fileRouter({ routeSource: createDocsRouteSource(projectRoot), ssg: { serverEntry: 'entry-server.tsx', id: 'app' } })`

`bun run docs:build` emits the prerendered site under `docs/dist/client`.
