export interface FrontmatterSidebar {
  order: number
  badge?: string
}

export interface FrontmatterSearch {
  tags: string[]
}

export interface FrontmatterData {
  title: string
  description: string
  sidebar: FrontmatterSidebar
  search: FrontmatterSearch
  category?: string
  component?: string
  componentKey?: string
  related?: string[]
  upstreamHref?: string
}

export interface DocsRouteMetadata {
  title: string
  description: string
  canonical: string
  meta: Array<{
    property?: string
    name?: string
    content: string
  }>
}
