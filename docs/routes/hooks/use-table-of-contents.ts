import { createSignal, onCleanup, onMount } from 'solid-js'
import type { Accessor } from 'solid-js'

export interface OnThisPageEntry {
  id: string
  label: string
  level: number
}

function decodeHashAnchor(hash: string): string {
  const anchor = hash.startsWith('#') ? hash.slice(1) : hash

  try {
    return decodeURIComponent(anchor)
  } catch {
    return ''
  }
}

export function useTableOfContents(
  getEntries: Accessor<OnThisPageEntry[]>,
  getHash: Accessor<string>,
  getScrollRoot: () => HTMLElement | undefined,
) {
  const [activeIds, setActiveIds] = createSignal<string[]>([])
  const [initialHash, setInitialHash] = createSignal('')
  const [entryIds, setEntryIds] = createSignal<Set<string>>(new Set())

  const setActiveIdsIfChanged = (nextIds: string[]) => {
    setActiveIds((currentIds) =>
      currentIds.length === nextIds.length &&
      currentIds.every((currentId, index) => currentId === nextIds[index])
        ? currentIds
        : nextIds,
    )
  }

  onMount(() => {
    setInitialHash(getHash())
    const entries = getEntries()
    const observedEntryIds = new Set(entries.map((entry) => entry.id))
    setEntryIds(observedEntryIds)
    const visibleIds = new Set<string>()

    const syncVisibleIds = () => {
      setActiveIdsIfChanged(
        entries.filter((entry) => visibleIds.has(entry.id)).map((entry) => entry.id),
      )
    }

    const observer =
      typeof IntersectionObserver === 'function' && entries.length > 0
        ? new IntersectionObserver(
            (intersectingEntries) => {
              for (const entry of intersectingEntries) {
                const id = (entry.target as HTMLElement)?.id ?? ''
                if (!observedEntryIds.has(id)) {
                  continue
                }
                if (entry.isIntersecting) {
                  visibleIds.add(id)
                } else {
                  visibleIds.delete(id)
                }
              }
              syncVisibleIds()
            },
            {
              root: getScrollRoot() ?? null,
              rootMargin: '-52px 0px 0px 0px',
              threshold: 0,
            },
          )
        : null

    if (observer) {
      for (const entry of entries) {
        const target = document.getElementById(entry.id)
        if (target) {
          observer.observe(target)
        }
      }
    }

    onCleanup(() => {
      observer?.disconnect()
    })
  })

  return {
    activeIds,
    primaryActiveId: () => {
      const hash = decodeHashAnchor(getHash() || initialHash())
      return entryIds().has(hash) ? hash : (activeIds()[0] ?? '')
    },
  }
}
