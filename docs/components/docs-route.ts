import { routeInfo } from 'virtual:routes'

export type DocsPageStatus = 'new' | 'update' | 'unreleased'

export interface DocsRouteInfo {
  key: string
  title: string
  group?: string
  status?: DocsPageStatus
  api?: string
}

export interface DocsPageEntry {
  key: string
  label: string
  group?: string
  status?: DocsPageStatus
  path: string
}

const ROOT_PAGE_KEY = 'introduction'

function isDocsRouteInfo(value: unknown): value is DocsRouteInfo {
  if (!value || typeof value !== 'object') {
    return false
  }

  const route = value as Partial<DocsRouteInfo>
  return typeof route.key === 'string' && typeof route.title === 'string'
}

export function getDocsPages(): DocsPageEntry[] {
  return Object.entries(routeInfo)
    .map(([path, info]) => {
      if (!isDocsRouteInfo(info)) {
        return null
      }

      return {
        key: info.key,
        label: info.title,
        ...(info.group ? { group: info.group } : {}),
        ...(info.status ? { status: info.status } : {}),
        path: info.key === ROOT_PAGE_KEY ? '/' : path,
      }
    })
    .filter((page): page is DocsPageEntry => Boolean(page))
    .sort((left, right) => {
      if (left.key === ROOT_PAGE_KEY) {
        return -1
      }
      if (right.key === ROOT_PAGE_KEY) {
        return 1
      }
      if (!left.group && right.group) {
        return -1
      }
      if (left.group && !right.group) {
        return 1
      }
      return left.path.localeCompare(right.path)
    })
}
