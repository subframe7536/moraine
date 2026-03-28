# Docs Architecture

This document describes the current docs architecture after the TSX -> Markdown migration.

## Overview

The docs app is a Vite + SolidJS application with two docs-specific plugins:

- `docsPlugin()` handles docs content.
- `siteMetaPlugin()` handles static page metadata.

`docsPlugin()` owns the full docs content pipeline:

1. Generate component API JSON from `dist/index.d.mts`.
2. Scan `docs/pages/**/*.md` and expose `virtual:example-pages`.
3. Compile markdown pages into Solid modules.
4. Resolve `?example-source&name=...` imports into highlighted source HTML.

At runtime, `docs/index.tsx` loads `virtual:example-pages`, builds sidebar navigation, and lazy-renders the active page.

## Content Layout

### Page-Local Structure

Each component page is now self-contained:

```text
docs/pages/<group>/<page>/<page>.md
docs/pages/<group>/<page>/examples/*.tsx
```

Examples:

- `docs/pages/general/button/button.md`
- `docs/pages/general/button/examples/variants.tsx`
- `docs/pages/overlay/toast/toast.md`
- `docs/pages/overlay/toast/examples/basic-toasts.tsx`

Root-level pages (for example `docs/pages/introduction.md`) are also supported.

### Key and Group Derivation

- `key` is derived from markdown filename.
- If filename equals parent directory (for example `button/button.md`), that shared name is used as the key (`button`).
- `group` is derived from the first directory segment under `docs/pages`.

The shared page-path logic lives in `docs/vite-plugin/core/paths.ts` and is reused by markdown compilation, page scanning, and API doc lookup.

## Markdown Directives

### `:::example`

```md
:::example
name: Variants
:::
```

Fields:

- `name` (required): exported component name from the example module.
- `source` (optional): module path relative to the markdown file.

If `source` is omitted, it defaults to:

```text
./examples/<kebab-case(name)>.tsx
```

Examples:

- `name: LoadingStates` -> `./examples/loading-states.tsx`
- `name: PromiseScopedInstances` -> `./examples/promise-scoped-instances.tsx`

### `:::widget`

```md
:::widget
name: intro-cards
:::
```

Widgets are resolved by `docs/widgets/index.ts`.

Component pages should explicitly include:

```md
:::widget
name: docs-header
:::
```

and:

```md
:::widget
name: docs-api-reference
:::
```

### `:::code-tabs`

```md
:::code-tabs
package: moraine
:::
```

Fields:

- `package` (required): package name used to generate install commands for bun/pnpm/npm.

Directive parsing lives in `docs/vite-plugin/markdown/directives.ts`.

## Runtime Rendering Model

`docs/components/markdown.tsx` renders a flat segment list produced at compile time:

- Markdown segment -> rendered HTML block
- Example segment -> live preview plus highlighted source
- Widget segment -> dynamic component from `docsWidgetMap`
- Code-tabs segment -> install-command tabs with build-time highlighted code

Page shell and On This Page layout are provided by `docs/components/markdown.tsx`.
Header and API rendering are provided by explicit widgets in page markdown.

## API Docs Integration

`docsPlugin()` generates:

- `docs/api-doc/index.json`
- `docs/api-doc/components/*.json`

The markdown compiler derives `componentKey` from page path and loads matching API docs at build time.
It injects:

- `apiDoc` for the derived component key
- merged `apiDoc` when `docs-header` widget provides `props.apiDocOverride`

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
- `markdown/`: frontmatter, directive parsing, and page compilation
- `examples/`: page scanning and example source extraction
- `virtual.d.ts`: virtual module declarations

## Styling and Typography

- UnoCSS is configured in `docs/unocss.config.ts`.
- Markdown HTML rendering uses UnoCSS `presetTypography`.
- `MarkdownContent` applies `prose` classes to markdown-only sections.
- Example blocks are rendered outside markdown prose to avoid style interference with interactive components.

## Directory Responsibilities

- `docs/pages/`: markdown pages and their page-local `examples/`
- `docs/widgets/`: widget components for `:::widget`
- `docs/components/`: docs runtime UI and page composition
- `docs/vite-plugin/`: build-time docs compiler, API doc extraction, and virtual modules
