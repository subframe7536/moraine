# Docs Architecture

This document describes the current docs architecture after the MDX migration.

## Overview

The docs app is a Vite + SolidJS application with two docs-specific plugins:

- `docsPlugin()` handles docs content.
- `siteMetaPlugin()` handles static page metadata.

`docsPlugin()` owns the full docs content pipeline:

1. Generate component API JSON from `dist/index.d.mts`.
2. Scan `docs/pages/**/*.mdx` and expose `virtual:example-pages`.
3. Compile MDX pages into Solid modules.
4. Resolve `?example` demo imports and `?example-source&name=...` highlighted source modules.

At runtime, `docs/index.tsx` loads `virtual:example-pages`, builds sidebar navigation, and lazy-renders the active page.

## Content Layout

### Page-Local Structure

Each component page is now self-contained:

```text
docs/pages/<group>/<page>/<page>.mdx
docs/pages/<group>/<page>/*.tsx
docs/pages/<group>/<page>/api.json
```

Examples:

- `docs/pages/general/button/button.mdx`
- `docs/pages/general/button/variants.tsx`
- `docs/pages/overlay/toast/toast.mdx`
- `docs/pages/overlay/toast/basic-toasts.tsx`

Root-level pages (for example `docs/pages/introduction.mdx`) are also supported.

### Key and Group Derivation

- `key` is derived from the MDX filename, with `button/button.mdx` resolving to `button`.
- Component pages use `docs/pages/<group>/<page>/<page>.mdx`; page-local demos stay beside the page file.
- `group` is derived from the first directory segment under `docs/pages`.

The shared page-path logic lives in `docs/vite-plugin/core/paths.ts` and is reused by markdown compilation, page scanning, and API doc lookup.

## MDX Components

### Demo imports

```mdx
import { DemoButtonVariants } from './variants?example'

<DemoButtonVariants />
```

Demo imports must use the explicit `?example` suffix. The Vite plugin wraps the imported demo component with the shared preview/source UI and derives highlighted source from the original demo export.

### Runtime widgets

```mdx
<IntroCards />
```

Widgets are provided through the MDX component map.

Component pages should explicitly include:

```mdx
<DocsHeader />
```

and:

```mdx
<HeadingWithAnchor id="api-ref" level={2}>
  API Reference
</HeadingWithAnchor>

<DocsApiReference />
```

### `<CodeTabs />`

```mdx
<CodeTabs package="moraine" />
```

Props:

- `package` (required): package name used to generate install commands for bun/pnpm/npm.

MDX compilation lives in `docs/vite-plugin/markdown/compile.ts`.

## Runtime Rendering Model

`docs/components/markdown.tsx` renders the Sätteri-compiled MDX component with a docs component map:

- Markdown elements -> Solid JSX with injected docs typography classes
- `?example` imports -> live preview plus highlighted source
- `<DocsHeader />` / `<DocsApiReference />` -> implicit MDX imports backed by page-local `api.json`
- MDX widget components -> dynamic docs runtime components
- Code-tabs segment -> install-command tabs with build-time highlighted code

Page shell and On This Page layout are provided by `docs/components/markdown.tsx`.
Header and API rendering are provided by explicit widgets in page markdown.

## API Docs Integration

`docsPlugin()` generates:

- `docs/pages/_api-index.json`
- `docs/pages/<group>/<page>/api.json`

The MDX compiler derives `componentKey` from page path and prepends implicit MDX imports for
`DocsHeader`, `DocsApiReference`, `HeadingWithAnchor`, and page-local `./api.json` when the page
uses those widgets. `apiDocOverride` on `<DocsHeader />` still merges with the generated API JSON
before the header and reference model are rendered.

The implementation is split across:

- `docs/vite-plugin/api-doc/extract.ts`
- `docs/vite-plugin/api-doc/load.ts`
- `docs/vite-plugin/api-doc/write.ts`

Public API doc types live in `docs/vite-plugin/api-doc/types.ts`.

## Vite Plugin Layout

`docs/vite-plugin/` is organized by responsibility:

- `docs-plugin.ts`: single docs content plugin entry
- `site-meta.ts`: metadata tags for `transformIndexHtml`
- `core/`: shared path, string, and Shiki helpers
- `api-doc/`: extraction, loading, writing, and types
- `markdown/`: Sätteri MDX compilation, frontmatter parsing, and page metadata
- `examples/`: page scanning and example source extraction
- `virtual.d.ts`: virtual module declarations

## Styling and Typography

- UnoCSS is configured in `docs/unocss.config.ts`.
- Sätteri HAST plugins inject docs prose classes into rendered MDX elements.
- Demo and widget blocks render as Solid components.

## Directory Responsibilities

- `docs/pages/`: MDX pages, colocated demos, and colocated API JSON
- `docs/components/`: docs runtime UI and page composition
- `docs/vite-plugin/`: build-time docs compiler, API doc extraction, and virtual modules
