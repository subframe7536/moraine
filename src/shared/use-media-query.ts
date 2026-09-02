import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useEventListener } from './use-event-listener'

export function createMediaQuery(
  query: string | Accessor<string>,
  defaultValue = false,
): Accessor<boolean> {
  const [matches, setMatches] = createSignal(defaultValue)
  createEffect(() => {
    const resolvedQuery = (typeof query === 'function' ? query() : query).replace(
      /^@media( ?)/m,
      '',
    )

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

    if (typeof media.addEventListener === 'function') {
      useEventListener(media, 'change', onChange)
    } else {
      media.addListener(onChange)
      onCleanup(() => {
        media.removeListener(onChange)
      })
    }

    onCleanup(() => {
      active = false
    })
  })
  return matches
}
