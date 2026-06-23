import type { DocsHighlightLang } from '../core/shiki'

export type MarkdownHighlightLang = DocsHighlightLang

export interface FrontmatterExampleRef {
  name: string
  file: string
}

export interface FrontmatterData {
  category?: string
  component?: string
  description?: string
  keywords?: string[]
  related?: string[]
  examples?: FrontmatterExampleRef[]
}

export interface CompileMarkdownOptions {
  projectRoot?: string
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null
}
