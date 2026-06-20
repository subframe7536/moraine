import { createSignal, onCleanup, onMount } from 'solid-js'

import { resolvePageKeyFromLocation, toPagePath } from './routing'

export function useRouting(pageKeys: string[], fallbackPage?: string) {
  const initialPage = resolvePageKeyFromLocation(location, pageKeys) ?? fallbackPage ?? ''

  const [page, setPage] = createSignal(initialPage)
  const [navigationPending, setNavigationPending] = createSignal(false)
  const [navigationProgress, setNavigationProgress] = createSignal(0)
  let navigationId = 0
  let progressTimers: number[] = []

  const clearProgressTimers = () => {
    for (const timer of progressTimers) {
      window.clearTimeout(timer)
    }
    progressTimers = []
  }

  const startProgress = () => {
    clearProgressTimers()
    setNavigationPending(true)
    setNavigationProgress(14)
    progressTimers = [
      window.setTimeout(() => setNavigationProgress(42), 80),
      window.setTimeout(() => setNavigationProgress(68), 180),
      window.setTimeout(() => setNavigationProgress(84), 320),
    ]
  }

  const finishProgress = (id: number) => {
    if (id !== navigationId) {
      return
    }

    clearProgressTimers()
    setNavigationProgress(100)
    progressTimers = [
      window.setTimeout(() => {
        setNavigationPending(false)
        setNavigationProgress(0)
      }, 180),
    ]
  }

  const runNavigation = (commit: () => void) => {
    const currentNavigationId = navigationId + 1
    navigationId = currentNavigationId
    startProgress()
    commit()
    window.setTimeout(() => finishProgress(currentNavigationId), 220)
  }

  const syncPageFromLocation = (showProgress = false) => {
    const nextPage = resolvePageKeyFromLocation(location, pageKeys)
    if (!nextPage) {
      return
    }

    const expectedPath = toPagePath(nextPage)
    const pageChanged = nextPage !== page()
    const pathChanged = location.pathname !== expectedPath

    if (!pageChanged && !pathChanged) {
      return
    }

    const commit = () => {
      setPage(nextPage)
      if (pathChanged) {
        history.replaceState(null, '', expectedPath)
      }
    }

    if (showProgress && pageChanged) {
      runNavigation(commit)
      return
    }

    commit()
  }

  onMount(() => {
    syncPageFromLocation()

    const handlePopstate = () => {
      syncPageFromLocation(true)
    }

    window.addEventListener('popstate', handlePopstate)
    onCleanup(() => {
      window.removeEventListener('popstate', handlePopstate)
      clearProgressTimers()
    })
  })

  const navigate = (key: string) => {
    const nextPath = toPagePath(key)
    if (key === page() && location.pathname === nextPath) {
      return
    }

    runNavigation(() => {
      setPage(key)
      history.pushState(null, '', nextPath)
    })
  }

  return { page, navigate, navigationPending, navigationProgress }
}
