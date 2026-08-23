import { routeInfo } from 'virtual:routes'

export interface DocsRouteInfo {
  key: string
  title: string
  description: string
  order: number
  tags: string[]
  group?: string
  badge?: string
  api?: string
}

export interface DocsPageEntry {
  key: string
  label: string
  description: string
  order: number
  tags: string[]
  group?: string
  badge?: string
  path: string
}

const GROUP_ORDER = new Map<string, number>([
  ['', 0],
  ['form', 1],
  ['general', 2],
  ['navigation', 3],
  ['overlay', 4],
])

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
        (GROUP_ORDER.get(leftGroup) ?? Number.MAX_SAFE_INTEGER) -
        (GROUP_ORDER.get(rightGroup) ?? Number.MAX_SAFE_INTEGER)
      if (groupDifference !== 0) {
        return groupDifference
      }
      if (leftGroup !== rightGroup) {
        return leftGroup.localeCompare(rightGroup)
      }
      return left.order - right.order
    })
}
