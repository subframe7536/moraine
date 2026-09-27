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
  ['docs:guides', 1],
  ['docs:styling', 2],
  ['docs:utils', 3],
  ['components:overview', 4],
  ['components:general', 5],
  ['components:form', 6],
  ['components:navigation', 7],
  ['components:overlay', 8],
])
