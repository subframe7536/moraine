import path from 'node:path'

import type { MdxOptions } from 'solid-file-router/plugin'

import { validateAnatomy } from '../anatomy.ts'
import { highlightApiTypes } from '../api-doc/highlight.ts'
import { loadApiDocIndex, loadComponentApiDoc } from '../api-doc/load.ts'
import { getApiReferenceTocEntries } from '../api-doc/reference-sections.ts'
import { resolveDocsPageContext } from '../core/paths.ts'
import { createDocsRouteInfo } from '../routes.ts'
import { DOCS_SITE } from '../site-meta.ts'

import { validateFrontmatterData } from './frontmatter.ts'
import {
  createDocsCodePlugin,
  createDocsCodeTabsPlugin,
  createDocsHastPlugin,
  DOCS_MDX_FEATURES,
  DOCS_ON_THIS_PAGE_DATA_KEY,
} from './plugins.ts'
import type { OnThisPageEntryLiteral } from './plugins.ts'
import { createMdxPreviewsPlugin } from './previews.ts'
import type { DocsRouteMetadata, FrontmatterData } from './types.ts'

function getDocsSourcePath(projectRoot: string, sourcePath: string): string {
  return path.resolve(projectRoot, 'docs', sourcePath)
}

function serializeJsxExpression(value: unknown): string {
  return `{${JSON.stringify(value) ?? 'undefined'}}`
}

function createDocsRouteMetadata(
  routePath: string,
  frontmatter: FrontmatterData,
): DocsRouteMetadata {
  const title = `${frontmatter.title} | Moraine`
  const canonical = new URL(routePath.replace(/^\//, ''), DOCS_SITE.siteUrl).toString()
  return {
    title,
    description: frontmatter.description,
    canonical,
    meta: [
      { property: 'og:title', content: title },
      { property: 'og:description', content: frontmatter.description },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: frontmatter.description },
    ],
  }
}

function createMarkdownContent(
  pageKey: string,
  surface: string,
  section: string,
  routePath: string,
  markdownPath: string,
  frontmatter: unknown,
  apiDoc: unknown,
  onThisPageEntries: readonly OnThisPageEntryLiteral[],
  metadata: DocsRouteMetadata,
): string {
  return `<components.Markdown
  {...props}
  pageKey=${serializeJsxExpression(pageKey)}
  surface=${serializeJsxExpression(surface)}
  section=${serializeJsxExpression(section)}
  routePath=${serializeJsxExpression(routePath)}
  markdownPath=${serializeJsxExpression(markdownPath)}
  frontmatter=${serializeJsxExpression(frontmatter)}
  apiDoc=${serializeJsxExpression(apiDoc)}
  onThisPageEntries=${serializeJsxExpression(onThisPageEntries)}
  metadata=${serializeJsxExpression(metadata)}
>
  <MDXContent {...props} />
</components.Markdown>`
}

/** Creates the docs-specific configuration layered on top of the built-in MDX provider. */
export function createDocsMdxOptions(projectRoot: string): MdxOptions {
  return {
    pagesDir: 'pages',
    features: DOCS_MDX_FEATURES,
    mdastPlugins: [
      () => createMdxPreviewsPlugin(),
      () => createDocsCodeTabsPlugin(),
      () => createDocsCodePlugin(),
    ],
    hastPlugins: [() => createDocsHastPlugin()],
    async extendLoad(document, context) {
      const sourcePath = getDocsSourcePath(projectRoot, context.sourcePath)
      const page = resolveDocsPageContext(sourcePath)
      if (context.routeId !== page.routePath) {
        throw new Error(
          `[docs-mdx] route mismatch for ${sourcePath}: ${context.routeId} != ${page.routePath}`,
        )
      }
      const frontmatter = validateFrontmatterData(document.frontmatter, sourcePath)
      const componentKeys = new Set(loadApiDocIndex(projectRoot)?.components.map(({ key }) => key))
      const onThisPageEntries = Array.isArray(document.data[DOCS_ON_THIS_PAGE_DATA_KEY])
        ? (document.data[DOCS_ON_THIS_PAGE_DATA_KEY] as OnThisPageEntryLiteral[])
        : []
      const sourceApiDoc = loadComponentApiDoc(sourcePath)
      if (page.surface === 'components' && page.routePath !== '/components') {
        await validateAnatomy(document.source, sourcePath, sourceApiDoc ?? undefined)
      }
      const apiDoc = sourceApiDoc ? await highlightApiTypes(sourceApiDoc) : undefined
      const info = createDocsRouteInfo(page, frontmatter, componentKeys, [
        ...onThisPageEntries,
        ...getApiReferenceTocEntries(apiDoc),
      ])
      const metadata = createDocsRouteMetadata(page.routePath, frontmatter)

      return {
        routeConfig: { info, metadata },
        mdxContent: createMarkdownContent(
          page.pageKey,
          page.surface,
          page.section,
          page.routePath,
          page.markdownPath,
          frontmatter,
          apiDoc,
          onThisPageEntries,
          metadata,
        ),
      }
    },
  }
}
