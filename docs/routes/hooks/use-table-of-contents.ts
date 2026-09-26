import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'

export const DOCS_HEADER_OFFSET = 24

export interface OnThisPageEntry {
  id: string
  label: string
  level: number
}

export function decodeHashAnchor(hash: string): string {
  try {
    return decodeURIComponent(hash.startsWith('#') ? hash.slice(1) : hash)
  } catch {
    return ''
  }
}

export function useTableOfContents(
  getEntries: Accessor<OnThisPageEntry[]>,
  getHash: Accessor<string>,
  getScrollRoot: Accessor<HTMLElement | undefined>,
) {
  const [activeIds, setActiveIds] = createSignal<string[]>([])
  const [entryIds, setEntryIds] = createSignal<Set<string>>(new Set())

  const update = (next: string[]) => {
    setActiveIds((current) =>
      current.length === next.length && current.every((id, index) => id === next[index])
        ? current
        : next,
    )
  }

  createEffect(
    on([getEntries, getScrollRoot], ([entries, root]) => {
      const ids = new Set(entries.map((entry) => entry.id))
      setEntryIds(ids)
      update([])
      if (!root || typeof IntersectionObserver !== 'function') {
        return
      }

      const targets = entries.map((entry) => document.getElementById(entry.id))
      const intersecting = new Set<string>()
      let fallbackFrame = 0

      const sync = () => {
        const visible = entries
          .filter((entry) => intersecting.has(entry.id))
          .map((entry) => entry.id)
        if (visible.length) {
          update(visible)
          return
        }

        const top = root.getBoundingClientRect().top + DOCS_HEADER_OFFSET
        let nearest: { id: string; distance: number } | undefined
        for (let index = 0; index < entries.length; index++) {
          const target = targets[index]
          if (!target) {
            continue
          }
          const distance = Math.abs(target.getBoundingClientRect().top - top)
          if (!nearest || distance < nearest.distance) {
            nearest = { id: entries[index]!.id, distance }
          }
        }
        update(nearest ? [nearest.id] : [])
      }

      const observer = new IntersectionObserver(
        (changes) => {
          for (const change of changes) {
            const id = (change.target as HTMLElement).id
            if (!ids.has(id)) {
              continue
            }
            if (change.isIntersecting && change.intersectionRatio >= 0.9) {
              intersecting.add(id)
            } else {
              intersecting.delete(id)
            }
          }
          sync()
        },
        { root, rootMargin: `-${DOCS_HEADER_OFFSET}px 0px 0px 0px`, threshold: 0.9 },
      )
      for (const target of targets) {
        if (target) {
          observer.observe(target)
        }
      }

      // Between headings the observer has no threshold crossing at the midpoint.
      // Measure only while using the fallback, coalesced to one read per frame.
      const onScroll = () => {
        if (intersecting.size || fallbackFrame) {
          return
        }
        fallbackFrame = requestAnimationFrame(() => {
          fallbackFrame = 0
          sync()
        })
      }
      root.addEventListener('scroll', onScroll, { passive: true })
      onCleanup(() => {
        observer.disconnect()
        root.removeEventListener('scroll', onScroll)
        cancelAnimationFrame(fallbackFrame)
      })
    }),
  )

  return {
    activeIds,
    primaryActiveId: () => {
      const observed = activeIds()[0]
      if (observed) {
        return observed
      }
      const hash = decodeHashAnchor(getHash())
      return entryIds().has(hash) ? hash : ''
    },
  }
}
