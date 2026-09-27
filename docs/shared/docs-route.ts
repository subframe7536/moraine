export type DocsSurface = 'docs' | 'components'

export interface DocsRouteInfo {
  key: string
  title: string
  description: string
  order: number
  tags: string[]
  surface: DocsSurface
  section: string
  routePath: string
  markdownPath: string
  badge?: string
  api?: string
  sections?: DocsRouteSection[]
}

export interface DocsRouteSection {
  id: string
  label: string
  level: number
}

export const DOCS_SECTION_ORDER = new Map<string, number>([
  ['docs:overview', 0],
  ['docs:styling', 1],
  ['docs:composition', 2],
  ['docs:reference', 3],
  ['components:overview', 4],
  ['components:general', 5],
  ['components:form', 6],
  ['components:navigation', 7],
  ['components:overlay', 8],
])
