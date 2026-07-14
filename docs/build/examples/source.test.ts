import { parse } from 'vite'
import { describe, expect, test, vi } from 'vitest'

import { EXAMPLE_PARSE_OPTIONS } from './ast'
import { transformExampleModule } from './module'
import { resolveExampleComponentSource, transformExampleSourceModule } from './source'

async function parseExampleCode(code: string) {
  return (await parse('example.tsx', code, EXAMPLE_PARSE_OPTIONS)).program
}

describe('resolveExampleComponentSource', () => {
  test('extracts named arrow component declaration', async () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`

    expect(await resolveExampleComponentSource(source, 'BasicExample', parseExampleCode)).toBe(
      'const BasicExample = () => <div>basic</div>',
    )
  })

  test('extracts named function component declaration', async () => {
    const source = `
function LoadingExample() {
  return <div>loading</div>
}
`

    expect(await resolveExampleComponentSource(source, 'LoadingExample', parseExampleCode))
      .toBe(`function LoadingExample() {
  return <div>loading</div>
}`)
  })

  test('returns null for missing component', async () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`

    expect(
      await resolveExampleComponentSource(source, 'MissingExample', parseExampleCode),
    ).toBeNull()
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
  test('transforms ?example-source requests to highlighted html module', async () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`
    const toHtml = vi.fn((value: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${value}</pre>`)

    const transformed = await transformExampleSourceModule(
      source,
      '/tmp/docs/examples/button/basic.tsx?example-source&name=BasicExample',
      parseExampleCode,
      toHtml,
    )

    expect(transformed).toContain('export default ')
    expect(toHtml).toHaveBeenCalledWith('const BasicExample = () => <div>basic</div>', 'tsx')
  })

  test('ignores non source-query modules', async () => {
    const transformed = await transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx',
      parseExampleCode,
      vi.fn(() => '<pre>code</pre>'),
    )

    expect(transformed).toBeNull()
  })

  test('returns empty html module when component does not exist', async () => {
    const toHtml = vi.fn(() => '<pre>code</pre>')

    const transformed = await transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx?example-source&name=MissingExample',
      parseExampleCode,
      toHtml,
    )

    expect(transformed).toBe('export default ""\n')
    expect(toHtml).not.toHaveBeenCalled()
  })
})
