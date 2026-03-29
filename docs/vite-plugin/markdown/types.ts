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

export interface DocsHeaderDirectiveSegment {
  type: 'docs-header'
  props?: Record<string, unknown>
}

export interface DocsApiReferenceDirectiveSegment {
  type: 'docs-api-reference'
  props?: Record<string, unknown>
}

export interface IntroCardsDirectiveSegment {
  type: 'intro-cards'
  props?: Record<string, unknown>
}

export interface IntroComponentsDirectiveSegment {
  type: 'intro-components'
  props?: Record<string, unknown>
}

export interface ToastHostsDirectiveSegment {
  type: 'toast-hosts'
  props?: Record<string, unknown>
}

export interface CodeTabsDirectiveSegment {
  type: 'code-tabs'
  packageName: string
}

export type ParsedSegment =
  | MarkdownSegment
  | ExampleDirectiveSegment
  | DocsHeaderDirectiveSegment
  | DocsApiReferenceDirectiveSegment
  | IntroCardsDirectiveSegment
  | IntroComponentsDirectiveSegment
  | ToastHostsDirectiveSegment
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
