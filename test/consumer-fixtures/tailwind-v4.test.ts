// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import {
  createIsolatedConsumer,
  removeIsolatedConsumer,
  verifyConsumerPackageExports,
} from './helpers.ts'
import type { IsolatedConsumer } from './helpers.ts'

describe('isolated built-dist Tailwind v4 consumer', () => {
  let consumer: IsolatedConsumer

  beforeAll(() => {
    consumer = createIsolatedConsumer()
  }, 30_000)

  afterAll(() => {
    removeIsolatedConsumer(consumer)
  })

  function compileConsumerCSS(includeIcons = false): string {
    const input = [
      `@import "tailwindcss";`,
      includeIcons ? `@import "moraine/icon.css";` : '',
      `@plugin "moraine/tailwind";`,
      `@source "node_modules/moraine/dist";`,
    ]
      .filter(Boolean)
      .join('\n')
    const inputPath = join(consumer.root, 'app.css')
    const outputPath = join(consumer.root, 'output.css')
    writeFileSync(inputPath, input)

    execFileSync('nubx', ['tailwindcss', '-i', inputPath, '-o', outputPath], {
      cwd: process.cwd(),
      stdio: 'pipe',
    })

    return readFileSync(outputPath, 'utf8')
  }

  test('scans published component classes through the Tailwind CLI', () => {
    verifyConsumerPackageExports(consumer)
    const css = compileConsumerCSS()
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

  test('keeps bundled icon masks optional and independent', () => {
    const withIcons = compileConsumerCSS(true)
    const iconAsset = readFileSync(join(consumer.packageDir, 'dist/icon.css'), 'utf8')

    expect(iconAsset).toContain('.icon-check')
    expect(withIcons).toContain('.icon-check')
    expect(withIcons).toContain('.animate-mo-enter')
  })
})
