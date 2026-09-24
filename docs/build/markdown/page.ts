import path from 'node:path'

import type { MdxOptions } from 'solid-file-router/plugin'

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
  frontmatter: unknown,
  apiDoc: unknown,
  onThisPageEntries: readonly OnThisPageEntryLiteral[],
  markdownSource: string,
  metadata: DocsRouteMetadata,
): string {
  return `<components.Markdown
  {...props}
  pageKey=${serializeJsxExpression(pageKey)}
  frontmatter=${serializeJsxExpression(frontmatter)}
  apiDoc=${serializeJsxExpression(apiDoc)}
  onThisPageEntries=${serializeJsxExpression(onThisPageEntries)}
  markdownSource=${serializeJsxExpression(markdownSource)}
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
      const frontmatter = validateFrontmatterData(document.frontmatter, sourcePath)
      const componentKeys = new Set(loadApiDocIndex(projectRoot)?.components.map(({ key }) => key))
      const onThisPageEntries = Array.isArray(document.data[DOCS_ON_THIS_PAGE_DATA_KEY])
        ? (document.data[DOCS_ON_THIS_PAGE_DATA_KEY] as OnThisPageEntryLiteral[])
        : []
      const sourceApiDoc = loadComponentApiDoc(sourcePath)
      const apiDoc = sourceApiDoc ? await highlightApiTypes(sourceApiDoc) : undefined
      const info = createDocsRouteInfo(page.pageKey, page.group, frontmatter, componentKeys, [
        ...onThisPageEntries,
        ...getApiReferenceTocEntries(apiDoc),
      ])
      const metadata = createDocsRouteMetadata(context.routeId, frontmatter)

      return {
        routeConfig: { info, metadata },
        mdxContent: createMarkdownContent(
          page.pageKey,
          frontmatter,
          apiDoc,
          onThisPageEntries,
          document.source,
          metadata,
        ),
      }
    },
  }
}
