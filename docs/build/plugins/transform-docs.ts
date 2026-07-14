import { normalizePath } from 'vite'

import { renderDocsCodeHtml } from '../core/expressive-code'
import { DOCS_PAGE_FILE_RE } from '../core/paths'
import { parseExampleCode } from '../examples/ast'
import { transformExampleModule } from '../examples/module'
import { transformExampleSourceModule } from '../examples/source'
import { compileMarkdownPage } from '../markdown/page'

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

export function createDocsTransformHandler() {
  return async function transformDocs(
    code: string,
    id: string,
    options?: { ssr?: boolean },
  ): Promise<string | null> {
    if (!isExampleRequest(id) && !isExampleSourceRequest(id) && !isDocsPageRequest(id)) {
      return null
    }

    const sourceModule = await transformExampleSourceModule(
      code,
      id,
      parseExampleCode,
      (source, lang) => {
        const sourceFilePath = id.split('?')[0] ?? id
        return renderDocsCodeHtml({
          code: source,
          language: lang,
          sourceFilePath,
          stickyCopyButton: true,
          props: {
            frame: 'none',
            showLineNumbers: true,
          },
        })
      },
    )
    if (sourceModule) {
      return sourceModule
    }

    const exampleModule = await transformExampleModule(code, id, parseExampleCode, {
      ssr: options?.ssr,
    })
    if (exampleModule) {
      return exampleModule
    }

    const idWithoutQuery = id.split('?')[0] ?? id
    if (!isDocsPageRequest(idWithoutQuery)) {
      return null
    }

    return compileMarkdownPage(code, idWithoutQuery)
  }
}
