# Docs Architecture

This document describes the current docs architecture after the TSX -> Markdown migration

## Overview

The docs app is a Vite + SolidJS application with a build-time Markdown compiler.

Build pipeline:

1. `docs/vite-plugin/example-pages.ts` scans `docs/pages/**/*.md` and generates `virtual:example-pages`.
2. `docs/vite-plugin/example-markdown.ts` compiles each page markdown file into a Solid page module.
3. `docs/vite-plugin/example-source.ts` handles `?example-source&name=...` imports and returns highlighted source HTML.
4. `docs/index.tsx` loads `virtual:example-pages`, builds sidebar navigation, and lazy-renders the active page.

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

### `:::code-tabs`

```md
:::code-tabs
package: moraine
:::
```

Fields:

- `package` (required): package name used to generate install commands for bun/pnpm/npm.

## Runtime Rendering Model

`docs/components/markdown.tsx` renders a flat segment list produced at compile time:

- Markdown segment -> `MarkdownContent`
- Example segment -> `ExampleBlock` (live preview + optional source panel)
- Widget segment -> dynamic component from `docsWidgetMap`
- Code-tabs segment -> `CodeBlockTabs` (build-time highlighted install commands)

Page shell and API tables are provided by `docs/components/markdown.tsx`.

## API Docs Integration

`docs/vite-plugin/api-doc.ts` generates:

- `docs/api-doc/index.json`
- `docs/api-doc/components/*.json`

`example-markdown` derives `componentKey` from page path and loads matching API docs at build time.
It injects:

- `apiDoc` for the derived component key
- `extraApiDocs` from frontmatter `extraApiKeys`
- merged `apiDoc` when frontmatter `apiDocOverride` exists

`componentKey` is only exposed to runtime when there is API doc data to render.

## Styling and Typography

- UnoCSS is configured in `docs/unocss.config.ts`.
- Markdown HTML rendering uses UnoCSS `presetTypography`.
- `MarkdownContent` applies `prose` classes to markdown-only sections.
- Example blocks are rendered outside markdown prose to avoid style interference with interactive components.

## Directory Responsibilities

- `docs/pages/`: markdown pages and their page-local `examples/`
- `docs/widgets/`: widget components for `:::widget`
- `docs/components/`: docs runtime UI and page composition
- `docs/vite-plugin/`: build-time plugins (`example-pages`, `example-markdown`, `example-source`, `api-doc`)
