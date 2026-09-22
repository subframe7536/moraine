import { routeInfo } from 'virtual:routes'

import { DOCS_GROUP_ORDER } from '../shared/docs-route.ts'
import type { DocsRouteInfo, DocsRouteSection } from '../shared/docs-route.ts'

export interface DocsPageEntry {
  key: string
  label: string
  description: string
  order: number
  tags: string[]
  group?: string
  badge?: string
  path: string
  sections: DocsRouteSection[]
}

function isDocsRouteInfo(value: unknown): value is DocsRouteInfo {
  if (!value || typeof value !== 'object') {
    return false
  }

  const route = value as Partial<DocsRouteInfo>
  return (
    typeof route.key === 'string' &&
    typeof route.title === 'string' &&
    typeof route.description === 'string' &&
    typeof route.order === 'number' &&
    Array.isArray(route.tags)
  )
}

function normalizeSections(value: unknown): DocsRouteSection[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((section): section is DocsRouteSection => {
    if (!section || typeof section !== 'object') {
      return false
    }

    const candidate = section as Partial<DocsRouteSection>
    const level = candidate.level
    return (
      typeof candidate.id === 'string' &&
      candidate.id.length > 0 &&
      typeof candidate.label === 'string' &&
      candidate.label.length > 0 &&
      typeof level === 'number' &&
      Number.isInteger(level) &&
      level >= 1 &&
      level <= 6
    )
  })
}

export function getDocsPages(): DocsPageEntry[] {
  return Object.entries(routeInfo)
    .map(([path, info]) => {
      if (!isDocsRouteInfo(info)) {
        return null
      }

      const page: DocsPageEntry = {
        key: info.key,
        label: info.title,
        description: info.description,
        order: info.order,
        tags: info.tags,
        path,
        sections: normalizeSections(info.sections),
      }
      if (info.group) {
        page.group = info.group
      }
      if (info.badge) {
        page.badge = info.badge
      }
      return page
    })
    .filter((page): page is DocsPageEntry => Boolean(page))
    .sort((left, right) => {
      const leftGroup = left.group ?? ''
      const rightGroup = right.group ?? ''
      const groupDifference =
        (DOCS_GROUP_ORDER.get(leftGroup) ?? Number.MAX_SAFE_INTEGER) -
        (DOCS_GROUP_ORDER.get(rightGroup) ?? Number.MAX_SAFE_INTEGER)
      if (groupDifference !== 0) {
        return groupDifference
      }
      if (leftGroup !== rightGroup) {
        return leftGroup.localeCompare(rightGroup)
      }
      return left.order - right.order
    })
}
