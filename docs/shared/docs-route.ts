export type DocsSurface = 'docs' | 'components' | 'hooks'

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

export const DOCS_SECTION_ORDER = new Map<string, number>(
  [
    'docs:overview',
    'docs:guides',
    'docs:styling',
    'docs:utils',
    'components:overview',
    'components:layout',
    'components:display',
    'components:buttons',
    'components:form',
    'components:select',
    'components:overlay',
    'components:navigation',
    'hooks:overview',
    'hooks:hooks',
  ].map((t, i) => [t, i]),
)
