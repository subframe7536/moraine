import type { DocsPageEntry } from '../../../docs-route'

export interface AdjacentDocsPages {
  previous?: DocsPageEntry
  next?: DocsPageEntry
}

export function getAdjacentDocsPages(
  pages: DocsPageEntry[],
  currentPageKey: string,
): AdjacentDocsPages {
  const currentIndex = pages.findIndex((page) => page.path === currentPageKey)
  if (currentIndex < 0) {
    return {}
  }

  const surface = pages[currentIndex]?.surface
  const previous = pages[currentIndex - 1]
  const next = pages[currentIndex + 1]
  return {
    ...(previous?.surface === surface ? { previous } : {}),
    ...(next?.surface === surface ? { next } : {}),
  }
}
