import { fileURLToPath } from 'node:url'

import path from 'pathe'
import { defineMdastPlugin } from 'satteri'
import type { MdxOptions } from 'solid-file-router/plugin'

import { validateAnatomy } from '../anatomy.ts'
import { highlightApiTypes } from '../api-doc/highlight.ts'
import { loadApiDocIndex, loadComponentApiDoc } from '../api-doc/load.ts'
import { getApiReferenceTocEntries } from '../api-doc/presentation.ts'
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
  routePath: string,
  apiDocExpression: string,
  sourcePath?: string,
  upstreamHref?: string,
): string {
  const attrs = [
    '{...props}',
    `routePath=${serializeJsxExpression(routePath)}`,
    ...(apiDocExpression !== 'undefined' ? [`apiDoc={${apiDocExpression}}`] : []),
    ...(sourcePath ? [`sourcePath=${serializeJsxExpression(sourcePath)}`] : []),
    ...(upstreamHref ? [`upstreamHref=${serializeJsxExpression(upstreamHref)}`] : []),
  ]
  return `<MoraineMdxProvider components={MoraineMdxComponents}>
  <MoraineMdxComponents.Markdown
    ${attrs.join('\n    ')}
  >
    <MDXContent {...props} components={MoraineMdxComponents} />
  </MoraineMdxComponents.Markdown>
</MoraineMdxProvider>`
}

export interface CreateDocsMdxOptionsConfig {
  lazyApiDoc?: boolean
}

function createDocsMdxProviderPlugin() {
  return defineMdastPlugin({
    name: 'moraine-docs-mdx-provider',
    after(root, ctx) {
      ctx.prependChild(root, [
        {
          type: 'mdxjsEsm' as const,
          value: "import { MDXProvider as MoraineMdxProvider } from 'solid-file-router/mdx'",
        },
        {
          type: 'mdxjsEsm' as const,
          value:
            "import { DOCS_MDX_COMPONENTS as MoraineMdxComponents } from '/routes/components/markdown/mdx-components'",
        },
      ])
    },
  })
}

function createDocsApiDocPlugin() {
  return defineMdastPlugin({
    name: 'moraine-docs-api-doc',
    after(root, ctx) {
      const documentId = ctx.fileURL ? fileURLToPath(ctx.fileURL) : undefined
      if (!documentId) {
        return
      }
      const page = resolveDocsPageContext(documentId)
      if (page.surface !== 'components' || page.routePath === '/components') {
        return
      }
      if (!loadComponentApiDoc(documentId)) {
        return
      }
      ctx.prependChild(root, [
        {
          type: 'mdxjsEsm' as const,
          value: `import __moraineApiDoc from ${JSON.stringify(`virtual:api-doc/${page.pageKey}`)}`,
        },
      ])
    },
  })
}

/** Creates the docs-specific configuration layered on top of the built-in MDX provider. */
export function createDocsMdxOptions(
  projectRoot: string,
  config: CreateDocsMdxOptionsConfig = {},
): MdxOptions {
  const lazyApiDoc = config.lazyApiDoc === true
  let cachedComponentKeys: Set<string> | undefined

  const getComponentKeys = () => {
    cachedComponentKeys ??= new Set(loadApiDocIndex(projectRoot)?.components.map(({ key }) => key))
    return cachedComponentKeys
  }

  return {
    features: DOCS_MDX_FEATURES,
    mdastPlugins: [
      () => createDocsMdxProviderPlugin(),
      ...(lazyApiDoc ? [() => createDocsApiDocPlugin()] : []),
      () => createMdxPreviewsPlugin(),
      () => createDocsCodeTabsPlugin(),
      () => createDocsCodePlugin(),
    ],
    hastPlugins: [() => createDocsHastPlugin()],
    async extendLoad(document, context) {
      const sourcePath = getDocsSourcePath(projectRoot, context.sourcePath)
      const page = resolveDocsPageContext(sourcePath)
      const routeId =
        context.routePath ??
        `/${context.path
          .replaceAll(/(^|\/)\([^)]*\)\//g, '$1')
          .replace(/\.[^./]+$/, '')
          .replace(/(^|\/)index$/, '$1')
          .replace(/\/$/, '')}`
      if (routeId !== page.routePath) {
        throw new Error(
          `[docs-mdx] route mismatch for ${sourcePath}: ${routeId} != ${page.routePath}`,
        )
      }
      const frontmatter = validateFrontmatterData(document.frontmatter, sourcePath)
      const componentKeys = getComponentKeys()
      const onThisPageEntries = Array.isArray(document.data[DOCS_ON_THIS_PAGE_DATA_KEY])
        ? (document.data[DOCS_ON_THIS_PAGE_DATA_KEY] as Array<OnThisPageEntryLiteral>)
        : []
      const sourceApiDoc = loadComponentApiDoc(sourcePath)
      if (page.surface === 'components' && page.routePath !== '/components') {
        await validateAnatomy(document.source, sourcePath, sourceApiDoc ?? undefined)
      }
      const apiDoc =
        lazyApiDoc || !sourceApiDoc ? sourceApiDoc : await highlightApiTypes(sourceApiDoc)
      const info = createDocsRouteInfo(page, frontmatter, componentKeys, [
        ...onThisPageEntries,
        ...getApiReferenceTocEntries(apiDoc ?? undefined),
      ])
      const metadata = createDocsRouteMetadata(page.routePath, frontmatter)
      const apiDocExpression =
        lazyApiDoc && sourceApiDoc
          ? '__moraineApiDoc'
          : (JSON.stringify(apiDoc ?? undefined) ?? 'undefined')

      return {
        routeConfig: { info, metadata },
        mdxContent: createMarkdownContent(
          page.routePath,
          apiDocExpression,
          frontmatter.api?.path,
          frontmatter.upstreamHref,
        ),
      }
    },
  }
}
