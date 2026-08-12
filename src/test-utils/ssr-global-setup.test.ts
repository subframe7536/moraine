import type { createServer } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import type { TestProject } from 'vitest/node'

import { renderFixtures } from './ssr-global-setup.ts'

describe('SSR global setup', () => {
  test('closes the Vite server when a fixture import fails', async () => {
    const close = vi.fn(async () => undefined)
    const createViteServer = vi.fn(async () => ({
      close,
      environments: {
        ssr: {
          runner: {
            import: async () => {
              throw new Error('fixture import failed')
            },
          },
        },
      },
    })) as unknown as typeof createServer
    const project = {
      config: { root: process.cwd() },
      provide: vi.fn(),
    } as unknown as TestProject

    await expect(renderFixtures(project, createViteServer)).rejects.toThrow('fixture import failed')
    expect(close).toHaveBeenCalledTimes(1)
    expect(project.provide).not.toHaveBeenCalled()
  })
})
