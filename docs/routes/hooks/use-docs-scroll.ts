import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

export const DOCS_SCROLL_TARGET_RETRY_FRAMES = 8

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
    let frame = 0
    let attempts = 0

    const scrollToAnchor = () => {
      const target = document.getElementById(anchor)
      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        })
        return
      }

      attempts += 1
      if (attempts < DOCS_SCROLL_TARGET_RETRY_FRAMES) {
        frame = requestAnimationFrame(scrollToAnchor)
      }
    }

    frame = requestAnimationFrame(scrollToAnchor)
    onCleanup(() => {
      if (frame) {
        cancelAnimationFrame(frame)
      }
    })
  })
}
