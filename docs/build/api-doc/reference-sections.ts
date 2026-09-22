import { getApiReferenceTocEntries as getEntries } from './presentation.ts'
import type { ComponentApi } from './types.ts'

export interface ApiReferenceTocEntry {
  id: string
  label: string
  level: number
}

/**
 * Defines the generated API headings shared by the rendered reference and route metadata.
 * Uses the shared presentation model.
 */
export function getApiReferenceTocEntries(
  apiDoc: ComponentApi | undefined,
): ApiReferenceTocEntry[] {
  return getEntries(apiDoc)
}
