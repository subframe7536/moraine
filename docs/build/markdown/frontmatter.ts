import YAML from 'yaml'

import type { FrontmatterData } from './types'

type FrontmatterRecord = Record<string, unknown>

function getFrontmatterBlock(source: string): string | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)
  return match?.[1] ?? null
}

export function parseFrontmatterData(raw: string | null | undefined, id: string): FrontmatterData {
  if (!raw?.trim()) {
    throw new Error(`[docs-mdx] invalid frontmatter in ${id}: frontmatter is required`)
  }

  let parsed: unknown
  try {
    parsed = YAML.parse(raw)
  } catch (error) {
    throw new Error(`[docs-mdx] invalid frontmatter in ${id}: ${String(error)}`)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`[docs-mdx] frontmatter must be an object in ${id}`)
  }

  return validateFrontmatterData(parsed, id)
}

export function validateFrontmatterData(value: unknown, id: string): FrontmatterData {
  const fail = (field: string, message: string): never => {
    throw new Error(`[docs-mdx] invalid frontmatter in ${id}: ${field} ${message}`)
  }

  const readString = (record: FrontmatterRecord, field: string): string => {
    const value = record[field]
    if (typeof value !== 'string' || value.trim() === '') {
      return fail(field, 'must be a non-empty string')
    }
    return value.trim()
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`[docs-mdx] frontmatter must be an object in ${id}`)
  }

  const data = value as FrontmatterRecord
  const sidebarValue = data.sidebar
  if (!sidebarValue || typeof sidebarValue !== 'object' || Array.isArray(sidebarValue)) {
    return fail('sidebar', 'must be an object')
  }
  const sidebar = sidebarValue as FrontmatterRecord
  if (!Number.isInteger(sidebar.order) || (sidebar.order as number) < 0) {
    return fail('sidebar.order', 'must be a non-negative integer')
  }
  if (
    sidebar.badge !== undefined &&
    (typeof sidebar.badge !== 'string' || sidebar.badge.trim() === '')
  ) {
    return fail('sidebar.badge', 'must be a non-empty string when provided')
  }

  const searchValue = data.search
  if (!searchValue || typeof searchValue !== 'object' || Array.isArray(searchValue)) {
    return fail('search', 'must be an object')
  }
  const search = searchValue as FrontmatterRecord
  if (!Array.isArray(search.tags) || search.tags.length === 0) {
    return fail('search.tags', 'must be a non-empty string array')
  }
  const tags = search.tags.map((tag, index) => {
    if (typeof tag !== 'string' || tag.trim() === '') {
      return fail(`search.tags[${index}]`, 'must be a non-empty string')
    }
    return tag.trim()
  })

  return {
    ...data,
    title: readString(data, 'title'),
    description: readString(data, 'description'),
    sidebar: {
      order: sidebar.order as number,
      ...(typeof sidebar.badge === 'string' ? { badge: sidebar.badge.trim() } : {}),
    },
    search: { tags },
  } as FrontmatterData
}

export function readFrontmatterData(source: string, id: string): FrontmatterData {
  return parseFrontmatterData(getFrontmatterBlock(source), id)
}
