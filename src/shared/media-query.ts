import { createEffect, createSignal } from 'solid-js'
import type { Accessor } from 'solid-js'

import { attachEventListener } from './event-listener'
export function createMediaQuery(
  query: string | Accessor<string>,
  defaultValue = false,
): Accessor<boolean> {
  const [matches, setMatches] = createSignal(defaultValue)
  const queryAccessor = typeof query === 'function' ? query : () => query
  createEffect(queryAccessor, (query) => {
    const resolvedQuery = query.replace(/^@media( ?)/m, '')

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia(resolvedQuery)
    let active = true

    queueMicrotask(() => {
      if (active) {
        setMatches(media.matches)
      }
    })

    const onChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches)
    }

    const detach =
      typeof media.addEventListener === 'function'
        ? attachEventListener(media, 'change', onChange)
        : (media.addListener(onChange), () => media.removeListener(onChange))

    return () => {
      active = false
      detach()
    }
  })
  return matches
}
