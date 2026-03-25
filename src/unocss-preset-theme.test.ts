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

    expect(componentCode).toMatch(/rkc-[a-z0-9]+/)
    expect(componentCode).not.toContain('bg-transparent')
    expect(consumerCode).toContain("classes={{ root: 'bg-background' }}")
    expect(css).toContain('/* layer: flint-component */')
    expect(css).toMatch(/\.rkc-[a-z0-9]+\{background-color:transparent;\}/)
    expect(css).toContain('/* layer: default */')
    expect(css).toContain(
      '.bg-background{background-color:color-mix(in srgb, var(--background) var(--un-bg-opacity), transparent);}',
    )
    expect(css).not.toContain('.bg-transparent{background-color:transparent;}')
  })
})
