import MagicString from 'magic-string'
import { createGenerator, presetWind4 } from 'unocss'
import { describe, expect, test } from 'vitest'

import { ROCK_COMPONENT_LAYER, ROCK_PREFIX, presetTheme } from './unocss-preset-theme'
import type { PresetThemeOptions } from './unocss-preset-theme'

type RockTransformer = NonNullable<ReturnType<typeof presetTheme>['transformers']>[number]
type TransformContext = Parameters<RockTransformer['transform']>[2]

function getRockTransformer(options?: number | PresetThemeOptions): RockTransformer {
  const transformer = presetTheme(options).transformers?.find(
    (item) => item.name === 'transformer-rock',
  )
  if (!transformer) {
    throw new Error('transformer-rock not found')
  }

  return transformer
}

async function runRockTransform(
  source: string,
  id: string,
  options?: number | PresetThemeOptions,
): Promise<string> {
  const transformer = getRockTransformer(options)
  if (transformer.idFilter && !transformer.idFilter(id)) {
    return source
  }

  const code = new MagicString(source)
  const context = {
    tokens: new Set<string>(),
  } as unknown as TransformContext

  await transformer.transform(code, id, context)

  return code.toString()
}

describe('presetTheme', () => {
  test('maps ROCK-prefixed tokens to rock-component layer with unprefixed selector', async () => {
    const uno = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })
    const result = await uno.generate(new Set([`${ROCK_PREFIX}text-red-500`]), {
      preflights: false,
    })

    expect(result.css).toContain(`/* layer: ${ROCK_COMPONENT_LAYER} */`)
    expect(result.css).toContain('.text-red-500{')
    expect(result.css).not.toContain(`.${ROCK_PREFIX}text-red-500{`)
  })

  test('maps ROCK-prefixed space-y token without residual prefix', async () => {
    const uno = await createGenerator({
      presets: [presetWind4(), presetTheme()],
    })
    const result = await uno.generate(new Set([`${ROCK_PREFIX}space-y-1`]), {
      preflights: false,
    })

    expect(result.css).toContain(`/* layer: ${ROCK_COMPONENT_LAYER} */`)
    expect(result.css).toContain('.space-y-1')
    expect(result.css).not.toContain(ROCK_PREFIX)
  })

  test('registers transformer-rock', () => {
    const preset = presetTheme()

    expect(preset.transformers?.some((item) => item.name === 'transformer-rock')).toBe(true)
  })

  test('registers semantic surface shortcuts', () => {
    const preset = presetTheme()
    const shortcuts = new Map((preset.shortcuts ?? []) as Array<[string, string]>)

    expect(shortcuts.get('surface-highlight')).toBe('ring-1 ring-border/50')
    expect(shortcuts.get('surface-soft')).toBe('border-transparent bg-muted/50 hover:bg-muted')
    expect(shortcuts.get('surface-subtle')).toBe('border bg-muted')
    expect(shortcuts.get('surface-ghost')).toBe('border-transparent bg-transparent hover:bg-muted')
    expect(shortcuts.get('surface-none')).toBe('border-transparent bg-transparent')
    expect(shortcuts.get('hidden-hitless')).toBe('opacity-0 pointer-events-none')
  })

  test('removes prefix globally for tsx ids', async () => {
    const output = await runRockTransform(
      `const view = <div class="${ROCK_PREFIX}a ${ROCK_PREFIX}b" />\nconst semantic = '${ROCK_PREFIX}token'`,
      'src/example.tsx?macro=1#hash',
    )

    expect(output).toContain('class="a b"')
    expect(output).toContain("const semantic = 'token'")
    expect(output).not.toContain(ROCK_PREFIX)
  })

  test('removes prefix for .class.ts by default idFilter', async () => {
    const source = `export const card = cva('${ROCK_PREFIX}p-2 ${ROCK_PREFIX}text-sm', {})`
    const output = await runRockTransform(source, 'src/example.class.ts')

    expect(output).toContain("cva('p-2 text-sm', {})")
    expect(output).not.toContain(ROCK_PREFIX)
  })

  test('removes prefix for bundled script ids by default', async () => {
    const source = `const cls = '${ROCK_PREFIX}space-y-1 ${ROCK_PREFIX}text-sm'`
    const outputJsx = await runRockTransform(source, 'node_modules/rock-ui/dist/index.jsx')
    const outputMjs = await runRockTransform(source, 'node_modules/rock-ui/dist/index.mjs?x=1#h')

    expect(outputJsx).toContain("const cls = 'space-y-1 text-sm'")
    expect(outputMjs).toContain("const cls = 'space-y-1 text-sm'")
    expect(outputJsx).not.toContain(ROCK_PREFIX)
    expect(outputMjs).not.toContain(ROCK_PREFIX)
  })

  test('custom idFilter can narrow scope', async () => {
    const source = `export const card = cva('${ROCK_PREFIX}p-2 ${ROCK_PREFIX}text-sm', {})`
    const output = await runRockTransform(source, 'src/example.class.ts', {
      idFilter: (id) => /\.tsx(?:$|[?#])/.test(id),
    })

    expect(output).toBe(source)
  })

  test('supports custom idFilter override', async () => {
    const source = `export const card = cva('${ROCK_PREFIX}p-2 ${ROCK_PREFIX}text-sm', {})`
    const output = await runRockTransform(source, 'src/example.class.ts', {
      idFilter: () => true,
    })

    expect(output).toContain("cva('p-2 text-sm', {})")
    expect(output).not.toContain(ROCK_PREFIX)
  })
})
