export function parsePageKeyFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 1) {
    return null
  }
  return segments[0] ?? null
}

export function resolvePageKeyFromPathname(pathname: string, pageKeys: string[]): string | null {
  const pageKey = parsePageKeyFromPathname(pathname)
  if (pageKey && pageKeys.includes(pageKey)) {
    return pageKey
  }
  return pageKeys[0] ?? null
}

export function resolvePageKeyFromLocation(
  locationLike: Pick<Location, 'pathname' | 'hash'>,
  pageKeys: string[],
): string | null {
  return resolvePageKeyFromPathname(locationLike.pathname, pageKeys)
}

export function toPagePath(pageKey: string): string {
  return `/${pageKey}`
}
