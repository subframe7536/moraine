import { normalizePath } from 'vite'

import { DOCS_PAGE_FILE_RE } from '../core/paths'
import { DOCS_HIGHLIGHT_THEMES, getDocsHighlighter } from '../core/shiki'
import { EXAMPLE_PARSE_OPTIONS } from '../examples/ast'
import type { ProgramNode } from '../examples/ast'
import { transformExampleModule } from '../examples/module'
import { transformExampleSourceModule } from '../examples/source'
import { compileMarkdownPage } from '../markdown/compile'

interface DocsTransformContext {
  parse: (input: string, options?: typeof EXAMPLE_PARSE_OPTIONS) => ProgramNode
}

function isExampleRequest(id: string): boolean {
  return id.includes('?example')
}

function isExampleSourceRequest(id: string): boolean {
  return id.includes('?example-source')
}

function isDocsPageRequest(id: string): boolean {
  return DOCS_PAGE_FILE_RE.test(normalizePath(id))
}

export const DOCS_TRANSFORM_FILTER =
  /(?:\?example(?:&|$)|\?example-source(?:&|$)|[\\/]docs[\\/]pages[\\/].*\.mdx$)/

export function createDocsTransformHandler(projectRootProvider: () => string) {
  const highlighterPromise = getDocsHighlighter()

  return async function transformDocs(
    this: DocsTransformContext,
    code: string,
    id: string,
    options?: { ssr?: boolean },
  ): Promise<string | null> {
    if (!isExampleRequest(id) && !isExampleSourceRequest(id) && !isDocsPageRequest(id)) {
      return null
    }

    const highlighter = await highlighterPromise
    const parseExampleCode = (source: string) => this.parse(source, EXAMPLE_PARSE_OPTIONS)

    const sourceModule = transformExampleSourceModule(code, id, parseExampleCode, (source, lang) =>
      highlighter.codeToHtml(source, { lang, themes: DOCS_HIGHLIGHT_THEMES }),
    )
    if (sourceModule) {
      return sourceModule
    }

    const exampleModule = transformExampleModule(code, id, parseExampleCode, { ssr: options?.ssr })
    if (exampleModule) {
      return exampleModule
    }

    const idWithoutQuery = id.split('?')[0] ?? id
    if (!isDocsPageRequest(idWithoutQuery)) {
      return null
    }

    return compileMarkdownPage(code, idWithoutQuery, {
      projectRoot: projectRootProvider(),
      highlightCode: (source, lang) =>
        highlighter.codeToHtml(source, { lang, themes: DOCS_HIGHLIGHT_THEMES }),
    })
  }
}
