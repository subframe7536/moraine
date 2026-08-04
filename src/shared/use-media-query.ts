import { createSignal, onMount } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useEventListener } from './use-event-listener.ts'

export function createMediaQuery(query: string, defaultValue = false): Accessor<boolean> {
  const [matches, setMatches] = createSignal(defaultValue)
  onMount(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    useEventListener(media, 'change', (e) => setMatches(e.matches))
  })
  return matches
}
