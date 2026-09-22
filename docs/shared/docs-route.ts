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
  ['form', 1],
  ['general', 2],
  ['navigation', 3],
  ['overlay', 4],
])
