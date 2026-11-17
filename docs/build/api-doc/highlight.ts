import { markdownToHtml } from 'satteri'

import { renderDocsCodeHtml } from '../core/shiki.ts'

import { formatExpandedPropType } from './presentation.ts'
import type { ComponentApi, PropApi } from './types.ts'

const MARKDOWN_CODE_OR_ANGLE = /(```[\s\S]*?```|`[^`\n]*`)|</g

/** Escape `<` outside code so JSDoc prose never becomes raw HTML. */
function escapeRawHtml(markdown: string): string {
  return markdown.replace(MARKDOWN_CODE_OR_ANGLE, (match, code?: string) => (code ? match : '&lt;'))
}

/** Render a JSDoc description as HTML. Inline code gets the docs inline-code class. */
export function renderDescriptionHtml(markdown: string): string {
  const { html } = markdownToHtml(escapeRawHtml(markdown))
  return html.replaceAll('<code>', '<code class="docs-inline-code">').trim()
}

/** Enrich page data without writing presentation HTML into the generated API JSON. */
export async function highlightApiTypes(api: ComponentApi): Promise<ComponentApi> {
  const highlighted = new Map<string, Promise<string>>()
  const highlight = (code: string, language: 'ts' | 'tsx') => {
    const key = `${language}:${code}`
    let html = highlighted.get(key)
    if (!html) {
      html = renderDocsCodeHtml({ code, language })
      highlighted.set(key, html)
    }
    return html
  }
  const enrichProp = async (prop: PropApi): Promise<PropApi> => ({
    ...prop,
    typeHtml: await highlight(formatExpandedPropType(prop), 'ts'),
    ...(prop.description ? { descriptionHtml: renderDescriptionHtml(prop.description) } : {}),
    ...(prop.examples
      ? { examplesHtml: await Promise.all(prop.examples.map((code) => highlight(code, 'tsx'))) }
      : {}),
  })
  return {
    ...api,
    parts: await Promise.all(
      api.parts.map(async (part) => ({
        ...part,
        props: await Promise.all(part.props.map(enrichProp)),
      })),
    ),
  }
}
