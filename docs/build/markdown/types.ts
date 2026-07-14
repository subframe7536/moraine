import type { DocsHighlightLang } from '../core/shiki'

export type MarkdownHighlightLang = DocsHighlightLang

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

export interface CompileMarkdownOptions {
  projectRoot?: string
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null
}
