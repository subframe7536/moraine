import { renderDocsCodeHtml } from '../core/shiki.ts'

import { normalizeApiType } from './presentation.ts'
import type { ComponentApi } from './types.ts'

/** Enrich page data without writing presentation HTML into the generated API JSON. */
export async function highlightApiTypes(api: ComponentApi): Promise<ComponentApi> {
  const highlighted = new Map<string, Promise<string>>()
  return {
    ...api,
    parts: await Promise.all(
      api.parts.map(async (part) => ({
        ...part,
        props: await Promise.all(
          part.props.map(async (prop) => {
            const type = normalizeApiType(prop.typeDetails ?? prop.type)
            let html = highlighted.get(type)
            if (!html) {
              html = renderDocsCodeHtml({ code: type, language: 'ts' })
              highlighted.set(type, html)
            }
            return { ...prop, typeHtml: await html }
          }),
        ),
      })),
    ),
  }
}
