import { normalizePath } from 'vite'

import { DOCS_PAGE_FILE_RE } from '../core/paths'
import { DOCS_HIGHLIGHT_THEMES, getDocsHighlighter } from '../core/shiki'
import { transformExampleSourceModule } from '../examples/source'
import { compileMarkdownPage } from '../markdown/compile'
import type { DocsPluginRegistry } from '../registry'

function isExampleSourceRequest(id: string): boolean {
  return id.includes('?example-source')
}

function isDocsPageRequest(id: string): boolean {
  return DOCS_PAGE_FILE_RE.test(normalizePath(id))
}

export const DOCS_TRANSFORM_FILTER = /(?:\?example-source(?:&|$)|[\\/]docs[\\/]pages[\\/].*\.md$)/

export function createDocsTransformHandler(
  projectRootProvider: () => string,
  registry: DocsPluginRegistry,
) {
  const highlighterPromise = getDocsHighlighter()

  return async (code: string, id: string): Promise<string | null> => {
    if (!isExampleSourceRequest(id) && !isDocsPageRequest(id)) {
      return null
    }

    const highlighter = await highlighterPromise

    const sourceModule = transformExampleSourceModule(code, id, (source, lang) =>
      highlighter.codeToHtml(source, { lang, themes: DOCS_HIGHLIGHT_THEMES }),
    )
    if (sourceModule) {
      return sourceModule
    }

    const idWithoutQuery = id.split('?')[0] ?? id
    if (!isDocsPageRequest(idWithoutQuery)) {
      return null
    }

    return compileMarkdownPage(code, idWithoutQuery, {
      projectRoot: projectRootProvider(),
      directiveAliases: registry.directiveAliases,
      highlightCode: (source, lang) =>
        highlighter.codeToHtml(source, { lang, themes: DOCS_HIGHLIGHT_THEMES }),
    })
  }
}
