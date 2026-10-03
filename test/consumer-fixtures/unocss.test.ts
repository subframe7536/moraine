// @vitest-environment node

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createGenerator, presetWind3, presetWind4 } from '@subf/unocss'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import {
  createIsolatedConsumer,
  readBuiltClassTokens,
  removeIsolatedConsumer,
  verifyConsumerPackageExports,
} from './helpers'
import type { IsolatedConsumer } from './helpers'

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
    'compiles all build class tokens and component contracts with %s',
    async (_name, wind) => {
      verifyConsumerPackageExports(consumer)
      const modulePath = join(consumer.packageDir, 'dist/unocss.mjs')
      const { presetMoraine } = await import(pathToFileURL(modulePath).href)
      const generator = await createGenerator({
        presets: [wind(), presetMoraine({ wind3: wind === presetWind3 })],
      })
      // Group and peer markers intentionally emit no declarations.
      const candidates = readBuiltClassTokens().filter(
        (token) => !/^(?:group|peer)(?:\/.*)?$/.test(token),
      )
      const tokens = new Set(candidates)

      const requiredTokens = [
        'data-disabled:opacity-64',
        'focus:ring-3',
        'peer-focus:ring-3',
        'peer-aria-[invalid=true]:border-destructive',
        'aria-invalid:border-destructive',
        'data-expanded:animate-mo-enter',
        'data-closed:animate-mo-exit',
        'z-floating',
        'w-(--mo-sidebar-width)',
        'bg-primary',
        'data-highlighted:bg-accent-hover',
        'data-highlighted:text-accent-foreground',
        'hover:bg-accent-hover',
        'active:bg-accent-active',
        'w-(--mo-popper-anchor-width)',
        'origin-(--mo-popper-content-transform-origin)',
        'after:h-(--s-offset)',
        'size-(--s-thumb-size)',
        '[&:not([data-inverted])]:after:left-(--s-marker-position)',
        '-translate-x-1/2',
        'data-transition:h-(--mo-collapsible-content-height)',
        'data-[side=bottom]:mt-(--mo-popper-content-overflow-padding)',
        'data-[side=bottom]:-enter-translate-y-1',
        'data-[side=right]:-enter-translate-x-1',
      ]
      for (const token of requiredTokens) {
        expect(tokens).toContain(token)
      }

      const { css, matched } = await generator.generate(tokens, { preflights: true })
      expect(candidates.filter((token) => !matched.has(token))).toEqual([])
      expect(css).not.toMatch(/transition-property:\s*[^;]*\bcolors\b/)
      expect(css).toMatch(/\[aria-invalid=(?:"true"|true)\]/)
      expect(css).toContain('blur(4px)')
      expect(css).toContain('[data-disabled]')
      expect(css).toContain(':focus')
      expect(css).toContain('.peer')
      expect(css).not.toContain(':has(>input:focus)')
      expect(css).toContain('[aria-invalid]')
      expect(css).toContain('animate-mo-enter')
      expect(css).toContain('animate-mo-exit')
      expect(css).toContain('@keyframes mo-enter')
      expect(css).toContain('@keyframes mo-exit')
      expect(css).toContain('@keyframes shimmer')
      expect(css).toMatch(
        /animation:\s*shimmer var\(--mo-anim-duration,var\(--mo-anim-duration-loop,2s\)\) linear infinite/,
      )
      expect(css).toContain('.z-floating')
      expect(css).toContain('z-index:50')
      expect(css).toMatch(/width:\s*var\(--mo-sidebar-width\)/)
      expect(css).toMatch(/opacity:(0\.64|64%)/)
      expect(css).toContain('var(--primary)')
      expect(css).toContain('var(--mo-auto-accent-hover')
      expect(css).toContain('var(--accent-hover')
      expect(css).toContain('var(--accent-foreground)')
      expect(css).toContain('var(--accent-active')
      expect(css).toContain('@supports (color: color-mix(in oklch, red, white))')
      expect(css).not.toContain('@supports not (color: color-mix(in oklch, red, white))')
      expect(css).toContain('width:var(--mo-popper-anchor-width)')
      expect(css).toContain('transform-origin:var(--mo-popper-content-transform-origin)')
      expect(css).toContain('height:var(--mo-collapsible-content-height)')
      expect(css).toContain('height:var(--s-offset)')
      if (wind === presetWind3) {
        expect(css).not.toContain('--mo-leading')
        expect(css).not.toContain('font-size:calc(var(--font-size')
        expect(css).not.toContain('--un-leading')
      } else {
        expect(css).toContain('font-size:calc(var(--font-size, 1rem) * 0.875)')
        expect(css).toContain('border-radius:calc(var(--radius) * 0.8)')
      }
      expect(css).toContain('left:var(--s-marker-position)')
      expect(css).not.toContain('--st-')
      expect(css).toContain('width:var(--s-thumb-size)')
      expect(css).toContain('height:var(--s-thumb-size)')
    },
    15_000,
  )

  test.each([
    ['Wind3', presetWind3],
    ['Wind4', presetWind4],
  ])('uses external colors and scoped overrides with %s', async (_name, wind) => {
    const modulePath = join(consumer.packageDir, 'dist/unocss.mjs')
    const { presetMoraine } = await import(pathToFileURL(modulePath).href)
    const generator = await createGenerator({
      presets: [
        wind(),
        presetMoraine({
          wind3: wind === presetWind3,
          themeDefaults: false,
          override: {
            brand: {
              selector: '[data-theme="brand"]',
              colors: { primary: { base: '#369', hover: '#258' } },
            },
          },
        }),
      ],
    })
    const { css } = await generator.generate(new Set(['hover:bg-primary-hover']), {
      preflights: true,
    })

    expect(css).toContain('[data-theme="brand"] {\n  --primary: #369;\n  --primary-hover: #258;\n}')
    expect(css).toContain('var(--primary-hover, var(--mo-auto-primary-hover, var(--primary)))')
    expect(css).not.toContain('--background: rgb(')
  })

  test('keeps icon masks in the optional asset', () => {
    const iconCSS = readFileSync(join(consumer.packageDir, 'dist/icon.css'), 'utf8')

    expect(iconCSS).toContain('.icon-check')
    expect(iconCSS).not.toContain('.animate-mo-enter')
    expect(iconCSS).not.toContain('.z-floating')
  })
})
