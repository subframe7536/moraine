import { describe, expect, test, vi } from 'vitest'

import { resolveExampleComponentSource, transformExampleSourceModule } from './source'

describe('resolveExampleComponentSource', () => {
  test('extracts named arrow component declaration', () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`

    expect(resolveExampleComponentSource(source, 'BasicExample')).toBe(
      'const BasicExample = () => <div>basic</div>',
    )
  })

  test('extracts named function component declaration', () => {
    const source = `
function LoadingExample() {
  return <div>loading</div>
}
`

    expect(resolveExampleComponentSource(source, 'LoadingExample'))
      .toBe(`function LoadingExample() {
  return <div>loading</div>
}`)
  })

  test('returns null for missing component', () => {
    const source = `
export const BasicExample = () => <div>basic</div>
`

    expect(resolveExampleComponentSource(source, 'MissingExample')).toBeNull()
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
      toHtml,
    )

    expect(transformed).toContain('export default ')
    expect(toHtml).toHaveBeenCalledWith('const BasicExample = () => <div>basic</div>', 'tsx')
  })

  test('ignores non source-query modules', () => {
    const transformed = transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx',
      vi.fn(() => '<pre>code</pre>'),
    )

    expect(transformed).toBeNull()
  })

  test('returns empty html module when component does not exist', () => {
    const toHtml = vi.fn(() => '<pre>code</pre>')

    const transformed = transformExampleSourceModule(
      'export const BasicExample = () => <div>basic</div>',
      '/tmp/docs/examples/button/basic.tsx?example-source&name=MissingExample',
      toHtml,
    )

    expect(transformed).toBe('export default ""\n')
    expect(toHtml).not.toHaveBeenCalled()
  })
})
