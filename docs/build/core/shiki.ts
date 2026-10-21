import { transformerStyleToClass } from '@shikijs/transformers'
import type { Highlighter, ShikiTransformer } from 'shiki'
import { createHighlighter } from 'shiki'

const GLOBAL_SHIKI_KEY = Symbol.for('moraine.docs.shikiStyleToClass')
const GLOBAL_ON_CLASS_CHANGE_KEY = Symbol.for('moraine.docs.shikiOnClassChange')

type OnClassCallback = (() => void) | undefined

function getGlobalOnClassChange(): OnClassCallback {
  return (globalThis as any)[GLOBAL_ON_CLASS_CHANGE_KEY]
}

function setGlobalOnClassChange(cb: OnClassCallback) {
  ;(globalThis as any)[GLOBAL_ON_CLASS_CHANGE_KEY] = cb
}

export function onDocsShikiClass(cb: () => void): () => void {
  setGlobalOnClassChange(cb)
  return () => {
    if (getGlobalOnClassChange() === cb) {
      setGlobalOnClassChange(undefined)
    }
  }
}

export const docsShikiStyleToClass = ((globalThis as any)[GLOBAL_SHIKI_KEY] ??=
  transformerStyleToClass({
    classPrefix: '__shiki_',
    classReplacer(className) {
      if (!docsShikiStyleToClass?.getClassRegistry().has(className)) {
        getGlobalOnClassChange()?.()
      }
      return className
    },
  }))

export function getDocsShikiCss(): string {
  return docsShikiStyleToClass.getCSS()
}

const DOCS_HIGHLIGHT_THEMES = {
  light: 'one-light',
  dark: 'one-dark-pro',
} as const

const COMMON_LANGUAGES = [
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

let highlighterPromise: Promise<Highlighter> | null = null

async function getDocsHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [DOCS_HIGHLIGHT_THEMES.light, DOCS_HIGHLIGHT_THEMES.dark],
      langs: [...COMMON_LANGUAGES],
    })
  }
  return highlighterPromise
}

export interface CodeBlockMeta {
  title?: string
  groupId?: string
  highlightedLines: number[]
  lineNumbers: boolean
}

export function parseHighlightedLines(
  meta?: string,
  explicit?: number[] | string | Set<number>,
): Set<number> {
  const result = new Set<number>()

  const lines = explicit || meta?.match(/\{([0-9,\s-]+)\}/)?.[1]
  if (lines instanceof Set) {
    return lines
  }
  if (Array.isArray(lines)) {
    for (const line of lines) {
      if (Number.isFinite(line)) {
        result.add(line)
      }
    }
    return result
  }

  for (const part of (lines ?? '').replace(/[{}]/g, '').split(',')) {
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

export function parseCodeGroupId(meta?: string): string | undefined {
  if (!meta) {
    return undefined
  }
  const match = meta.match(/(?:group-id|groupId|group)=(?:"([^"]+)"|'([^']+)'|([^\s{}]+))/)
  return match?.[1] ?? match?.[2] ?? match?.[3]
}

export function parseCodeBlockMeta(
  meta?: string,
  overrides?: {
    highlightedLines?: number[] | string | Set<number>
    lineNumbers?: boolean
  },
): CodeBlockMeta {
  const title = parseCodeTitle(meta)
  const groupId = parseCodeGroupId(meta)
  const highlightedLines = Array.from(
    parseHighlightedLines(meta, overrides?.highlightedLines),
  ).sort((a, b) => a - b)
  const lineNumbers = overrides?.lineNumbers ?? (meta ? /\bshowLineNumbers\b/.test(meta) : false)

  return {
    title,
    groupId,
    highlightedLines,
    lineNumbers,
  }
}

export function normalizeHighlightLanguage(lang?: string): string {
  const trimmed = lang?.trim().toLowerCase()
  if (!trimmed) {
    return 'text'
  }

  switch (trimmed) {
    case 'pnpm':
    case 'npm':
    case 'yarn':
    case 'bun':
    case 'shell':
    case 'sh':
    case 'terminal':
    case 'console':
    case 'zsh':
      return 'bash'
    case 'jsonc':
      return 'json'
    case 'md':
      return 'markdown'
    case 'js':
      return 'javascript'
    case 'ts':
      return 'typescript'
    default:
      return trimmed
  }
}

export interface HighlightCodeBlockOptions {
  code: string
  language?: string
  meta?: string
  title?: string
  groupId?: string
  highlightedLines?: number[] | string | Set<number>
  lineNumbers?: boolean
}

export interface HighlightedCodeResult {
  html: string
  code: string
  lang: string
  title?: string
  groupId?: string
  highlightedLines: number[]
  lineNumbers: boolean
}

export async function highlightCodeBlock(
  options: HighlightCodeBlockOptions,
): Promise<HighlightedCodeResult> {
  const highlighter = await getDocsHighlighter()
  const rawLang = options.language?.trim().toLowerCase() || ''
  let lang = normalizeHighlightLanguage(rawLang)

  const loadedLangs = highlighter.getLoadedLanguages()
  if (!loadedLangs.includes(lang)) {
    try {
      await highlighter.loadLanguage(lang as any)
    } catch {
      lang = 'text'
    }
  }

  const meta = parseCodeBlockMeta(options.meta, {
    highlightedLines: options.highlightedLines,
    lineNumbers: options.lineNumbers,
  })

  const title = options.title ?? meta.title
  const groupId = options.groupId ?? meta.groupId
  const highlightedLines = meta.highlightedLines
  const lineNumbers = options.lineNumbers ?? meta.lineNumbers
  const highlightedSet = new Set(highlightedLines)

  const transformers: ShikiTransformer[] = []

  if (highlightedSet.size > 0) {
    transformers.push({
      name: 'moraine:highlighted-lines',
      line(node, line) {
        if (highlightedSet.has(line)) {
          this.addClassToHast(node, 'highlighted')
        }
      },
    })
  }

  if (lineNumbers) {
    transformers.push({
      name: 'moraine:line-numbers',
      pre(node) {
        this.addClassToHast(node, 'line-numbers')
      },
    })
  }

  transformers.push({
    name: 'moraine:no-tabindex',
    pre(node) {
      node.properties.tabindex = -1
    },
  })

  transformers.push(docsShikiStyleToClass)

  const html = highlighter.codeToHtml(options.code, {
    lang,
    themes: {
      light: DOCS_HIGHLIGHT_THEMES.light,
      dark: DOCS_HIGHLIGHT_THEMES.dark,
    },
    defaultColor: false,
    transformers,
  })

  return {
    html,
    code: options.code,
    lang,
    title,
    groupId,
    highlightedLines,
    lineNumbers,
  }
}

export interface DocsCodeRenderOptions {
  code: string
  language: string
  meta?: string
  highlightedLines?: number[] | string | Set<number>
  lineNumbers?: boolean
}

export async function renderDocsCodeHtml(options: DocsCodeRenderOptions): Promise<string> {
  const result = await highlightCodeBlock(options)
  return result.html
}
