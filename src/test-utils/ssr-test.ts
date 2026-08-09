import { execFileSync } from 'node:child_process'

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
  return execFileSync(
    'bun',
    ['run', 'src/test-utils/render-ssr-fixture.ts', modulePath, exportName],
    { cwd: process.cwd(), encoding: 'utf8' },
  )
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
