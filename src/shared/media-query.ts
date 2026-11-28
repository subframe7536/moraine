import { createEffect, createSignal, onFlush } from 'solid-js'
import type { Accessor } from 'solid-js'

import { attachEventListener } from './event-listener'

export function createMediaQuery(
  query: string | Accessor<string>,
  defaultValue = false,
): Accessor<boolean> {
  const [matches, setMatches] = createSignal(defaultValue)
  const queryAccessor = typeof query === 'function' ? query : () => query

  createEffect(queryAccessor, (currentQuery) => {
    const resolvedQuery = currentQuery.replace(/^@media( ?)/m, '')

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia(resolvedQuery)
    let active = true
    onFlush(() => {
      if (active) {
        setMatches(media.matches)
      }
    })

    const detach = attachEventListener(media, 'change', (event) => {
      setMatches(event.matches)
    })

    return () => {
      active = false
      detach()
    }
  })

  return matches
}
