import { createSignal } from 'solid-js'

const [pendingPageLoads, setPendingPageLoads] = createSignal(0)
const [pageLoadingFromPath, setPageLoadingFromPath] = createSignal<string>()
let navigationReady = false

export function markDocsNavigationReady(): void {
  navigationReady = true
}

export function isDocsPageLoading(): boolean {
  return pendingPageLoads() > 0
}

export function docsPageLoadingFromPath(): string | undefined {
  return pageLoadingFromPath()
}

export async function loadDocsPage<T>(loader: () => Promise<T>): Promise<T> {
  const shouldTrack = navigationReady
  if (shouldTrack) {
    if (pendingPageLoads() === 0) {
      setPageLoadingFromPath(window.location.pathname)
    }
    setPendingPageLoads((count) => count + 1)
  }

  try {
    return await loader()
  } finally {
    if (shouldTrack) {
      setPendingPageLoads((count) => {
        const nextCount = Math.max(count - 1, 0)
        if (nextCount === 0) {
          setPageLoadingFromPath(undefined)
        }
        return nextCount
      })
    }
  }
}
