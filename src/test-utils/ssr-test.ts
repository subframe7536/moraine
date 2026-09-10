import type { JSX } from 'solid-js'
import { sharedConfig } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { expect, inject, onTestFinished } from 'vitest'

const ssrFixtures = (): Record<string, string> => inject('ssrFixtures')

interface HydrationState {
  completed: WeakSet<Node>
  done: boolean
  events: Array<unknown>
  fe: () => void
  r: Record<string, unknown>
}

type HydrationGlobal = typeof globalThis & {
  _$HY?: HydrationState
}

export function renderSsrFixture(modulePath: `/src/${string}`, exportName: string): string {
  const key = `${modulePath}#${exportName}`
  const markup = ssrFixtures()?.[key]
  if (typeof markup !== 'string') {
    throw new TypeError(`SSR fixture not found: ${key}`)
  }
  return markup
}

export function installHydrationState(): () => void {
  const hydrationGlobal = globalThis as HydrationGlobal
  const previous = hydrationGlobal._$HY
  const previousDone = sharedConfig.done

  const state: HydrationState = {
    completed: new WeakSet<Node>(),
    done: false,
    events: [],
    fe: () => undefined,
    r: {},
  }
  hydrationGlobal._$HY = state
  // Delegated events and hydration failures mark the Solid runtime as finished.
  sharedConfig.done = false

  return () => {
    sharedConfig.done = previousDone
    if (previous) {
      hydrationGlobal._$HY = previous
      return
    }

    queueMicrotask(() => {
      if (hydrationGlobal._$HY === state) {
        delete hydrationGlobal._$HY
      }
    })
  }
}

export interface HydrateFixtureResult {
  container: HTMLElement
  dispose: () => void
  unmount: () => void
}

/**
 * Mounts a pre-rendered SSR fixture into a container element and hydrates it with Solid.
 * Verifies that hydration preserves every server element and its parent.
 * Automatically cleans up DOM and hydration state when the test completes or when unmount() is called.
 */
export function hydrateFixture(
  modulePath: `/src/${string}`,
  exportName: string,
  renderApp: () => JSX.Element,
): HydrateFixtureResult {
  const markup = renderSsrFixture(modulePath, exportName)
  const container = document.createElement('div')
  container.innerHTML = markup
  document.body.append(container)
  const serverElements = Array.from(container.querySelectorAll('*'), (element) => ({
    element,
    parent: element.parentElement,
  }))

  const restoreHydrationState = installHydrationState()
  let dispose: (() => void) | undefined

  let unmounted = false
  const unmount = (): void => {
    if (unmounted) {
      return
    }
    unmounted = true
    try {
      dispose?.()
    } finally {
      container.remove()
      restoreHydrationState()
    }
  }

  onTestFinished(unmount)
  dispose = hydrate(renderApp, container)

  for (const { element, parent } of serverElements) {
    const label = `${element.tagName.toLowerCase()}[data-slot="${element.getAttribute('data-slot') ?? ''}"]`
    expect(container.contains(element), `Hydration removed ${label}`).toBe(true)
    expect(element.parentElement, `Hydration reparented ${label}`).toBe(parent)
  }

  return {
    container,
    dispose,
    unmount,
  }
}
