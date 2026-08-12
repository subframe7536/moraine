import { inject } from 'vitest'

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

  hydrationGlobal._$HY = {
    completed: new WeakSet<Node>(),
    done: false,
    events: [],
    fe: () => undefined,
    r: {},
  }

  return () => {
    if (previous) {
      hydrationGlobal._$HY = previous
      return
    }

    delete hydrationGlobal._$HY
  }
}
