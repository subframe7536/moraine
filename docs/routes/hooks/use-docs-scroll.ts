import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

export const DOCS_SCROLL_TARGET_RETRY_FRAMES = 8
export const DOCS_SCROLL_TARGET_POSITION_RETRY_ATTEMPTS = 5
export const DOCS_SCROLL_TARGET_POSITION_RETRY_DELAY = 200
export const DOCS_STICKY_HEADER_OFFSET = 52

export interface DocsScrollLocation {
  pathname: string
  hash: string
}

export interface UseDocsScrollOptions {
  getLocation: Accessor<DocsScrollLocation>
  isRouting: Accessor<boolean>
  committedPath: Accessor<string>
  getScrollRoot: () => HTMLElement | undefined
}

function decodeHashAnchor(hash: string): string | undefined {
  const anchor = hash.startsWith('#') ? hash.slice(1) : hash
  if (!anchor) {
    return ''
  }

  try {
    return decodeURIComponent(anchor)
  } catch {
    return undefined
  }
}

function scrollToTop(scrollRoot: HTMLElement) {
  const scrollBehavior = scrollRoot.style.scrollBehavior
  scrollRoot.style.scrollBehavior = 'auto'
  scrollRoot.scrollTop = 0
  scrollRoot.style.scrollBehavior = scrollBehavior
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function useDocsScroll(options: UseDocsScrollOptions) {
  let lastHandledPath: string | undefined

  createEffect(() => {
    const location = options.getLocation()

    if (options.isRouting() || options.committedPath() !== location.pathname) {
      return
    }

    const anchor = decodeHashAnchor(location.hash)

    if (!anchor) {
      if (lastHandledPath !== undefined && lastHandledPath !== location.pathname) {
        const scrollRoot = options.getScrollRoot()
        if (scrollRoot) {
          scrollToTop(scrollRoot)
        }
      }
      lastHandledPath = location.pathname
      return
    }

    lastHandledPath = location.pathname
    let frame: number | undefined
    let retryTimeout: number | undefined
    let attempts = 0
    let positionAttempts = 0

    const scrollToTarget = (target: HTMLElement) => {
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
    }

    const schedulePositionReconciliation = () => {
      frame = requestAnimationFrame(() => {
        frame = undefined
        const target = document.getElementById(anchor)
        if (target && target.getBoundingClientRect().top < DOCS_STICKY_HEADER_OFFSET) {
          scrollToTarget(target)
        }

        positionAttempts += 1
        if (positionAttempts < DOCS_SCROLL_TARGET_POSITION_RETRY_ATTEMPTS) {
          retryTimeout = window.setTimeout(() => {
            retryTimeout = undefined
            schedulePositionReconciliation()
          }, DOCS_SCROLL_TARGET_POSITION_RETRY_DELAY)
        }
      })
    }

    const scrollToAnchor = () => {
      frame = undefined
      const target = document.getElementById(anchor)
      if (target) {
        scrollToTarget(target)
        schedulePositionReconciliation()
        return
      }

      attempts += 1
      if (attempts < DOCS_SCROLL_TARGET_RETRY_FRAMES) {
        frame = requestAnimationFrame(scrollToAnchor)
      }
    }

    frame = requestAnimationFrame(scrollToAnchor)
    onCleanup(() => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
      }
      if (retryTimeout !== undefined) {
        window.clearTimeout(retryTimeout)
      }
    })
  })
}
