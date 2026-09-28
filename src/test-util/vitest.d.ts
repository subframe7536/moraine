import type { ProvidedContext } from 'vitest'

declare module 'vitest' {
  interface ProvidedContext extends Record<string, unknown> {
    ssrFixtures: Record<string, string>
  }
}

export type { ProvidedContext }
