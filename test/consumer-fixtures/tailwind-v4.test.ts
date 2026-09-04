// @vitest-environment node

import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { compile } from 'tailwindcss'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import {
  createPackedConsumer,
  loadStylesheet,
  removePackedConsumer,
  resolveStylesheet,
} from './helpers.ts'
import type { PackedConsumer } from './helpers.ts'

const CANDIDATES = [
  'data-disabled:opacity-64',
  'data-focused:opacity-64',
  'aria-invalid:opacity-64',
  'animate-mo-enter',
  'animate-mo-exit',
  'z-floating',
  'bg-primary',
]

describe('packed Tailwind v4 consumer', () => {
  let consumer: PackedConsumer
  let stylesDir: string

  beforeAll(() => {
    consumer = createPackedConsumer()
    stylesDir = join(consumer.root, 'styles')
    mkdirSync(stylesDir, { recursive: true })
  })

  afterAll(() => removePackedConsumer(consumer))

  async function compileConsumerCSS(includeIcons = false): Promise<{
    css: string
    sources: Array<{ base: string; pattern: string }>
  }> {
    const input = [
      `@import "tailwindcss";`,
      includeIcons ? `@import "moraine/icon.css";` : '',
      `@plugin "moraine/tailwind";`,
      `@source "../node_modules/moraine/dist";`,
    ]
      .filter(Boolean)
      .join('\n')
    const pluginPath = join(consumer.packageDir, 'dist/tailwind.mjs')
    const compiled = await compile(input, {
      base: stylesDir,
      from: join(stylesDir, 'app.css'),
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
    })

    return { css: compiled.build(CANDIDATES), sources: compiled.sources }
  }

  test('loads the package plugin and compiles published component contracts', async () => {
    const { css, sources } = await compileConsumerCSS()

    expect(sources).toContainEqual({
      base: stylesDir,
      pattern: '../node_modules/moraine/dist',
      negated: false,
    })
    expect(css).toContain('[data-disabled]')
    expect(css).toContain('[data-focused]')
    expect(css).toContain('[aria-invalid]')
    expect(css).toContain('.animate-mo-enter')
    expect(css).toContain('.animate-mo-exit')
    expect(css).toContain('@keyframes mo-enter')
    expect(css).toContain('@keyframes mo-exit')
    expect(css).toContain('.z-floating')
    expect(css).toContain('z-index: 50')
    expect(css).toContain('opacity: 64%')
    expect(css).toContain('var(--primary)')
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
