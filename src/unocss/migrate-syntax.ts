import type { SourceCodeTransformer } from 'unocss'

import { runTransform } from './shared'

const TSX_SUFFIX = '.tsx'
const CLASS_TS_SUFFIX = '.class.ts'
const BORDER_SIDE_MAP = {
  t: 't',
  r: 'r',
  b: 'b',
  l: 'l',
  x: 'x',
  y: 'y',
} as const

function isClassFile(id: string): boolean {
  return id.endsWith(CLASS_TS_SUFFIX)
}

function isTsxFile(id: string): boolean {
  return id.endsWith(TSX_SUFFIX)
}

function splitTokenByTopLevelColon(token: string): string[] {
  const parts: string[] = []
  let bracketDepth = 0
  let parenDepth = 0
  let braceDepth = 0
  let start = 0

  for (let index = 0; index < token.length; index += 1) {
    const char = token[index]
    if (char === '\\') {
      index += 1
      continue
    }

    if (char === '[') {
      bracketDepth += 1
      continue
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1)
      continue
    }
    if (char === '(') {
      parenDepth += 1
      continue
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1)
      continue
    }
    if (char === '{') {
      braceDepth += 1
      continue
    }
    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      continue
    }

    if (char === ':' && bracketDepth === 0 && parenDepth === 0 && braceDepth === 0) {
      parts.push(token.slice(start, index))
      start = index + 1
    }
  }

  parts.push(token.slice(start))
  return parts
}

function normalizeBorderUtility(utility: string): string {
  if (utility === 'b') {
    return 'border'
  }
  if (utility === 'b-transparent') {
    return 'border-transparent'
  }
  if (utility === 'b-border') {
    return 'border-border'
  }

  const simpleSideMatch = utility.match(/^b-([trblxy])$/)
  if (simpleSideMatch) {
    return `border-${BORDER_SIDE_MAP[simpleSideMatch[1] as keyof typeof BORDER_SIDE_MAP]}`
  }

  const sideMatch = utility.match(/^b-([trblxy])-(.+)$/)
  if (sideMatch) {
    const side = BORDER_SIDE_MAP[sideMatch[1] as keyof typeof BORDER_SIDE_MAP]
    const tail = sideMatch[2]
    if (tail === '1') {
      return `border-${side}`
    }
    return `border-${side}-${tail}`
  }

  const borderMatch = utility.match(/^b-(.+)$/)
  if (!borderMatch) {
    return utility
  }

  const tail = borderMatch[1]
  if (tail === '1') {
    return 'border'
  }
  return `border-${tail}`
}

function normalizeUtility(utility: string): string {
  if (utility === 'font-500') {
    return 'font-medium'
  }
  if (utility === 'content-empty') {
    return "content-['']"
  }
  const cssVarValueMatch = utility.match(/^(.+)-\$([a-z0-9-]+)$/i)
  if (cssVarValueMatch) {
    return `${cssVarValueMatch[1]}-[var(--${cssVarValueMatch[2]})]`
  }

  if (utility.startsWith('b-') || utility === 'b') {
    return normalizeBorderUtility(utility)
  }

  return utility
}

function normalizeVariant(variant: string): string {
  if (variant === 'supports-backdrop-filter') {
    return 'supports-[backdrop-filter]'
  }
  if (variant === 'not-dark') {
    return '[html:not(.dark)_&]'
  }
  if (variant === 'not-last') {
    return '[&:not(:last-child)]'
  }

  return variant
}

function normalizeToken(token: string): string {
  const parts = splitTokenByTopLevelColon(token)
  if (parts.length === 1) {
    return normalizeUtility(token)
  }

  const utility = normalizeUtility(parts.pop() ?? '')
  const variants = parts.map(normalizeVariant)
  const utilityTokens = utility.match(/\S+/g) ?? [utility]
  return utilityTokens.map((utilityToken) => [...variants, utilityToken].join(':')).join(' ')
}

export function normalizeClassList(value: string): string {
  const tokens = value.match(/\S+/g)

  if (!tokens) {
    return value
  }

  return tokens.map((token) => normalizeToken(token)).join(' ')
}

export function createMigrateSyntaxTransformer(): SourceCodeTransformer {
  return {
    name: 'transformer-migrate-syntax',
    enforce: 'pre',
    idFilter: (id) => isClassFile(id) || isTsxFile(id),
    transform(code, id) {
      runTransform(code, id, (start, end, text, source) => {
        const normalizedValue = normalizeClassList(text)
        const quoteChar = source[start - 1]
        const nextValue = normalizedValue
          .replace(/\\/g, '\\\\')
          .replaceAll(quoteChar, `\\${quoteChar}`)
          .replace(/\$\{/g, '\\${')
        const originalSlice = source.slice(start, end)

        if (nextValue === originalSlice) {
          return null
        }

        return { start, end, value: nextValue }
      })
    },
  }
}
