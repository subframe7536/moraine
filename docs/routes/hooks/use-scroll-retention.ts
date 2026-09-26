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
  let restoreFrame: number | undefined
  let restoreObserver: MutationObserver | undefined
  let restoring: { element: HTMLElement; path: string; top: number } | undefined
  let hotUpdating = false

  const stopRestoring = () => {
    if (restoreFrame !== undefined) {
      cancelAnimationFrame(restoreFrame)
      restoreFrame = undefined
    }
    restoreObserver?.disconnect()
    restoreObserver = undefined
    restoring = undefined
  }

  const scheduleRestore = () => {
    if (!restoring || restoreFrame !== undefined) {
      return
    }

    restoreFrame = requestAnimationFrame(() => {
      restoreFrame = undefined
      const target = restoring
      if (!target) {
        return
      }
      if (!target.element.isConnected || options.path() !== target.path || window.location.hash) {
        stopRestoring()
        return
      }

      target.element.scrollTop = target.top
      // The old content can still satisfy the target before HMR replaces it.
      if (!hotUpdating && target.element.scrollTop >= target.top - 1) {
        stopRestoring()
      }
    })
  }

  const saveScroll = () => {
    if (restoring) {
      return
    }
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
        stopRestoring()
        restoring = { element: el, path, top: saved }
        restoreObserver = new MutationObserver(scheduleRestore)
        restoreObserver.observe(el, { childList: true, subtree: true })
        scheduleRestore()
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
        if (restoring) {
          return
        }
        if (saveTimer !== undefined) {
          clearTimeout(saveTimer)
        }
        saveTimer = setTimeout(saveScroll, 100)
      }

      el.addEventListener('scroll', handleScroll, { passive: true })
      el.addEventListener('wheel', stopRestoring, { passive: true })
      el.addEventListener('touchstart', stopRestoring, { passive: true })

      onCleanup(() => {
        if (saveTimer !== undefined) {
          clearTimeout(saveTimer)
        }
        saveScroll()
        stopRestoring()
        el.removeEventListener('scroll', handleScroll)
        el.removeEventListener('wheel', stopRestoring)
        el.removeEventListener('touchstart', stopRestoring)
      })
    }),
  )

  window.addEventListener('beforeunload', saveScroll)
  const handleHotUpdate = () => {
    hotUpdating = true
    if (!restoring) {
      saveScroll()
      restoreScroll()
    }
  }
  const handleHotUpdateComplete = () => {
    hotUpdating = false
    scheduleRestore()
  }
  import.meta.hot?.on('vite:beforeUpdate', handleHotUpdate)
  import.meta.hot?.on('vite:afterUpdate', handleHotUpdateComplete)
  onCleanup(() => {
    window.removeEventListener('beforeunload', saveScroll)
    import.meta.hot?.off('vite:beforeUpdate', handleHotUpdate)
    import.meta.hot?.off('vite:afterUpdate', handleHotUpdateComplete)
    stopRestoring()
  })

  return {
    saveScroll,
    restoreScroll,
  }
}
