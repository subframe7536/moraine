import type { Accessor } from 'solid-js'
import { createEffect, on, onCleanup } from 'solid-js'
import { isServer } from 'solid-js/web'

const STORAGE_PREFIX = 'mo-docs-scroll:'

export interface UseScrollRetentionOptions {
  element: Accessor<HTMLElement | undefined>
  path: Accessor<string>
}

/**
 * Retains and restores scroll position for an internal scroll container
 * across browser refreshes and Vite HMR reloads during development.
 */
export function useScrollRetention(options: UseScrollRetentionOptions) {
  if (isServer) {
    return {
      saveScroll: () => {},
      restoreScroll: () => {},
    }
  }

  let saveTimer: ReturnType<typeof setTimeout> | undefined

  const saveScroll = () => {
    const el = options.element()
    if (!el) {
      return
    }
    const path = options.path()
    if (!path) {
      return
    }

    try {
      const top = el.scrollTop
      sessionStorage.setItem(`${STORAGE_PREFIX}${path}`, String(top))
      if (import.meta.hot) {
        import.meta.hot.data[`scroll:${path}`] = top
      }
    } catch {
      // Silently handle storage access restrictions
    }
  }

  const restoreScroll = () => {
    const el = options.element()
    if (!el) {
      return
    }

    // Preserve hash scrolling if target exists
    if (window.location.hash) {
      return
    }

    const path = options.path()
    try {
      let saved: number | undefined
      if (import.meta.hot?.data?.[`scroll:${path}`] !== undefined) {
        saved = Number(import.meta.hot.data[`scroll:${path}`])
      }

      if (saved === undefined) {
        const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${path}`)
        if (stored !== null) {
          saved = Number.parseFloat(stored)
        }
      }

      if (saved !== undefined && !Number.isNaN(saved) && saved > 0) {
        requestAnimationFrame(() => {
          if (el.isConnected) {
            el.scrollTop = saved!
          }
        })
      }
    } catch {
      // Silently handle storage access restrictions
    }
  }

  createEffect(
    on(options.element, (el) => {
      if (!el) {
        return
      }

      restoreScroll()

      const handleScroll = () => {
        if (saveTimer !== undefined) {
          clearTimeout(saveTimer)
        }
        saveTimer = setTimeout(saveScroll, 100)
      }

      el.addEventListener('scroll', handleScroll, { passive: true })

      onCleanup(() => {
        if (saveTimer !== undefined) {
          clearTimeout(saveTimer)
        }
        saveScroll()
        el.removeEventListener('scroll', handleScroll)
      })
    }),
  )

  window.addEventListener('beforeunload', saveScroll)
  onCleanup(() => {
    window.removeEventListener('beforeunload', saveScroll)
  })

  return {
    saveScroll,
    restoreScroll,
  }
}
