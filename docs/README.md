# Docs Architecture

The private `@moraine/docs` workspace imports the Moraine library from `src/`. Vite, SolidJS, and `solid-file-router` build the site and prerender its pages.

## Information architecture

The landing is `/`. Conceptual documentation lives under `/docs/**`, and component reference lives at `/components` and `/components/**`. These are separate navigation spaces in the header, sidebar, and Previous/Next controls. Search covers both spaces.

```text
docs/pages/docs/(overview)/getting-started.mdx       → /docs/getting-started
docs/pages/docs/(overview)/installation.mdx          → /docs/installation
docs/pages/docs/(overview)/unocss.mdx                → /docs/unocss
docs/pages/docs/(overview)/tailwind.mdx              → /docs/tailwind
docs/pages/docs/(guides)/composition.mdx             → /docs/composition
docs/pages/docs/(guides)/polymorphism.mdx            → /docs/polymorphism
docs/pages/docs/(guides)/typescript.mdx              → /docs/typescript
docs/pages/docs/(guides)/ssr.mdx                     → /docs/ssr
docs/pages/docs/(guides)/accessibility.mdx           → /docs/accessibility
docs/pages/docs/(styling)/design.mdx                 → /docs/design
docs/pages/docs/(styling)/customization.mdx          → /docs/customization
docs/pages/docs/(styling)/theming.mdx                → /docs/theming
docs/pages/docs/(styling)/icons.mdx                  → /docs/icons
docs/pages/docs/(styling)/animations.mdx             → /docs/animations
docs/pages/docs/utils/class-merging.mdx              → /docs/utils/class-merging
docs/pages/docs/utils/create-*.mdx                   → /docs/utils/create-*
docs/pages/components/index.mdx                      → /components
docs/pages/components/(general)/button/index.mdx     → /components/button
```

Docs sections run Overview → Guides → Styling → Utils. Components run Overview → General → Form → Navigation → Overlay. `sidebar.order` controls ordering within each section. Group directories in parentheses are pathless. Component source, previews, and generated `api.json` stay colocated.

`docs/build/core/paths.ts` derives `surface`, `section`, `routePath`, and `markdownPath` from the source path. The canonical route path is used for metadata and page links; Markdown mirrors it with `.md`. The root landing has no Markdown page. Old root-level URLs have no redirect.

`docs/vite.config.ts` excludes the UI implementation in `docs/routes/components/**/*.tsx` while allowing the MDX provider to discover `docs/pages/components/**/*.mdx`. Keep these ignore rules distinct.

## Content contract

All pages have validated frontmatter with `title`, `description`, `sidebar.order`, and nonempty `search.tags`. A component can additionally register `api.path`, optional API parts, and `upstreamHref`. Unknown fields fail the build. Surface and section come from the path rather than frontmatter.

A component page uses this order:

```text
PageHeader → Playground → Anatomy? → Usage → Examples → generated API Reference (Attributes, Props)
```

Playground has no heading. Playground controls show only visually meaningful primitive states.

`Usage` is text and fenced code only: no `<Preview />`. It teaches when to use the component, when not to, and how to compose the public API. Start with a short choice-oriented introduction and one complete TSX example that imports `moraine`. Follow with subsections that explain state, composition, and constraints the API table cannot convey; put a small code fence next to a behavior when a snippet teaches it faster than prose. Keep keyboard or accessibility rules that Moraine adds beside the relevant subsection. Do not repeat native browser behavior.

`Examples` is required. Each example is a real application task with a short agent-facing guide and a self-contained `<Preview />` whose TSX is the copyable source. Prefer tasks, compositions, and state transitions over catalogs of variants and sizes.

Anatomy is optional. When included, use one `## Anatomy` heading and one `<Anatomy value={...} />` with a static configuration, rendered as a fenced `text` tree. Every node identifies a public `component` or attached `part`, a style `slot`, or an `internal` detail. Root nodes say `slot=root` or `no DOM`. The build validates names against `api.json`; see `docs/build/anatomy.ts` and `docs/build/content.test.ts`. A style slot does not imply a matching attached JSX part.

Preview paths are static, relative to a page, and point to a self-contained TSX file. Their copyable source appears in both the web page and generated Markdown. Do not add a Preview merely to meet a quota.

## Build pipeline and Markdown

`docs/build/plugin.ts` regenerates API JSON from source types and recipes. `docs/build/markdown/page.ts` adds metadata, highlighted code, previews, and the shared page shell to MDX routes. `docs/build/routes.ts` scans the same MDX pages for navigation and Markdown generation. `docs/build/llms.ts` emits `/llms.txt` and a `.md` counterpart for each page. The development server serves the same Markdown paths.

Every generated document, including `/llms.txt`, starts with YAML frontmatter containing `title`, `description`, `package`, `version`, and `repository`. Package metadata comes from the root `package.json`; the repository is a browser-friendly GitHub URL. Markdown removes build-only frontmatter fields, MDX imports, Playground, and docs-only UI controls. It expands Preview TSX and generated API reference, converts internal links through exact canonical route paths, and expands the Components directory with descriptions from route metadata. The web directory stays a compact text-link grid. The page header's View and Copy Markdown actions use the same `.md` resource.

The shared shell in `docs/routes/_app.tsx` owns route scrolling and hash navigation; the table of contents observes visible headings. `docs/DESIGN.md` defines visual and interaction guidelines. Generated route types and `docs/dist` are build artifacts.

## Verification

Do not add tests under `docs/routes/**`. Build logic has focused tests under `docs/build`.

```bash
pnpm vitest run docs/build/routes.test.ts docs/build/content.test.ts docs/build/llms.test.ts docs/build/markdown/frontmatter.test.ts docs/build/markdown/page.test.ts
pnpm run test
pnpm run qa
pnpm run docs:build
git diff --check
```

Serve the production output with `pnpm run docs:preview` and check landing, both navigation spaces, representative component pages, nested Markdown URLs, keyboard navigation, and mobile layout.
