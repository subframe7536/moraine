import type { DocsPageEntry } from '../../docs-route.ts'

export interface AdjacentDocsPages {
  previous?: DocsPageEntry
  next?: DocsPageEntry
}

export function getAdjacentDocsPages(
  pages: DocsPageEntry[],
  currentPageKey: string,
): AdjacentDocsPages {
  const currentIndex = pages.findIndex((page) => page.key === currentPageKey)
  if (currentIndex < 0) {
    return {}
  }

  return {
    ...(currentIndex > 0 ? { previous: pages[currentIndex - 1] } : {}),
    ...(currentIndex < pages.length - 1 ? { next: pages[currentIndex + 1] } : {}),
  }
}
