import { parse } from 'vite'
import { describe, expect, test, vi } from 'vitest'

import { EXAMPLE_PARSE_OPTIONS } from './ast.ts'
import { transformExampleModule } from './module.ts'
import { resolveExampleComponentSource, transformExampleSourceModule } from './source.ts'

async function parseExampleCode(code: string) {
  return (await parse('example.tsx', code, EXAMPLE_PARSE_OPTIONS)).program
}

describe('resolveExampleComponentSource', () => {
  test('reads the whole code and converts @src imports to moraine', async () => {
    const source = `import { Button } from '@src'
import type { ButtonT } from '@src'
import { For, createSignal } from 'solid-js'

export function BasicExample() {
  const [count, setCount] = createSignal(0)
  return <Button onClick={() => setCount(c => c + 1)}>Count: {count()}</Button>
}
`

    expect(await resolveExampleComponentSource(source, 'BasicExample', parseExampleCode)).toBe(
      `import { Button } from 'moraine'
import type { ButtonT } from 'moraine'
import { For, createSignal } from 'solid-js'

export function BasicExample() {
  const [count, setCount] = createSignal(0)
  return <Button onClick={() => setCount(c => c + 1)}>Count: {count()}</Button>
}`,
    )
  })

  test('converts subpath imports (@src/utils.ts, @src/unocss, @src/elements/...)', async () => {
    const source = `import { useListVirtualizer } from '@src/utils.ts'
import { unocssPreset } from '@src/unocss'
import { Button } from '@src/elements/button/button.tsx'
import '@src/icon.css'

export const VirtualList = () => <div />
`

    expect(await resolveExampleComponentSource(source, 'VirtualList', parseExampleCode)).toBe(
      `import { useListVirtualizer } from 'moraine/utils'
import { unocssPreset } from 'moraine/unocss'
import { Button } from 'moraine'
import 'moraine/icon.css'

export const VirtualList = () => <div />`,
    )
  })

  test('preserves double quotes when rewriting imports', async () => {
    const source = `import { Button } from "@src"
import type { ButtonT } from "@src"

export function Example() {
  return <Button />
}
`

    expect(await resolveExampleComponentSource(source, 'Example', parseExampleCode)).toBe(
      `import { Button } from "moraine"
import type { ButtonT } from "moraine"

export function Example() {
  return <Button />
}`,
    )
  })

  test('preserves top-level helper functions, types, and comments outside component', async () => {
    const source = `import { Button } from '@src'
import { createSignal } from 'solid-js'

// Helper function
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type Size = 'sm' | 'md'

export function LoadingExample() {
  return <div>loading</div>
}
`

    expect(await resolveExampleComponentSource(source, 'LoadingExample', parseExampleCode))
      .toBe(`import { Button } from 'moraine'
import { createSignal } from 'solid-js'

// Helper function
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type Size = 'sm' | 'md'

export function LoadingExample() {
  return <div>loading</div>
}`)
  })

  test('returns null for empty or whitespace-only source', async () => {
    expect(await resolveExampleComponentSource('', 'Example', parseExampleCode)).toBeNull()
    expect(await resolveExampleComponentSource('   \n  \t  ', 'Example', parseExampleCode)).toBeNull()
  })
})

describe('transformExampleModule', () => {
  test('creates a default descriptor for one named component export', async () => {
    const transformed = await transformExampleModule(
      'export function Variants() { return <div /> }',
      '/tmp/docs/pages/general/button/variants.tsx?example',
      parseExampleCode,
    )

    expect(transformed).toContain("import { Variants as __Example } from './variants.tsx'")
    expect(transformed).toContain(
      "import __ExampleSource from './variants.tsx?example-source&name=Variants'",
    )
    expect(transformed).toContain('const component = __Example')
    expect(transformed).toContain('export default { component, source: __ExampleSource }')
  })

  test('creates a default descriptor for one default component export', async () => {
    const transformed = await transformExampleModule(
      'export default function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx?example',
      parseExampleCode,
    )

    expect(transformed).toContain("import __Example from './basic.tsx'")
    expect(transformed).toContain(
      "import __ExampleSource from './basic.tsx?example-source&name=default'",
    )
  })

  test('ignores type-only exports when validating the component export', async () => {
    const transformed = await transformExampleModule(
      'export interface BasicProps { label: string }\nexport function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx?example',
      parseExampleCode,
    )

    expect(transformed).toContain("import { Basic as __Example } from './basic.tsx'")
  })

  test('does not import the example component during SSR', async () => {
    const transformed = await transformExampleModule(
      'export function Variants() { return <div /> }',
      '/tmp/docs/pages/general/button/variants.tsx?example',
      parseExampleCode,
      { ssr: true },
    )

    expect(transformed).not.toContain("from './variants.tsx'\n")
    expect(transformed).toContain('const component = () => null')
    expect(transformed).toContain('?example-source&name=Variants')
  })

  test.each([
    ['no component exports', 'const Basic = () => <div />', 0],
    [
      'multiple component exports',
      'export const Basic = () => <div />\nexport const Advanced = () => <div />',
      2,
    ],
  ])('rejects %s', async (_name, source, count) => {
    await expect(
      transformExampleModule(
        source,
        '/tmp/docs/pages/general/button/basic.tsx?example',
        parseExampleCode,
      ),
    ).rejects.toThrow(`expected exactly one component export in`)
    await expect(
      transformExampleModule(
        source,
        '/tmp/docs/pages/general/button/basic.tsx?example',
        parseExampleCode,
      ),
    ).rejects.toThrow(`found ${count}`)
  })

  test('rejects component re-exports', async () => {
    await expect(
      transformExampleModule(
        "export { Basic } from './basic-impl'",
        '/tmp/docs/pages/general/button/basic.tsx?example',
        parseExampleCode,
      ),
    ).rejects.toThrow('re-exported components are not supported')
  })
})

describe('transformExampleSourceModule', () => {
  test('transforms ?example-source requests to highlighted html module with converted imports', async () => {
    const source = `import { Button } from '@src'

export const BasicExample = () => <Button>basic</Button>
`
    const toHtml = vi.fn(async (value: string, lang: 'tsx') => `<pre ${lang}>${value}</pre>`)

    const transformed = await transformExampleSourceModule(
      source,
      '/tmp/docs/examples/button/basic.tsx?example-source&name=BasicExample',
      parseExampleCode,
      toHtml,
    )

    expect(transformed).toContain('export default ')
    expect(toHtml).toHaveBeenCalledWith(
      `import { Button } from 'moraine'

export const BasicExample = () => <Button>basic</Button>`,
      'tsx',
    )
  })

  test('ignores non source-query modules', async () => {
    const transformed = await transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx',
      parseExampleCode,
      vi.fn(async () => '<pre>code</pre>'),
    )

    expect(transformed).toBeNull()
  })

  test('returns empty html module when source is empty', async () => {
    const toHtml = vi.fn(async () => '<pre>code</pre>')

    const transformed = await transformExampleSourceModule(
      '   \n\t  ',
      '/tmp/docs/examples/button/basic.tsx?example-source',
      parseExampleCode,
      toHtml,
    )

    expect(transformed).toBe('export default ""\n')
    expect(toHtml).not.toHaveBeenCalled()
  })
})
