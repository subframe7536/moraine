import MagicString from 'magic-string'
import { describe, expect, test } from 'vitest'

import { createMigrateSyntaxTransformer, normalizeClassList } from './migrate-syntax.ts'

type MigrateTransformer = ReturnType<typeof createMigrateSyntaxTransformer>
type TransformContext = Parameters<MigrateTransformer['transform']>[2]

async function runTransform(source: string, id: string): Promise<string> {
  const transformer = createMigrateSyntaxTransformer()
  const code = new MagicString(source)
  const context = {
    tokens: new Set<string>(),
  } as unknown as TransformContext

  await transformer.transform(code, id, context)

  return code.toString()
}

describe('transformer-migrate-syntax', () => {
  test('normalizeClassList maps syntax compatibility tokens and keeps semantic tokens', () => {
    expect(
      normalizeClassList(
        'b-1 b-b-2 b-border b-transparent font-500 content-empty supports-backdrop-filter:backdrop-blur-xs not-dark:bg-clip-padding not-last:border effect-fv var-input-1.5 icon-close transition-flex-basis',
      ),
    ).toBe(
      "border border-b-2 border-border border-transparent font-medium content-[''] supports-[backdrop-filter]:backdrop-blur-xs [html:not(.dark)_&]:bg-clip-padding [&:not(:last-child)]:border effect-fv var-input-1.5 icon-close transition-flex-basis",
    )
    expect(normalizeClassList('h-$mo-collapsible-content-height')).toBe(
      'h-[var(--mo-collapsible-content-height)]',
    )
  })

  test('keeps variant-group syntax untouched for downstream transformerVariantGroup', () => {
    expect(normalizeClassList('hover:(bg-red-500 text-white)')).toBe(
      'hover:(bg-red-500 text-white)',
    )
  })

  test('migrates class literals in cva base, variants and compoundVariants.class', async () => {
    const output = await runTransform(
      `
export const card = cva('b-1 font-500', {
  variants: {
    tone: {
      neutral: 'b-border',
      quiet: 'not-dark:bg-clip-padding',
    },
  },
  compoundVariants: [{ tone: 'quiet', class: 'supports-backdrop-filter:backdrop-blur-xs b-b-2' }],
})
`,
      'src/example.class.ts',
    )

    expect(output).toContain("cva('border font-medium', {")
    expect(output).toContain("neutral: 'border-border'")
    expect(output).toContain("quiet: '[html:not(.dark)_&]:bg-clip-padding'")
    expect(output).toContain("class: 'supports-[backdrop-filter]:backdrop-blur-xs border-b-2'")
  })

  test('ignores class, cva and variant tokens in comments', async () => {
    const output = await runTransform(
      `
// class="b-1 font-500"
/* cva('b-1', { variants: { tone: { quiet: 'font-500' } } }) */
// const SIZE_VARIANT = { sm: 'b-1' }
export const card = cva('b-1', { variants: { tone: { quiet: 'font-500' } } })
`,
      'src/example.class.ts',
    )

    expect(output).toContain(`// class="b-1 font-500"`)
    expect(output).toContain(`/* cva('b-1', { variants: { tone: { quiet: 'font-500' } } }) */`)
    expect(output).toContain(`// const SIZE_VARIANT = { sm: 'b-1' }`)
    expect(output).toContain(`cva('border', { variants: { tone: { quiet: 'font-medium' } } })`)
  })

  test('migrates only class operands inside tsx class expressions', async () => {
    const output = await runTransform(
      `
const view = (
  <div class={cn('b-1 content-empty effect-fv', cond && 'not-last:b-b', local.classes?.root)}>
    <span class="font-500 supports-backdrop-filter:backdrop-blur-xs var-input-1.5 icon-close" />
  </div>
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(
      "cn('border content-[\\'\\'] effect-fv', cond && '[&:not(:last-child)]:border-b', local.classes?.root)",
    )
    expect(output).toContain(
      'class="font-medium supports-[backdrop-filter]:backdrop-blur-xs var-input-1.5 icon-close"',
    )
  })

  test('migrates class operands passed to class helper calls', async () => {
    const output = await runTransform(
      `
const view = (
  <div class={getItemClass(item, 'b-1 not-last:b-b', cond && 'font-500', classes?.item)} />
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(
      `getItemClass(item, 'border [&:not(:last-child)]:border-b', cond && 'font-medium', classes?.item)`,
    )
  })

  test('is idempotent when transformer runs multiple times', async () => {
    const source = `const view = <div class={'b-1 not-dark:bg-clip-padding'} />`
    const once = await runTransform(source, 'src/once.tsx')
    const twice = await runTransform(once, 'src/once.tsx')

    expect(once).toContain("class={'border [html:not(.dark)_&]:bg-clip-padding'}")
    expect(twice).toBe(once)
  })
})
