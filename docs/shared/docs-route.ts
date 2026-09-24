export interface DocsRouteInfo {
  key: string
  title: string
  description: string
  order: number
  tags: string[]
  group?: string
  badge?: string
  api?: string
  sections?: DocsRouteSection[]
}

export interface DocsRouteSection {
  id: string
  label: string
  level: number
}

export const DOCS_GROUP_ORDER = new Map<string, number>([
  ['', 0],
  ['styling', 1],
  ['form', 2],
  ['general', 3],
  ['navigation', 4],
  ['overlay', 5],
])
