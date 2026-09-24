import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js'

import { decodeHashAnchor } from './use-table-of-contents'

export interface HashScrollingOptions {
  element: Accessor<HTMLElement | undefined>
  path: Accessor<string>
  hash: Accessor<string>
  ready: Accessor<boolean>
}

/** Route and history hash scrolling belongs to the docs shell's scroll frame. */
export function useHashScrolling(options: HashScrollingOptions) {
  const [historyHash, setHistoryHash] = createSignal(
    typeof window === 'undefined' ? '' : window.location.hash,
  )

  onMount(() => {
    const handleHashChange = () => setHistoryHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    onCleanup(() => window.removeEventListener('hashchange', handleHashChange))
  })

  createEffect(
    on(
      [options.element, options.path, options.hash, historyHash, options.ready],
      ([root, , hash, , ready]) => {
        if (!root || !ready) {
          return
        }
        const id = decodeHashAnchor(hash || window.location.hash)
        if (!id) {
          return
        }

        let observer: MutationObserver | undefined
        const scroll = () => {
          const target = root.ownerDocument.getElementById(id)
          if (!target || !root.contains(target)) {
            return false
          }
          target.scrollIntoView({ block: 'start' })
          observer?.disconnect()
          observer = undefined
          return true
        }

        const frame = requestAnimationFrame(() => {
          if (scroll()) {
            return
          }
          // A routed page can commit after Suspense settles. Observe that commit,
          // instead of guessing its duration with a timer.
          observer = new MutationObserver(scroll)
          observer.observe(root, { childList: true, subtree: true })
        })
        onCleanup(() => {
          cancelAnimationFrame(frame)
          observer?.disconnect()
        })
      },
    ),
  )
}
