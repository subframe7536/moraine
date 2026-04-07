import MagicString from 'magic-string'
import { transformerVariantGroup } from 'unocss'
import { describe, expect, test } from 'vitest'

import { transformerInjectPrefix, prefixClassList } from './inject-prefix'

const TEST_PREFIX = 'mo-'

async function runTransform(source: string, id: string): Promise<string> {
  const variantGroupTransformer = transformerVariantGroup()
  const transformer = transformerInjectPrefix({
    prefix: TEST_PREFIX,
    beforeTransform(code, id, context) {
      variantGroupTransformer.transform(code, id, context)
    },
  })
  const code = new MagicString(source)

  await transformer.transform(code, id, {
    tokens: new Set<string>(),
  } as any)

  return code.toString()
}

describe('transformer-inject-moraine-prefix', () => {
  test('prefixClassList is idempotent and ignores empty tokens', () => {
    expect(prefixClassList(`${TEST_PREFIX}a b   c`, TEST_PREFIX)).toBe(
      `${TEST_PREFIX}a ${TEST_PREFIX}b ${TEST_PREFIX}c`,
    )
    expect(prefixClassList('   ', TEST_PREFIX)).toBe('   ')
  })

  test('flattens variant groups before prefixing', async () => {
    const output = await runTransform(
      `const view = <div class="hover:(bg-red text-white) text-sm" />`,
      'src/example.tsx',
    )

    expect(output).toContain(
      `class="${TEST_PREFIX}hover:bg-red ${TEST_PREFIX}hover:text-white ${TEST_PREFIX}text-sm"`,
    )
    expect(output).not.toContain('hover:(')
  })

  test('supports ids with query strings', async () => {
    const output = await runTransform(
      `const view = <div class="hover:(bg-red text-white) text-sm" />`,
      'src/example.tsx?t=12345',
    )

    expect(output).toContain(
      `class="${TEST_PREFIX}hover:bg-red ${TEST_PREFIX}hover:text-white ${TEST_PREFIX}text-sm"`,
    )
  })

  test('prefixes class strings with escaped quotes', async () => {
    const output = await runTransform(
      `const view = <div class={'a \\'b\\' c'} />`,
      'src/example.tsx',
    )

    expect(output).toContain(`class={'${TEST_PREFIX}a ${TEST_PREFIX}\\'b\\' ${TEST_PREFIX}c'}`)
  })

  test('normalizes id before applying custom idFilter', async () => {
    const transformer = transformerInjectPrefix({
      prefix: TEST_PREFIX,
      idFilter: (id) => id.endsWith('.tsx'),
    })

    expect(transformer.idFilter?.('src/example.tsx?t=12345')).toBe(true)
    expect(transformer.idFilter?.('src/example.ts?worker')).toBe(false)
  })

  test('prefixes class strings in cva base, variants and compoundVariants.class only', async () => {
    const output = await runTransform(
      `
export const card = cva('p-2 text-sm', {
  defaultVariants: {
    variant: 'table',
    size: 'md',
  },
  variants: {
    variant: {
      table: 'rounded border',
      list: 'text-xs',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  compoundVariants: [
    { variant: 'table', size: 'md', class: 'ring-1 ring-border' },
  ],
})
`,
      'src/example.class.ts',
    )

    expect(output).toContain(`cva('${TEST_PREFIX}p-2 ${TEST_PREFIX}text-sm', {`)
    expect(output).toContain(`table: '${TEST_PREFIX}rounded ${TEST_PREFIX}border'`)
    expect(output).toContain(`list: '${TEST_PREFIX}text-xs'`)
    expect(output).toContain(`true: '${TEST_PREFIX}opacity-50'`)
    expect(output).toContain(`class: '${TEST_PREFIX}ring-1 ${TEST_PREFIX}ring-border'`)
    expect(output).toContain("defaultVariants: {\n    variant: 'table',\n    size: 'md',")
    expect(output).toContain(
      `{ variant: 'table', size: 'md', class: '${TEST_PREFIX}ring-1 ${TEST_PREFIX}ring-border' }`,
    )
    expect(output).not.toContain(`${TEST_PREFIX}table`)
    expect(output).not.toContain(`${TEST_PREFIX}md`)
  })

  test('prefixes class strings inside standalone *VARIANT constants', async () => {
    const output = await runTransform(
      `
export const SIZE_VARIANT = {
  sm: 'text-sm',
  md: 'text-base',
} as const
`,
      'src/example.class.ts',
    )

    expect(output).toContain(`sm: '${TEST_PREFIX}text-sm'`)
    expect(output).toContain(`md: '${TEST_PREFIX}text-base'`)
    expect(output).not.toContain(`${TEST_PREFIX}sm`)
    expect(output).not.toContain(`${TEST_PREFIX}md`)
  })

  test('prefixes only class operands inside tsx class expressions', async () => {
    const output = await runTransform(
      `
const view = (
  <div
    class={cn('a b', cond && 'c', local.variant === 'table' && 'd')}
  >
    <span
      class={fooVariants(
        { size: local.variant === 'table' ? 'md' : 'sm' },
        'x y',
        cond && 'z',
        local.classes?.root,
      )}
    />
    <i class="plain static" />
  </div>
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(
      `cn('${TEST_PREFIX}a ${TEST_PREFIX}b', cond && '${TEST_PREFIX}c', local.variant === 'table' && '${TEST_PREFIX}d')`,
    )
    expect(output).toContain(
      `fooVariants(\n        { size: local.variant === 'table' ? 'md' : 'sm' },\n        '${TEST_PREFIX}x ${TEST_PREFIX}y',\n        cond && '${TEST_PREFIX}z',\n        local.classes?.root,`,
    )
    expect(output).toContain(`<i class="${TEST_PREFIX}plain ${TEST_PREFIX}static" />`)
    expect(output).not.toContain(`${TEST_PREFIX}table`)
    expect(output).not.toContain(`${TEST_PREFIX}md`)
    expect(output).not.toContain(`${TEST_PREFIX}sm`)
  })

  test('skips cn operands inside *Variants classes arguments', async () => {
    const output = await runTransform(
      `
const view = (
  <div
    class={fooVariants(
      { size: local.variant === 'table' ? 'md' : 'sm' },
      cn('x y', cond && 'z', local.classes?.root),
      'k l',
    )}
  />
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(`cn('x y', cond && 'z', local.classes?.root)`)
    expect(output).toContain(`'${TEST_PREFIX}k ${TEST_PREFIX}l'`)
    expect(output).not.toContain(`'${TEST_PREFIX}x ${TEST_PREFIX}y'`)
    expect(output).not.toContain(`cond && '${TEST_PREFIX}z'`)
    expect(output).not.toContain(`${TEST_PREFIX}table`)
    expect(output).not.toContain(`${TEST_PREFIX}md`)
    expect(output).not.toContain(`${TEST_PREFIX}sm`)
  })

  test('prefixes class operands passed to class helper calls', async () => {
    const output = await runTransform(
      `
const view = (
  <div class={getItemClass(item, 'data-expanded:bg-accent', cond && 'text-sm', classes?.item)} />
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(
      `getItemClass(item, '${TEST_PREFIX}data-expanded:bg-accent', cond && '${TEST_PREFIX}text-sm', classes?.item)`,
    )
  })

  test('is idempotent when transformer runs multiple times', async () => {
    const source = `const view = <div class={'${TEST_PREFIX}a b'} />`
    const once = await runTransform(source, 'src/once.tsx')
    const twice = await runTransform(once, 'src/once.tsx')

    expect(once).toContain(`class={'${TEST_PREFIX}a ${TEST_PREFIX}b'}`)
    expect(twice).toBe(once)
  })

  test('does not crash when matching cva calls', async () => {
    await expect(
      runTransform(
        "export const value = cva('p-2', { variants: { size: { sm: 'text-sm' } } })",
        'src/regression.class.ts',
      ),
    ).resolves.toContain(
      `cva('${TEST_PREFIX}p-2', { variants: { size: { sm: '${TEST_PREFIX}text-sm' } } })`,
    )
  })
})
