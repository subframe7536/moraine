import { parseSync } from 'vite'
import { describe, expect, test, vi } from 'vitest'

import { EXAMPLE_PARSE_OPTIONS } from './ast'
import { transformExampleModule } from './module'
import { resolveExampleComponentSource, transformExampleSourceModule } from './source'

function parseExampleCode(code: string) {
  return parseSync('example.tsx', code, EXAMPLE_PARSE_OPTIONS).program
}

describe('resolveExampleComponentSource', () => {
  test('extracts named arrow component declaration', () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`

    expect(resolveExampleComponentSource(source, 'BasicExample', parseExampleCode)).toBe(
      'const BasicExample = () => <div>basic</div>',
    )
  })

  test('extracts named function component declaration', () => {
    const source = `
function LoadingExample() {
  return <div>loading</div>
}
`

    expect(resolveExampleComponentSource(source, 'LoadingExample', parseExampleCode))
      .toBe(`function LoadingExample() {
  return <div>loading</div>
}`)
  })

  test('returns null for missing component', () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`

    expect(resolveExampleComponentSource(source, 'MissingExample', parseExampleCode)).toBeNull()
  })
})

describe('transformExampleModule', () => {
  test('wraps named exports with docs demo source imports', () => {
    const transformed = transformExampleModule(
      'export function Variants() { return <div /> }',
      '/tmp/docs/pages/general/button/variants.tsx?example',
      parseExampleCode,
    )

    expect(transformed).toContain("import { Variants as __Variants } from './variants.tsx'")
    expect(transformed).toContain(
      "import __DemoButtonVariantsSource from './variants.tsx?example-source&name=Variants'",
    )
    expect(transformed).toContain(
      'export const DemoButtonVariants = createDocsDemo(__Variants, __DemoButtonVariantsSource)',
    )
  })

  test('wraps default exports with default source imports', () => {
    const transformed = transformExampleModule(
      'export default function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx?example',
      parseExampleCode,
    )

    expect(transformed).toContain("import __DefaultExample from './basic.tsx'")
    expect(transformed).toContain(
      "import __DemoButtonBasicSource from './basic.tsx?example-source&name=default'",
    )
    expect(transformed).toContain(
      'export default createDocsDemo(__DefaultExample, __DemoButtonBasicSource)',
    )
  })
})

describe('transformExampleSourceModule', () => {
  test('transforms ?example-source requests to highlighted html module', () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`
    const toHtml = vi.fn((value: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${value}</pre>`)

    const transformed = transformExampleSourceModule(
      source,
      '/tmp/docs/examples/button/basic.tsx?example-source&name=BasicExample',
      parseExampleCode,
      toHtml,
    )

    expect(transformed).toContain('export default ')
    expect(toHtml).toHaveBeenCalledWith('const BasicExample = () => <div>basic</div>', 'tsx')
  })

  test('ignores non source-query modules', () => {
    const transformed = transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx',
      parseExampleCode,
      vi.fn(() => '<pre>code</pre>'),
    )

    expect(transformed).toBeNull()
  })

  test('returns empty html module when component does not exist', () => {
    const toHtml = vi.fn(() => '<pre>code</pre>')

    const transformed = transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx?example-source&name=MissingExample',
      parseExampleCode,
      toHtml,
    )

    expect(transformed).toBe('export default ""\n')
    expect(toHtml).not.toHaveBeenCalled()
  })
})
