import type { JSX } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { inject, onTestFinished } from 'vitest'

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

  const state: HydrationState = {
    completed: new WeakSet<Node>(),
    done: false,
    events: [],
    fe: () => undefined,
    r: {},
  }
  hydrationGlobal._$HY = state

  return () => {
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

  const restoreHydrationState = installHydrationState()
  const dispose = hydrate(renderApp, container)

  let unmounted = false
  const unmount = (): void => {
    if (unmounted) {
      return
    }
    unmounted = true
    try {
      dispose()
    } finally {
      container.remove()
      restoreHydrationState()
    }
  }

  try {
    onTestFinished(() => {
      unmount()
    })
  } catch {
    // Outside test context
  }

  return {
    container,
    dispose,
    unmount,
  }
}
