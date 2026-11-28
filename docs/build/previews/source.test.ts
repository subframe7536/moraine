import { readFileSync, readdirSync } from 'node:fs'

import path from 'pathe'
import { parse } from 'vite'
import { describe, expect, vi, it } from 'vitest'

import { PREVIEW_PARSE_OPTIONS } from './ast.ts'
import { transformPreviewModule } from './module.ts'
import { resolvePreviewComponentSource, transformPreviewSourceModule } from './source.ts'
async function parsePreviewCode(code: string) {
  return (await parse('preview.tsx', code, PREVIEW_PARSE_OPTIONS)).program
}

function collectTsxFiles(directory: string): Array<string> {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name)
    return entry.isDirectory()
      ? collectTsxFiles(filePath)
      : filePath.endsWith('.tsx')
        ? [filePath]
        : []
  })
}

it('documentation previews are self-contained in one file', async () => {
  const pagesRoot = path.resolve(__dirname, '../../pages')
  const localImports: Array<string> = []

  // `playground.tsx` hosts the docs-only Playground UI and is never a Preview source.
  const previewFiles = collectTsxFiles(pagesRoot).filter(
    (filePath) => path.basename(filePath) !== 'playground.tsx',
  )
  for (const filePath of previewFiles) {
    const source = readFileSync(filePath, 'utf8')
    const program = await parsePreviewCode(source)
    if (/\b(?:import|require)\s*\(\s*['"]\./u.test(source)) {
      localImports.push(`${path.relative(pagesRoot, filePath)}: dynamic local import`)
    }
    for (const statement of program.body) {
      if (
        statement.type !== 'ImportDeclaration' &&
        statement.type !== 'ExportNamedDeclaration' &&
        statement.type !== 'ExportAllDeclaration'
      ) {
        continue
      }
      const specifier = statement.source?.value
      if (typeof specifier === 'string' && specifier.startsWith('.')) {
        localImports.push(`${path.relative(pagesRoot, filePath)}: ${specifier}`)
      }
    }
  }

  expect(localImports).toEqual([])
})

describe('resolvePreviewComponentSource', () => {
  it('reads the whole code and converts @src imports to moraine', async () => {
    const source = `import { Button } from '@src'
import type { ButtonT } from '@src'
import {For, createSignal} from 'solid-js'
export function BasicExample() {
  const [count, setCount] = createSignal(0)
  return <Button onClick={() => setCount(c => c + 1)}>Count: {count()}</Button>
}
`

    expect(await resolvePreviewComponentSource(source, parsePreviewCode)).toBe(
      `import { Button } from 'moraine'
import type { ButtonT } from 'moraine'
import {For, createSignal} from 'solid-js'
export function BasicExample() {
  const [count, setCount] = createSignal(0)
  return <Button onClick={() => setCount(c => c + 1)}>Count: {count()}</Button>
}`,
    )
  })

  it('converts subpath imports (@src/utils.ts, @src/theme/unocss, @src/element/...)', async () => {
    const source = `import { createListVirtualizer } from '@src/virtualizer/index.ts'
import { DataTable } from '@src/data-table'
import { presetMoraine } from '@src/theme/unocss'
import { Button } from '@src/element/button/button.tsx'
import '@src/icon.css'
export const VirtualList = () => <div />
`

    expect(await resolvePreviewComponentSource(source, parsePreviewCode)).toBe(
      `import { createListVirtualizer } from 'moraine/virtualizer'
import { DataTable } from 'moraine/data-table'
import { presetMoraine } from 'moraine/unocss'
import { Button } from 'moraine'
import 'moraine/icon.css'
export const VirtualList = () => <div />`,
    )
  })

  it('preserves double quotes when rewriting imports', async () => {
    const source = `import { Button } from "@src"
import type { ButtonT } from "@src"
export function Example() {
  return <Button />
}
`

    expect(await resolvePreviewComponentSource(source, parsePreviewCode)).toBe(
      `import { Button } from "moraine"
import type { ButtonT } from "moraine"
export function Example() {
  return <Button />
}`,
    )
  })

  it('preserves top-level helper functions, types, and comments outside component', async () => {
    const source = `import { Button } from '@src'


// Helper function
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type Size = 'sm' | 'md'

export function LoadingExample() {
  return <div>loading</div>
}
`

    expect(await resolvePreviewComponentSource(source, parsePreviewCode))
      .toBe(`import { Button } from 'moraine'


// Helper function
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type Size = 'sm' | 'md'

export function LoadingExample() {
  return <div>loading</div>
}`)
  })

  it('returns null for empty or whitespace-only source', async () => {
    expect(await resolvePreviewComponentSource('', parsePreviewCode)).toBeNull()
    expect(await resolvePreviewComponentSource('   \n  \t  ', parsePreviewCode)).toBeNull()
  })
})

describe('transformPreviewModule', () => {
  it('renders the preview block for one named component export', async () => {
    const transformed = await transformPreviewModule(
      'export function Variants() { return <div /> }',
      '/tmp/docs/pages/general/button/variants.tsx',
      parsePreviewCode,
    )

    expect(transformed).toContain("import { Variants as __Preview } from './variants.tsx'")
    expect(transformed).toContain("import __PreviewSource from './variants.tsx?preview-source'")
    expect(transformed).toContain('const component = __Preview')
    expect(transformed).toContain(
      'return createComponent(DocsPreview, { component, source: __PreviewSource })',
    )
  })

  it('renders the preview block for one default component export', async () => {
    const transformed = await transformPreviewModule(
      'export default function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx',
      parsePreviewCode,
    )

    expect(transformed).toContain("import __Preview from './basic.tsx'")
    expect(transformed).toContain("import __PreviewSource from './basic.tsx?preview-source'")
  })

  it('ignores type-only exports when validating the component export', async () => {
    const transformed = await transformPreviewModule(
      'export interface BasicProps { label: string }\nexport function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx',
      parsePreviewCode,
    )

    expect(transformed).toContain("import { Basic as __Preview } from './basic.tsx'")
  })

  it('does not import the preview component during SSR', async () => {
    const transformed = await transformPreviewModule(
      'export function Variants() { return <div /> }',
      '/tmp/docs/pages/general/button/variants.tsx',
      parsePreviewCode,
      { ssr: true },
    )

    expect(transformed).not.toContain("from './variants.tsx'\n")
    expect(transformed).toContain('const component = () => null')
    expect(transformed).toContain('?preview-source')
  })

  it.each([
    ['no component exports', 'const Basic = () => <div />', 0],
    [
      'multiple component exports',
      'export const Basic = () => <div />\nexport const Advanced = () => <div />',
      2,
    ],
  ])('rejects %s', async (_name, source, count) => {
    await expect(
      transformPreviewModule(source, '/tmp/docs/pages/general/button/basic.tsx', parsePreviewCode),
    ).rejects.toThrow(
      `expected exactly one component export in /tmp/docs/pages/general/button/basic.tsx, found ${count}`,
    )
  })

  it('rejects component re-exports', async () => {
    await expect(
      transformPreviewModule(
        "export { Basic } from './basic-impl'",
        '/tmp/docs/pages/general/button/basic.tsx',
        parsePreviewCode,
      ),
    ).rejects.toThrow('re-exported components are not supported')
  })
})

describe('transformPreviewSourceModule', () => {
  it('transforms ?preview-source requests to highlighted html module with converted imports', async () => {
    const source = `import { Button } from '@src'

export const BasicExample = () => <Button>basic</Button>
`
    const toHtml = vi.fn<(value: string, lang: 'tsx') => any>(
      async (value, lang) => `<pre ${lang}>${value}</pre>`,
    )

    const transformed = await transformPreviewSourceModule(source, parsePreviewCode, toHtml)

    expect(transformed).toContain('export default ')
    expect(transformed).toContain('"html":')
    expect(transformed).toContain('"code":')
    expect(toHtml).toHaveBeenCalledWith(
      `import { Button } from 'moraine'

export const BasicExample = () => <Button>basic</Button>`,
      'tsx',
    )
  })

  it('returns empty html module when source is empty', async () => {
    const toHtml = vi.fn<() => any>(async () => '<pre>code</pre>')

    const transformed = await transformPreviewSourceModule('   \n\t  ', parsePreviewCode, toHtml)

    expect(transformed).toBe('export default { html: "", code: "" }\n')
    expect(toHtml).not.toHaveBeenCalled()
  })
})
