import type { DocsHighlightLang } from '../core/shiki'

export type MarkdownHighlightLang = DocsHighlightLang

export interface FrontmatterData {
  category?: string
  component?: string
  componentKey?: string
  description?: string
  header?: boolean
  keywords?: string[]
  name?: string
  related?: string[]
  status?: 'new' | 'update' | 'unreleased'
  upstreamHref?: string
}

export interface CompileMarkdownOptions {
  projectRoot?: string
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null
}
