import { createSignal, onCleanup, onMount } from 'solid-js'

export interface OnThisPageEntry {
  id: string
  label: string
  level: number
}

function decodeHashAnchor(hash: string): string {
  if (!hash) {
    return ''
  }
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

export function useTableOfContents(getEntries: () => OnThisPageEntry[]) {
  const [activeIds, setActiveIds] = createSignal<string[]>([])

  const setActiveIdsIfChanged = (nextIds: string[]) => {
    setActiveIds((currentIds) =>
      currentIds.length === nextIds.length &&
      currentIds.every((currentId, index) => currentId === nextIds[index])
        ? currentIds
        : nextIds,
    )
  }

  const scrollToAnchor = () => {
    const hash = decodeHashAnchor(location.hash.slice(1))
    if (!hash) {
      return true
    }

    const target = document.getElementById(hash)
    if (!target) {
      return false
    }

    target.scrollIntoView?.({ block: 'start' })
    return true
  }

  onMount(() => {
    const entries = getEntries()
    const entryIds = new Set(entries.map((entry) => entry.id))
    const visibleIds = new Set<string>()

    const syncVisibleIds = () => {
      setActiveIdsIfChanged(
        entries.filter((entry) => visibleIds.has(entry.id)).map((entry) => entry.id),
      )
    }

    const syncActiveIdsWithHash = () => {
      const hash = decodeHashAnchor(location.hash.slice(1))
      setActiveIdsIfChanged(
        hash && entryIds.has(hash) ? [hash] : entries.slice(0, 1).map((entry) => entry.id),
      )
    }

    syncActiveIdsWithHash()

    let initialAnchorFrame = 0
    if (location.hash) {
      initialAnchorFrame = requestAnimationFrame(() => {
        scrollToAnchor()
      })
    }

    const observer =
      typeof IntersectionObserver === 'function' && entries.length > 0
        ? new IntersectionObserver(
            (intersectingEntries) => {
              for (const entry of intersectingEntries) {
                const id = (entry.target as HTMLElement)?.id ?? ''
                if (!entryIds.has(id)) {
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
              root: null,
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

    const handleHashChange = () => {
      scrollToAnchor()
      syncActiveIdsWithHash()
    }

    window.addEventListener('hashchange', handleHashChange)
    onCleanup(() => {
      if (initialAnchorFrame) {
        cancelAnimationFrame(initialAnchorFrame)
      }
      window.removeEventListener('hashchange', handleHashChange)
      observer?.disconnect()
    })
  })

  return {
    activeIds,
    primaryActiveId: () => activeIds()[0] ?? '',
  }
}
