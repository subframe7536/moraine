import MagicString from 'magic-string'
import { createGenerator, presetWind4 } from 'unocss'
import { describe, expect, test } from 'vitest'

import { presetTheme, resolvePresetThemeOptions } from './unocss-preset-theme'

async function applyPreTransformers(
  source: string,
  id: string,
  generator: Awaited<ReturnType<typeof createGenerator>>,
): Promise<string> {
  let code = source
  const context = {
    uno: generator,
    tokens: new Set<string>(),
    invalidate() {},
  }

  for (const transformer of generator.config.transformers || []) {
    if ((transformer.enforce || 'default') !== 'pre') {
      continue
    }

    if (transformer.idFilter && !transformer.idFilter(id)) {
      continue
    }

    const magicString = new MagicString(code)
    await transformer.transform(magicString, id, context as any)

    if (magicString.hasChanged()) {
      code = magicString.toString()
    }
  }

  return code
}

async function generateComponentLayerCss(
  strategy: 'hash' | 'prefix',
  utilityPrefix: `${string}-` = 'fl-',
): Promise<{
  componentCode: string
  consumerCode: string
  css: string
}> {
  const generator = await createGenerator({
    presets: [
      presetWind4(),
      presetTheme({
        enableComponentLayer: {
          strategy,
          utilityPrefix,
          idFilter(id) {
            return id.includes('/src/')
          },
        },
      }),
    ],
  })

  const componentSource = "export const INPUT_VARIANT = { outline: 'bg-transparent' } as const"
  const consumerSource = "const view = <Input classes={{ root: 'bg-background' }} />"

  const componentCode = await applyPreTransformers(
    componentSource,
    '/app/src/input.class.ts',
    generator,
  )
  const consumerCode = await applyPreTransformers(
    consumerSource,
    '/app/docs/sidebar.tsx',
    generator,
  )

  const tokens = new Set<string>()
  await generator.applyExtractors(componentCode, '/app/src/input.class.ts', tokens)
  await generator.applyExtractors(consumerCode, '/app/docs/sidebar.tsx', tokens)
  const { css } = await generator.generate(tokens, { preflights: false })

  return {
    componentCode,
    consumerCode,
    css,
  }
}

describe('presetTheme component layer', () => {
  test('defaults enableComponentLayer to prefix strategy with fl- utility prefix', () => {
    expect(resolvePresetThemeOptions({ enableComponentLayer: true })).toMatchObject({
      enableComponentLayer: true,
      strategy: 'prefix',
      utilityPrefix: 'fl-',
    })
  })

  test('prefix strategy isolates component utilities with the configured prefix', async () => {
    const { componentCode, consumerCode, css } = await generateComponentLayerCss('prefix', 'ui-')

    expect(componentCode).toContain('ui-bg-transparent')
    expect(consumerCode).toContain("classes={{ root: 'bg-background' }}")
    expect(css).toContain('/* layer: flint-component */')
    expect(css).toContain('.ui-bg-transparent{background-color:transparent;}')
    expect(css).toContain('/* layer: default */')
    expect(css).toContain(
      '.bg-background{background-color:color-mix(in srgb, var(--background) var(--un-bg-opacity), transparent);}',
    )
    expect(css).not.toContain('.bg-transparent{background-color:transparent;}')
  })

  test('hash strategy hashes only component-owned utilities and leaves user overrides raw', async () => {
    const { componentCode, consumerCode, css } = await generateComponentLayerCss('hash')

    expect(componentCode).toMatch(/flc-[a-z0-9]+/)
    expect(componentCode).not.toContain('bg-transparent')
    expect(consumerCode).toContain("classes={{ root: 'bg-background' }}")
    expect(css).toContain('/* layer: flint-component */')
    expect(css).toMatch(/\.flc-[a-z0-9]+\{background-color:transparent;\}/)
    expect(css).toContain('/* layer: default */')
    expect(css).toContain(
      '.bg-background{background-color:color-mix(in srgb, var(--background) var(--un-bg-opacity), transparent);}',
    )
    expect(css).not.toContain('.bg-transparent{background-color:transparent;}')
  })

  test('provides semantic animation utilities via shared enter and exit keyframes', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })

    const { css } = await generator.generate(
      new Set([
        'animate-overlay-in',
        'animate-surface-in',
        'animate-menu-in-from-top',
        'animate-sheet-out-to-right',
        'animate-popover-in-from-left',
        'animate-surface-out',
      ]),
      { preflights: true },
    )

    expect(css).toContain('@keyframes flint-enter')
    expect(css).toContain('@keyframes flint-exit')
    expect(css).toContain('.animate-overlay-in{')
    expect(css).toContain('.animate-surface-in{')
    expect(css).toContain('.animate-menu-in-from-top{')
    expect(css).toContain('.animate-sheet-out-to-right{')
    expect(css).toContain(
      'animation:flint-enter var(--flint-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain(
      'animation:flint-exit var(--flint-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain('--flint-enter-opacity:0')
    expect(css).toContain('--flint-enter-scale:0.95')
    expect(css).toContain('--flint-enter-translate-y:-0.5rem')
    expect(css).toContain('--flint-exit-translate-x:2.5rem')
    expect(css).toContain('--flint-exit-scale:0.95')
    expect(css).not.toContain('animation:flint-enter;}')
    expect(css).not.toContain('animation:flint-exit;}')
    expect(css).not.toContain('@keyframes surface-in')
    expect(css).not.toContain('@keyframes menu-in-from-top')
    expect(css).not.toContain('@keyframes sheet-out-to-right')
  })

  test('matches old overlay motion combinations for menu, popover, tooltip, and sheet', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })

    const { css } = await generator.generate(
      new Set([
        'animate-menu-in-from-left',
        'animate-menu-out-to-left',
        'animate-popover-in-from-top',
        'animate-tooltip-in-from-bottom',
        'animate-surface-out',
        'animate-sheet-in-from-right',
        'animate-sheet-out-to-right',
      ]),
      { preflights: true },
    )

    expect(css).toContain('.animate-menu-in-from-left{')
    expect(css).toContain('--flint-enter-scale:0.9')
    expect(css).toContain('--flint-enter-translate-x:-0.5rem')
    expect(css).toContain('.animate-menu-out-to-left{')
    expect(css).toContain('--flint-exit-scale:0.9')
    expect(css).toContain('--flint-exit-translate-x:-0.5rem')
    expect(css).toContain('.animate-popover-in-from-top{')
    expect(css).toContain('.animate-tooltip-in-from-bottom{')
    expect(css).toContain('.animate-surface-out{')
    expect(css).toContain('.animate-sheet-in-from-right{')
    expect(css).toContain('.animate-sheet-out-to-right{')
    expect(css).toContain(
      'animation:flint-enter var(--flint-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain(
      'animation:flint-exit var(--flint-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain('--flint-enter-translate-x:2.5rem')
    expect(css).toContain('--flint-exit-translate-x:2.5rem')
    expect(css).not.toContain('--flint-enter-scale:0.9;--flint-enter-translate-x:2.5rem')
  })

  test('matches old preset horizontal direction signs for semantic enter animations', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })

    const { css } = await generator.generate(
      new Set([
        'animate-menu-in-from-left',
        'animate-menu-in-from-right',
        'animate-popover-in-from-left',
        'animate-popover-in-from-right',
        'animate-tooltip-in-from-left',
        'animate-tooltip-in-from-right',
        'animate-sheet-in-from-left',
        'animate-sheet-in-from-right',
      ]),
      { preflights: true },
    )

    expect(css).toContain('.animate-menu-in-from-left{')
    expect(css).toContain('--flint-enter-translate-x:-0.5rem')
    expect(css).toContain('.animate-menu-in-from-right{')
    expect(css).toContain('--flint-enter-translate-x:0.5rem')
    expect(css).toContain('.animate-popover-in-from-left{')
    expect(css).toContain('.animate-popover-in-from-right{')
    expect(css).toContain('--flint-enter-translate-x:-0.25rem')
    expect(css).toContain('--flint-enter-translate-x:0.25rem')
    expect(css).toContain('.animate-sheet-in-from-left{')
    expect(css).toContain('--flint-enter-translate-x:-2.5rem')
    expect(css).toContain('.animate-sheet-in-from-right{')
    expect(css).toContain(
      'animation:flint-enter var(--flint-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain('--flint-enter-translate-x:2.5rem')
  })
})
