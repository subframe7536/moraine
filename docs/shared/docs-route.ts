export type DocsSurface = 'docs' | 'components' | 'hooks'

export interface DocsRouteInfo {
  key: string
  title: string
  description: string
  order: number
  tags: Array<string>
  surface: DocsSurface
  section: string
  routePath: string
  markdownPath: string
  badge?: string
  api?: string
  sections?: Array<DocsRouteSection>
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
    'components:overview',
    'components:buttons',
    'components:display',
    'components:form',
    'components:select',
    'components:layout',
    'components:overlay',
    'components:navigation',
    'hooks:overview',
    'hooks:hooks',
  ].map((t, i) => [t, i]),
)

declare module 'solid-file-router' {
  interface RouteInfo extends DocsRouteInfo {}
}
