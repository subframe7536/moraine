import YAML from 'yaml'

import type { FrontmatterData, ParsedFrontmatter } from './types'

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/

export function parseFrontmatter(source: string, id: string): ParsedFrontmatter {
  const match = source.match(FRONTMATTER_RE)
  if (!match) {
    return {
      data: {},
      content: source,
    }
  }

  const raw = match[1] ?? ''
  let parsed: unknown

  try {
    parsed = YAML.parse(raw)
  } catch (error) {
    throw new Error(`[example-markdown] invalid frontmatter in ${id}: ${String(error)}`)
  }

  if (parsed && (typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error(`[example-markdown] frontmatter must be an object in ${id}`)
  }

  return {
    data: (parsed ?? {}) as FrontmatterData,
    content: source.slice(match[0].length),
  }
}
