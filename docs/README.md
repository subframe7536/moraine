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
4. Resolve `?example-source&name=...` imports into highlighted source HTML.

At runtime, `docs/index.tsx` loads `virtual:example-pages`, builds sidebar navigation, and lazy-renders the active page.

## Content Layout

### Page-Local Structure

Each component page is now self-contained:

```text
docs/pages/<group>/<page>.mdx
docs/pages/<group>/<page>/examples/*.tsx
```

Examples:

- `docs/pages/general/button.mdx`
- `docs/pages/general/button/examples/variants.tsx`
- `docs/pages/overlay/toast.mdx`
- `docs/pages/overlay/toast/examples/basic-toasts.tsx`

Root-level pages (for example `docs/pages/introduction.mdx`) are also supported.

### Key and Group Derivation

- `key` is derived from the MDX filename.
- Component pages usually use `docs/pages/<group>/<page>.mdx`; page-local examples stay in `docs/pages/<group>/<page>/examples`.
- Nested pages such as `button/button.mdx` are still supported for compatibility.
- `group` is derived from the first directory segment under `docs/pages`.

The shared page-path logic lives in `docs/vite-plugin/core/paths.ts` and is reused by markdown compilation, page scanning, and API doc lookup.

## MDX Components

### `<Example />`

```mdx
<Example name="Variants" />
```

Props:

- `name` (required): exported component name from the example module.
- `source` (optional): module path relative to the MDX file.

If `source` is omitted, it defaults to:

```text
./examples/<kebab-case(name)>.tsx
```

Examples:

- `name: LoadingStates` -> `./examples/loading-states.tsx`
- `name: PromiseScopedInstances` -> `./examples/promise-scoped-instances.tsx`

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
- `<Example />` -> live preview plus highlighted source
- `<DocsApiReference />` -> compile-time API reference model
- MDX widget components -> dynamic docs runtime components
- Code-tabs segment -> install-command tabs with build-time highlighted code

Page shell and On This Page layout are provided by `docs/components/markdown.tsx`.
Header and API rendering are provided by explicit widgets in page markdown.

## API Docs Integration

`docsPlugin()` generates:

- `docs/api-doc/index.json`
- `docs/api-doc/components/*.json`

The MDX compiler derives `componentKey` from page path and loads matching API docs at build time.
It injects:

- `apiDoc` for the derived component key
- merged `apiDoc` when `<DocsHeader />` provides `apiDocOverride`

`componentKey` is only exposed to runtime when there is API doc data to render.

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
- Example and widget blocks render as Solid components through the MDX component map.

## Directory Responsibilities

- `docs/pages/`: MDX pages and their page-local `examples/`
- `docs/components/`: docs runtime UI and page composition
- `docs/vite-plugin/`: build-time docs compiler, API doc extraction, and virtual modules
