import { renderDocsCodeHtml } from '../core/expressive-code'
import { parsePreviewCode } from '../previews/ast'
import { transformPreviewModule } from '../previews/module'
import { transformPreviewSourceModule } from '../previews/source'

function isPreviewRequest(id: string): boolean {
  return id.includes('?preview')
}

function isPreviewSourceRequest(id: string): boolean {
  return id.includes('?preview-source')
}

export const DOCS_TRANSFORM_FILTER = /(?:\?preview(?:&|$)|\?preview-source(?:&|$))/

export function createDocsTransformHandler() {
  return async function transformDocs(
    code: string,
    id: string,
    options?: { ssr?: boolean },
  ): Promise<string | null> {
    if (!isPreviewRequest(id) && !isPreviewSourceRequest(id)) {
      return null
    }

    const sourceModule = await transformPreviewSourceModule(
      code,
      id,
      parsePreviewCode,
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

    const previewModule = await transformPreviewModule(code, id, parsePreviewCode, {
      ssr: options?.ssr,
    })
    if (previewModule) {
      return previewModule
    }

    return null
  }
}
