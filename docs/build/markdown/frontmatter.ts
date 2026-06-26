import YAML from 'yaml'

import type { FrontmatterData } from './types'

function getFrontmatterBlock(source: string): string | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)
  return match?.[1] ?? null
}

export function parseFrontmatterData(raw: string | null | undefined, id: string): FrontmatterData {
  if (!raw?.trim()) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = YAML.parse(raw)
  } catch (error) {
    throw new Error(`[docs-mdx] invalid frontmatter in ${id}: ${String(error)}`)
  }

  if (parsed && (typeof parsed !== 'object' || Array.isArray(parsed))) {
    throw new Error(`[docs-mdx] frontmatter must be an object in ${id}`)
  }

  return (parsed ?? {}) as FrontmatterData
}

export function readFrontmatterData(source: string, id: string): FrontmatterData {
  return parseFrontmatterData(getFrontmatterBlock(source), id)
}
