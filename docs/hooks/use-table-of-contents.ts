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
  const [activeId, setActiveId] = createSignal('')

  const scrollToAnchor = () => {
    const hash = decodeHashAnchor(location.hash.slice(1))
    if (!hash) {
      return true
    }

    const target = document.getElementById(hash)
    if (!target) {
      return false
    }
    target.scrollIntoView?.()
    return true
  }

  const syncActiveIdWithHash = () => {
    const hash = decodeHashAnchor(location.hash.slice(1))
    if (!hash) {
      const entries = getEntries()
      setActiveId(entries[0]?.id ?? '')
      return
    }

    setActiveId(hash)
  }

  onMount(() => {
    syncActiveIdWithHash()
    scrollToAnchor()

    const scrollRoot = document.querySelector<HTMLElement>('[data-docs-scroll-root="true"]')
    const entries = getEntries()
    const observer =
      typeof IntersectionObserver === 'function' && entries.length > 0
        ? new IntersectionObserver(
            (intersectingEntries) => {
              const visibleEntry = intersectingEntries
                .filter((entry) => entry.isIntersecting)
                .sort(
                  (left, right) => left.boundingClientRect.top - right.boundingClientRect.top,
                )[0]
              if (!visibleEntry?.target.id) {
                return
              }
              setActiveId(visibleEntry.target.id)
            },
            {
              root: scrollRoot,
              rootMargin: '0px',
              threshold: 0.98,
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
      syncActiveIdWithHash()
    }

    window.addEventListener('hashchange', handleHashChange)
    onCleanup(() => {
      window.removeEventListener('hashchange', handleHashChange)
      observer?.disconnect()
    })
  })

  return { activeId }
}
