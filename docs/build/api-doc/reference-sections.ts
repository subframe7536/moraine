import type { ComponentDoc } from './types.ts'

export interface ApiReferenceTocEntry {
  id: string
  label: string
  level: number
}

/**
 * Defines the generated API headings shared by the rendered reference and route metadata.
 * MDX headings remain the responsibility of the Markdown plugin.
 */
export function getApiReferenceTocEntries(
  apiDoc: ComponentDoc | undefined,
): ApiReferenceTocEntry[] {
  if (!apiDoc) {
    return []
  }

  const sections: ApiReferenceTocEntry[] = []

  if (apiDoc.slots.length > 0) {
    sections.push({ id: 'attributes', label: 'Attributes', level: 2 })
  }
  if (apiDoc.props.own.length > 0) {
    sections.push({ id: 'api-props', label: 'Props', level: 2 })
  }
  if (apiDoc.item) {
    sections.push({ id: 'api-items', label: 'Items', level: 2 })
  }
  if (apiDoc.props.inherited.length > 0) {
    sections.push({ id: 'api-inherited', label: 'Inherited', level: 2 })
  }

  return sections.length > 0
    ? [{ id: 'api-reference', label: 'API Reference', level: 1 }, ...sections]
    : []
}
