import { transformerVariantGroup } from '@subf/unocss'
import MagicString from 'magic-string'
import { describe, expect, test } from 'vitest'

import { injectCompileClassTrigger, transformerInjectCompileClass } from './inject-compile-class'

const TEST_TRIGGER = ':uno-test:'

async function runTransform(source: string, id: string): Promise<string> {
  const variantGroupTransformer = transformerVariantGroup()
  const transformer = transformerInjectCompileClass({
    trigger: TEST_TRIGGER,
    beforeTransform(code, nextId, context) {
      variantGroupTransformer.transform(code, nextId, context)
    },
  })
  const code = new MagicString(source)

  await transformer.transform(code, id, {
    tokens: new Set<string>(),
  } as any)

  return code.toString()
}

describe('transformer-inject-compile-class', () => {
  test('injectCompileClassTrigger is idempotent and ignores empty values', () => {
    expect(injectCompileClassTrigger('text-sm font-medium', TEST_TRIGGER)).toBe(
      `${TEST_TRIGGER} text-sm font-medium`,
    )
    expect(injectCompileClassTrigger(`${TEST_TRIGGER} text-sm font-medium`, TEST_TRIGGER)).toBe(
      `${TEST_TRIGGER} text-sm font-medium`,
    )
    expect(injectCompileClassTrigger('   ', TEST_TRIGGER)).toBe('   ')
  })

  test('flattens variant groups before injecting trigger', async () => {
    const output = await runTransform(
      `const view = <div class="hover:(bg-red text-white) text-sm" />`,
      'src/example.tsx',
    )

    expect(output).toContain(`class="${TEST_TRIGGER} hover:bg-red hover:text-white text-sm"`)
    expect(output).not.toContain('hover:(')
  })

  test('injects trigger in cva base, variants and compoundVariants.class only', async () => {
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

    expect(output).toContain(`cva('${TEST_TRIGGER} p-2 text-sm', {`)
    expect(output).toContain(`table: '${TEST_TRIGGER} rounded border'`)
    expect(output).toContain(`list: '${TEST_TRIGGER} text-xs'`)
    expect(output).toContain(`true: '${TEST_TRIGGER} opacity-50'`)
    expect(output).toContain(`class: '${TEST_TRIGGER} ring-1 ring-border'`)
    expect(output).not.toContain(`${TEST_TRIGGER} table`)
    expect(output).not.toContain(`${TEST_TRIGGER} md`)
  })

  test('injects only component-owned class operands inside tsx expressions', async () => {
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
        cn('keep raw', local.classes?.root),
      )}
    />
    <i class="plain static" />
  </div>
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(
      `cn('${TEST_TRIGGER} a b', cond && '${TEST_TRIGGER} c', local.variant === 'table' && '${TEST_TRIGGER} d')`,
    )
    expect(output).toContain(`'${TEST_TRIGGER} x y'`)
    expect(output).toContain(`cond && '${TEST_TRIGGER} z'`)
    expect(output).toContain(`cn('keep raw', local.classes?.root)`)
    expect(output).toContain(`<i class="${TEST_TRIGGER} plain static" />`)
    expect(output).not.toContain(`${TEST_TRIGGER} table`)
    expect(output).not.toContain(`${TEST_TRIGGER} md`)
    expect(output).not.toContain(`${TEST_TRIGGER} sm`)
  })

  test('skips template literals with interpolation in class expressions', async () => {
    const output = await runTransform(
      `const view = <div class={\`text-sm \${active ? 'font-medium' : 'font-bold'}\`} />`,
      'src/example.tsx',
    )

    expect(output).toContain(`class={\`text-sm \${active ? 'font-medium' : 'font-bold'}\`}`)
    expect(output).not.toContain(`${TEST_TRIGGER} text-sm`)
  })

  test('injects trigger into class operands passed to class helper calls', async () => {
    const output = await runTransform(
      `
const view = (
  <div class={getItemClass(item, 'data-expanded:bg-accent', cond && 'text-sm', classes?.item)} />
)
`,
      'src/example.tsx',
    )

    expect(output).toContain(
      `getItemClass(item, '${TEST_TRIGGER} data-expanded:bg-accent', cond && '${TEST_TRIGGER} text-sm', classes?.item)`,
    )
  })

  test('is idempotent when transformer runs multiple times', async () => {
    const source = `const view = <div class={'${TEST_TRIGGER} text-sm'} />`
    const once = await runTransform(source, 'src/once.tsx')
    const twice = await runTransform(once, 'src/once.tsx')

    expect(twice).toBe(once)
  })
})
