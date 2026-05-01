import type { Accessor } from 'solid-js'
import { createEffect, createSignal, onCleanup } from 'solid-js'

export function createMediaQuery(query: string, initialValue = false): Accessor<boolean> {
  const [matches, setMatches] = createSignal(initialValue)

  createEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    onCleanup(() => mediaQuery.removeEventListener('change', update))
  })

  return matches
}
