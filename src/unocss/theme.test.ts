import MagicString from 'magic-string'
import { createGenerator, presetWind4 } from 'unocss'
import { describe, expect, test } from 'vitest'

import { presetTheme, resolvePresetThemeOptions } from './theme'

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
  utilityPrefix: `${string}-` = 'mr-',
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
      utilityPrefix: 'mr-',
    })
  })

  test('prefix strategy isolates component utilities with the configured prefix', async () => {
    const { componentCode, consumerCode, css } = await generateComponentLayerCss('prefix', 'ui-')

    expect(componentCode).toContain('ui-bg-transparent')
    expect(consumerCode).toContain("classes={{ root: 'bg-background' }}")
    expect(css).toContain('/* layer: moraine-component */')
    expect(css).toContain('.ui-bg-transparent{background-color:transparent;}')
    expect(css).toContain('/* layer: default */')
    expect(css).toContain(
      '.bg-background{background-color:color-mix(in srgb, var(--background) var(--un-bg-opacity), transparent);}',
    )
    expect(css).not.toContain('.bg-transparent{background-color:transparent;}')
  })

  test('hash strategy hashes only component-owned utilities and leaves user overrides raw', async () => {
    const { componentCode, consumerCode, css } = await generateComponentLayerCss('hash')

    expect(componentCode).toMatch(/mrc-[a-z0-9]+/)
    expect(componentCode).not.toContain('bg-transparent')
    console.log(componentCode)
    expect(consumerCode).toContain("classes={{ root: 'bg-background' }}")
    expect(css).toContain('/* layer: moraine-component */')
    expect(css).toMatch(/\.mrc-[a-z0-9]+\{background-color:transparent;\}/)
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
        'animate-popup-in',
        'animate-menu-in',
        'animate-menu-side-top',
        'animate-sheet-out',
        'animate-sheet-side-right',
        'animate-popover-in',
        'animate-popover-side-left',
        'animate-popup-out',
      ]),
      { preflights: true },
    )

    expect(css).toContain('@keyframes moraine-enter')
    expect(css).toContain('@keyframes moraine-exit')
    expect(css).toContain('.animate-overlay-in')
    expect(css).toContain('.animate-popup-in')
    expect(css).toContain('.animate-menu-in')
    expect(css).toContain('.animate-menu-side-top')
    expect(css).toContain('.animate-sheet-out')
    expect(css).toContain('.animate-sheet-side-right')
    expect(css).toContain('.animate-popover-in')
    expect(css).toContain('.animate-popover-side-left')
    expect(css).toContain(
      'animation:moraine-enter var(--moraine-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain(
      'animation:moraine-exit var(--moraine-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain('--moraine-enter-opacity:0')
    expect(css).toContain('--moraine-enter-scale:0.9')
    expect(css).toContain('--moraine-enter-translate-y:0.5rem')
    expect(css).toContain('--moraine-exit-translate-x:2.5rem')
    expect(css).toContain('--moraine-exit-scale:0.9')
    expect(css).not.toContain('animation:moraine-enter;}')
    expect(css).not.toContain('animation:moraine-exit;}')
    expect(css).not.toContain('@keyframes surface-in')
    expect(css).not.toContain('@keyframes menu-in')
    expect(css).not.toContain('@keyframes sheet-out')
  })

  test('provides split trigger and side animation utilities for overlays', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })

    const { css } = await generator.generate(
      new Set([
        'animate-menu-in',
        'animate-menu-out',
        'animate-menu-side-left',
        'animate-popover-in',
        'animate-popover-out',
        'animate-popover-side-top',
        'animate-tooltip-in',
        'animate-tooltip-out',
        'animate-tooltip-side-bottom',
        'animate-popup-out',
        'animate-sheet-in',
        'animate-sheet-out',
        'animate-sheet-side-right',
      ]),
      { preflights: true },
    )

    expect(css).toContain('.animate-menu-in')
    expect(css).toContain('.animate-menu-out')
    expect(css).toContain('.animate-menu-side-left')
    expect(css).toContain('--moraine-enter-scale:0.9')
    expect(css).toContain('--moraine-enter-translate-x:0.5rem')
    expect(css).toContain('--moraine-exit-scale:0.9')
    expect(css).toContain('--moraine-exit-translate-x:0.5rem')
    expect(css).toContain('.animate-popover-in')
    expect(css).toContain('.animate-popover-out')
    expect(css).toContain('.animate-popover-side-top')
    expect(css).toContain('.animate-tooltip-in')
    expect(css).toContain('.animate-tooltip-out')
    expect(css).toContain('.animate-tooltip-side-bottom')
    expect(css).toContain('.animate-popup-out')
    expect(css).toContain('.animate-sheet-in')
    expect(css).toContain('.animate-sheet-out')
    expect(css).toContain('.animate-sheet-side-right')
    expect(css).toContain(
      'animation:moraine-enter var(--moraine-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain(
      'animation:moraine-exit var(--moraine-animation-duration,150ms) ease-in-out 1',
    )
    expect(css).toContain('--moraine-enter-translate-x:2.5rem')
    expect(css).toContain('--moraine-exit-translate-x:2.5rem')
    expect(css).not.toContain('.animate-menu-in-from-left{')
    expect(css).not.toContain('.animate-menu-out-to-left{')
    expect(css).not.toContain('.animate-popover-in-from-top{')
    expect(css).not.toContain('.animate-tooltip-in-from-bottom{')
    expect(css).not.toContain('.animate-sheet-in-from-right{')
    expect(css).not.toContain('.animate-sheet-out-to-right{')
  })

  test('removes carousel inverse utilities while keeping base carousel utilities', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })

    const { css } = await generator.generate(
      new Set([
        'animate-carousel',
        'animate-carousel-rtl',
        'animate-carousel-vertical',
        'animate-carousel-inverse',
        'animate-carousel-inverse-rtl',
        'animate-carousel-inverse-vertical',
      ]),
      { preflights: true },
    )

    expect(css).toContain('.animate-carousel{')
    expect(css).toContain('.animate-carousel-rtl{')
    expect(css).toContain('.animate-carousel-vertical{')
    expect(css).toContain('@keyframes carousel')
    expect(css).toContain('@keyframes carousel-rtl')
    expect(css).toContain('@keyframes carousel-vertical')
    expect(css).not.toContain('.animate-carousel-inverse{')
    expect(css).not.toContain('.animate-carousel-inverse-rtl{')
    expect(css).not.toContain('.animate-carousel-inverse-vertical{')
    expect(css).not.toContain('@keyframes carousel-inverse')
    expect(css).not.toContain('@keyframes carousel-inverse-rtl')
    expect(css).not.toContain('@keyframes carousel-inverse-vertical')
  })

  test('uses semantic side classes with expected horizontal direction signs', async () => {
    const generator = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })

    const { css } = await generator.generate(
      new Set([
        'animate-menu-side-left',
        'animate-menu-side-right',
        'animate-popover-side-left',
        'animate-popover-side-right',
        'animate-tooltip-side-left',
        'animate-tooltip-side-right',
        'animate-sheet-side-left',
        'animate-sheet-side-right',
      ]),
      { preflights: true },
    )

    expect(css).toContain('.animate-menu-side-left')
    expect(css).toContain('.animate-menu-side-right')
    expect(css).toContain('--moraine-enter-translate-x:0.5rem')
    expect(css).toContain('--moraine-enter-translate-x:-0.5rem')
    expect(css).toContain('.animate-popover-side-left')
    expect(css).toContain('.animate-popover-side-right')
    expect(css).toContain('.animate-tooltip-side-left')
    expect(css).toContain('.animate-tooltip-side-right')
    expect(css).toContain('--moraine-enter-translate-x:0.25rem')
    expect(css).toContain('--moraine-enter-translate-x:-0.25rem')
    expect(css).toContain('.animate-sheet-side-left')
    expect(css).toContain('--moraine-enter-translate-x:-2.5rem')
    expect(css).toContain('.animate-sheet-side-right')
    expect(css).toContain('--moraine-enter-translate-x:2.5rem')
  })
})
