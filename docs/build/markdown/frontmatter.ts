import YAML from 'yaml'

import type { FrontmatterData } from './types.ts'

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

  let api: FrontmatterData['api']
  if (data.api !== undefined) {
    if (!data.api || typeof data.api !== 'object' || Array.isArray(data.api)) {
      return fail('api', 'must be an object')
    }
    const apiValue = data.api as FrontmatterRecord
    const apiPath = readString(apiValue, 'path')
    if (
      !/^src\/(?:elements|forms|navigation|overlays)\/[a-z0-9/-]+$/.test(apiPath) ||
      apiPath.includes('..') ||
      /\.[cm]?[jt]sx?$/.test(apiPath)
    ) {
      return fail(
        'api.path',
        'must be an extensionless component path under src/element, src/form, src/navigation, or src/overlay',
      )
    }

    let parts: NonNullable<FrontmatterData['api']>['parts']
    if (apiValue.parts !== undefined) {
      if (!Array.isArray(apiValue.parts)) {
        return fail('api.parts', 'must be an array when provided')
      }
      const seenParts = new Set<string>()
      parts = apiValue.parts.map((part, index) => {
        if (typeof part === 'string') {
          const name = part.trim()
          if (!name) {
            return fail(`api.parts[${index}]`, 'must be a non-empty string or object')
          }
          if (seenParts.has(name)) {
            return fail(`api.parts[${index}]`, `duplicates part "${name}"`)
          }
          seenParts.add(name)
          return name
        }
        if (!part || typeof part !== 'object' || Array.isArray(part)) {
          return fail(`api.parts[${index}]`, 'must be a non-empty string or object')
        }
        const partValue = part as FrontmatterRecord
        const name = readString(partValue, 'name')
        if (seenParts.has(name)) {
          return fail(`api.parts[${index}]`, `duplicates part "${name}"`)
        }
        seenParts.add(name)
        const partPath = readString(partValue, 'path')
        if (
          !/^src\/(?:elements|forms|navigation|overlays)\/[a-z0-9/-]+$/.test(partPath) ||
          partPath.includes('..') ||
          /\.[cm]?[jt]sx?$/.test(partPath)
        ) {
          return fail(`api.parts[${index}].path`, 'must be an extensionless component path')
        }
        return { name, path: partPath }
      })
    }
    api = { path: apiPath, ...(parts ? { parts } : {}) }
  }

  return {
    ...data,
    title: readString(data, 'title'),
    description: readString(data, 'description'),
    sidebar: {
      order: sidebar.order as number,
      ...(typeof sidebar.badge === 'string' ? { badge: sidebar.badge.trim() } : {}),
    },
    search: { tags },
    ...(api ? { api } : {}),
  }
}

export function readFrontmatterData(source: string, id: string): FrontmatterData {
  return parseFrontmatterData(getFrontmatterBlock(source), id)
}
