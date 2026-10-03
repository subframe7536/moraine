// @vitest-environment node

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { __unstable__loadDesignSystem, compile } from 'tailwindcss'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import {
  createIsolatedConsumer,
  loadStylesheet,
  readBuiltClassTokens,
  removeIsolatedConsumer,
  resolveStylesheet,
  verifyConsumerPackageExports,
} from './helpers'
import type { IsolatedConsumer } from './helpers'

const CANDIDATES = [
  'data-disabled:opacity-64',
  'data-focused:opacity-64',
  'aria-invalid:opacity-64',
  'animate-mo-enter',
  'animate-mo-exit',
  'z-floating',
  'bg-primary',
  'rounded-md',
  'shadow-md',
  'shadow-surface',
  'shadow-overlay',
  'shadow-input',
  'bg-backdrop',
  'font-sans',
  'text-5xl',
  'w-sidebar',
  'w-(--mo-sidebar-width)',
  'data-highlighted:bg-accent-hover',
  'hover:bg-accent-hover',
  'active:bg-accent-active',
  'h-(--s-size)',
  'size-(--s-thumb-size)',
  'size-(--st-size)',
  'start-[calc(50%+var(--st-sep-x))]',
  '[&:not([data-inverted])]:after:left-(--s-marker-position)',
]

describe('isolated built-dist Tailwind v4 consumer', () => {
  let consumer: IsolatedConsumer

  beforeAll(() => {
    consumer = createIsolatedConsumer()
  }, 30_000)

  afterAll(() => {
    removeIsolatedConsumer(consumer)
  })

  async function compileConsumerCSS(includeIcons = false, candidates = CANDIDATES) {
    const input = [
      `@import "tailwindcss";`,
      includeIcons ? `@import "moraine/icon.css";` : '',
      `@plugin "moraine/tailwind";`,
      `@source "node_modules/moraine/dist";`,
    ]
      .filter(Boolean)
      .join('\n')
    const pluginPath = join(consumer.packageDir, 'dist/tailwind.mjs')
    const options: Parameters<typeof compile>[1] = {
      base: consumer.root,
      from: join(consumer.root, 'app.css'),
      async loadModule(id) {
        if (id !== 'moraine/tailwind') {
          throw new Error(`Unexpected plugin: ${id}`)
        }
        const module = await import(pathToFileURL(pluginPath).href)
        return {
          path: pluginPath,
          base: dirname(pluginPath),
          module: module.default,
        }
      },
      async loadStylesheet(id, base) {
        return loadStylesheet(resolveStylesheet(id, base, consumer.packageDir))
      },
    }
    const compiled = await compile(input, options)
    const designSystem = await __unstable__loadDesignSystem(input, options)

    return { css: compiled.build(candidates), sources: compiled.sources, designSystem }
  }

  test('compiles all build class tokens with valid transition properties', async () => {
    // Group and peer markers intentionally emit no declarations.
    const candidates = readBuiltClassTokens().filter(
      (token) => !/^(?:group|peer)(?:\/.*)?$/.test(token),
    )
    const { css, designSystem } = await compileConsumerCSS(false, candidates)
    const output = designSystem.candidatesToCss(candidates)
    expect.soft(candidates.filter((_token, index) => output[index] === null)).toEqual([])
    expect(css).not.toMatch(/transition-property:\s*[^;]*\bcolors\b/)
    expect(css).toMatch(/\[aria-invalid=(?:"true"|true)\]/)
    expect(css).toContain('blur(4px)')
  })

  test('loads the package plugin and compiles published component contracts', async () => {
    verifyConsumerPackageExports(consumer)
    const { css, sources } = await compileConsumerCSS()

    expect(sources).toContainEqual({
      base: consumer.root,
      pattern: 'node_modules/moraine/dist',
      negated: false,
    })
    expect(css).toContain('[data-disabled]')
    expect(css).toContain('[data-focused]')
    expect(css).toContain('[aria-invalid]')
    expect(css).toMatch(/width:\s*var\(--mo-sidebar-width\)/)
    expect(css).toContain('.animate-mo-enter')
    expect(css).toContain('.animate-mo-exit')
    expect(css).toContain('@keyframes mo-enter')
    expect(css).toContain('@keyframes mo-exit')
    expect(css).toContain('.z-floating')
    expect(css).toContain('z-index: 50')
    expect(css).toContain('opacity: 64%')
    expect(css).toContain('var(--primary)')
    expect(css).toContain('border-radius: calc(var(--radius) * 0.8)')
    expect(css).toContain('.shadow-md')
    expect(css).toContain('--tw-shadow: var(--shadow-surface)')
    expect(css).toContain('--tw-shadow: var(--shadow-overlay)')
    expect(css).toContain('--tw-shadow: var(--shadow-input)')
    expect(css).toContain('background-color: var(--backdrop, rgb(0 0 0 / 0.1))')
    expect(css).toContain('font-family: var(--font-sans)')
    expect(css).toContain('font-size: calc(var(--font-size, 1rem) * 3)')
    expect(css).toContain('width: var(--sidebar-width,clamp(14rem,25%,20rem))')
    expect(css).toContain('var(--mo-auto-accent-hover')
    expect(css).toContain('var(--accent-hover')
    expect(css).toContain('var(--accent-active')
    expect(css).toContain('@supports (color: color-mix(in oklch, red, white))')
    expect(css).toContain('--mo-auto-accent-hover: color-mix(in oklch, var(--accent),')
    expect(css).toContain('height: var(--s-size)')
    expect(css).toContain('var(--st-size)')
    expect(css).toContain('var(--st-sep-x)')
    expect(css).toContain('width: var(--s-thumb-size)')
    expect(css).toContain('height: var(--s-thumb-size)')
    expect(css).toContain('left: var(--s-marker-position)')
    expect(css).not.toMatch(/html\s*\{\s*background-color: var\(--background\)/)
    expect(css).not.toMatch(/--primary:\s/)
    expect(css).not.toContain('.icon-check')
  })

  test('keeps bundled icon masks optional and independent', async () => {
    const withoutIcons = await compileConsumerCSS()
    const withIcons = await compileConsumerCSS(true)
    const iconAsset = readFileSync(join(consumer.packageDir, 'dist/icon.css'), 'utf8')

    expect(withoutIcons.css).not.toContain('.icon-check')
    expect(iconAsset).toContain('.icon-check')
    expect(withIcons.css).toContain('.icon-check')
    expect(withIcons.css).toContain('.animate-mo-enter')
  })
})
