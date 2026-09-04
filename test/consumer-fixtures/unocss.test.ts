// @vitest-environment node

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createGenerator, presetWind3, presetWind4 } from '@subf/unocss'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import {
  createIsolatedConsumer,
  readPublishedModules,
  removeIsolatedConsumer,
  verifyConsumerPackageExports,
} from './helpers.ts'
import type { IsolatedConsumer } from './helpers.ts'

describe('isolated built-dist UnoCSS consumer', () => {
  let consumer: IsolatedConsumer

  beforeAll(() => {
    consumer = createIsolatedConsumer()
  }, 30_000)

  afterAll(() => {
    removeIsolatedConsumer(consumer)
  })

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])(
    'scans published modules and compiles component contracts with %s',
    async (_name, wind) => {
      verifyConsumerPackageExports(consumer)
      const modulePath = join(consumer.packageDir, 'dist/unocss.mjs')
      const { presetMoraine } = await import(pathToFileURL(modulePath).href)
      const generator = await createGenerator({
        presets: [wind(), presetMoraine()],
      })
      const tokens = new Set<string>()

      for (const module of readPublishedModules(consumer.packageDir)) {
        await generator.applyExtractors(module.code, module.id, tokens)
      }

      const requiredTokens = [
        'data-disabled:opacity-64',
        'data-focused:ring-3',
        'aria-invalid:border-destructive',
        'data-expanded:animate-mo-enter',
        'data-closed:animate-mo-exit',
        'z-floating',
        'bg-primary',
      ]
      for (const token of requiredTokens) {
        expect(tokens).toContain(token)
      }

      // Component CSS must compile without installing an icon preset. Icon masks are
      // verified independently through the optional published stylesheet below.
      for (const token of tokens) {
        if (token.startsWith('icon-') || token.startsWith('i-lucide-')) {
          tokens.delete(token)
        }
      }

      const { css } = await generator.generate(tokens, { preflights: true })
      expect(css).toContain('[data-disabled]')
      expect(css).toContain('[data-focused]')
      expect(css).toContain('[aria-invalid]')
      expect(css).toContain('animate-mo-enter')
      expect(css).toContain('animate-mo-exit')
      expect(css).toContain('@keyframes mo-enter')
      expect(css).toContain('@keyframes mo-exit')
      expect(css).toContain('.z-floating')
      expect(css).toContain('z-index:50')
      expect(css).toMatch(/opacity:(0\.64|64%)/)
      expect(css).toContain('var(--primary)')
    },
    15_000,
  )

  test('keeps icon masks in the optional asset', () => {
    const iconCSS = readFileSync(join(consumer.packageDir, 'dist/icon.css'), 'utf8')

    expect(iconCSS).toContain('.icon-check')
    expect(iconCSS).not.toContain('.animate-mo-enter')
    expect(iconCSS).not.toContain('.z-floating')
  })
})
