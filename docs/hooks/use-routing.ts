import { createSignal, onCleanup, onMount } from 'solid-js'

import { resolvePageKeyFromLocation, toPagePath } from '../routing'

export function useRouting(pageKeys: string[], fallbackPage?: string) {
  const initialPage = resolvePageKeyFromLocation(location, pageKeys) ?? fallbackPage ?? ''

  const [page, setPage] = createSignal(initialPage)

  const syncPageFromLocation = () => {
    const nextPage = resolvePageKeyFromLocation(location, pageKeys)
    if (!nextPage) {
      return
    }

    setPage(nextPage)

    const expectedPath = toPagePath(nextPage)
    if (location.pathname !== expectedPath) {
      history.replaceState(null, '', expectedPath)
    }
  }

  onMount(() => {
    syncPageFromLocation()

    const handlePopstate = () => {
      syncPageFromLocation()
    }

    window.addEventListener('popstate', handlePopstate)
    onCleanup(() => {
      window.removeEventListener('popstate', handlePopstate)
    })
  })

  const navigate = (key: string) => {
    setPage(key)
    history.pushState(null, '', toPagePath(key))
  }

  return { page, navigate }
}
