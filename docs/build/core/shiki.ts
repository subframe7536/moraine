import type { Highlighter, ShikiTransformer } from 'shiki'
import { createHighlighter } from 'shiki'

export const DOCS_HIGHLIGHT_THEMES = {
  light: 'one-light',
  dark: 'one-dark-pro',
} as const

export const COMMON_LANGUAGES = [
  'tsx',
  'typescript',
  'ts',
  'jsx',
  'javascript',
  'js',
  'bash',
  'sh',
  'shell',
  'zsh',
  'css',
  'json',
  'html',
  'text',
  'txt',
  'diff',
] as const

export type DocsHighlightLang = (typeof COMMON_LANGUAGES)[number] | (string & {})

let highlighterPromise: Promise<Highlighter> | null = null

export async function getDocsHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [DOCS_HIGHLIGHT_THEMES.light, DOCS_HIGHLIGHT_THEMES.dark],
      langs: [...COMMON_LANGUAGES],
    })
  }
  return highlighterPromise
}

export function parseHighlightedLines(
  meta?: string,
  explicit?: number[] | string | Set<number>,
): Set<number> {
  const result = new Set<number>()

  if (explicit) {
    if (explicit instanceof Set) {
      return explicit
    }
    if (Array.isArray(explicit)) {
      for (const line of explicit) {
        if (typeof line === 'number' && Number.isFinite(line)) {
          result.add(line)
        }
      }
      return result
    }
    if (typeof explicit === 'string') {
      for (const part of explicit.replace(/[{}]/g, '').split(',')) {
        const trimmed = part.trim()
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number)
          if (start && end && start <= end) {
            for (let i = start; i <= end; i++) {
              result.add(i)
            }
          }
        } else if (trimmed) {
          const num = Number(trimmed)
          if (Number.isFinite(num)) {
            result.add(num)
          }
        }
      }
      return result
    }
  }

  if (meta) {
    const match = meta.match(/\{([0-9,\s-]+)\}/)
    if (match?.[1]) {
      for (const part of match[1].split(',')) {
        const trimmed = part.trim()
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(Number)
          if (start && end && start <= end) {
            for (let i = start; i <= end; i++) {
              result.add(i)
            }
          }
        } else if (trimmed) {
          const num = Number(trimmed)
          if (Number.isFinite(num)) {
            result.add(num)
          }
        }
      }
    }
  }

  return result
}

export function parseCodeTitle(meta?: string): string | undefined {
  if (!meta) {
    return undefined
  }
  // Matches title="..." or title='...'
  const titleMatch = meta.match(/title=(?:"([^"]+)"|'([^']+)'|([^\s{}]+))/)
  if (titleMatch) {
    return titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]
  }

  // Matches filename="..." or filename='...'
  const filenameMatch = meta.match(/filename=(?:"([^"]+)"|'([^']+)'|([^\s{}]+))/)
  if (filenameMatch) {
    return filenameMatch[1] ?? filenameMatch[2] ?? filenameMatch[3]
  }

  // If first token does not contain = or { or }, treat it as filename/title
  const tokens = meta.split(/\s+/).filter(Boolean)
  for (const token of tokens) {
    if (!token.includes('=') && !token.startsWith('{') && !token.endsWith('}')) {
      return token
    }
  }

  return undefined
}

export interface DocsCodeRenderOptions {
  code: string
  language: string
  meta?: string
  title?: string
  highlightedLines?: number[] | string | Set<number>
  lineNumbers?: boolean
}

export async function renderDocsCodeHtml(options: DocsCodeRenderOptions): Promise<string> {
  const highlighter = await getDocsHighlighter()
  let lang = options.language?.trim().toLowerCase() || 'text'

  const loadedLangs = highlighter.getLoadedLanguages()
  if (!loadedLangs.includes(lang)) {
    try {
      await highlighter.loadLanguage(lang as any)
    } catch {
      lang = 'text'
    }
  }

  const highlightedLines = parseHighlightedLines(options.meta, options.highlightedLines)
  const showLineNumbers = options.lineNumbers ?? options.meta?.includes('showLineNumbers') ?? false

  const transformers: ShikiTransformer[] = []

  if (highlightedLines.size > 0) {
    transformers.push({
      name: 'moraine:highlighted-lines',
      line(node, line) {
        if (highlightedLines.has(line)) {
          this.addClassToHast(node, 'highlighted')
        }
      },
    })
  }

  if (showLineNumbers) {
    transformers.push({
      name: 'moraine:line-numbers',
      pre(node) {
        this.addClassToHast(node, 'line-numbers')
      },
    })
  }

  return highlighter.codeToHtml(options.code, {
    lang,
    themes: {
      light: DOCS_HIGHLIGHT_THEMES.light,
      dark: DOCS_HIGHLIGHT_THEMES.dark,
    },
    defaultColor: false,
    transformers,
  })
}
