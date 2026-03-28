import type { DocsHighlightLang } from '../core/shiki'

export type MarkdownHighlightLang = DocsHighlightLang

export interface MarkdownSegment {
  type: 'markdown'
  text: string
}

export interface ExampleDirectiveSegment {
  type: 'example'
  source: string
  name: string
}

export interface WidgetDirectiveSegment {
  type: 'widget'
  widgetName: string
  props?: Record<string, unknown>
}

export interface CodeTabsDirectiveSegment {
  type: 'code-tabs'
  packageName: string
}

export type ParsedSegment =
  | MarkdownSegment
  | ExampleDirectiveSegment
  | WidgetDirectiveSegment
  | CodeTabsDirectiveSegment

export interface FrontmatterData {}

export interface ParsedFrontmatter {
  data: FrontmatterData
  content: string
}

export interface CompileMarkdownOptions {
  projectRoot?: string
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null
}
