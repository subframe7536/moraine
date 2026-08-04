import { renderDocsCodeHtml } from '../core/expressive-code.ts'
import { parseExampleCode } from '../examples/ast.ts'
import { transformExampleModule } from '../examples/module.ts'
import { transformExampleSourceModule } from '../examples/source.ts'

function isExampleRequest(id: string): boolean {
  return id.includes('?example')
}

function isExampleSourceRequest(id: string): boolean {
  return id.includes('?example-source')
}

export const DOCS_TRANSFORM_FILTER = /(?:\?example(?:&|$)|\?example-source(?:&|$))/

export function createDocsTransformHandler() {
  return async function transformDocs(
    code: string,
    id: string,
    options?: { ssr?: boolean },
  ): Promise<string | null> {
    if (!isExampleRequest(id) && !isExampleSourceRequest(id)) {
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

    return null
  }
}
