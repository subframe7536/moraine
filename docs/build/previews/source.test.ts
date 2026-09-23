import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { parse } from 'vite'
import { describe, expect, test, vi } from 'vitest'

import { PREVIEW_PARSE_OPTIONS } from './ast'
import { transformPreviewModule } from './module'
import { resolvePreviewComponentSource, transformPreviewSourceModule } from './source'

async function parsePreviewCode(code: string) {
  return (await parse('preview.tsx', code, PREVIEW_PARSE_OPTIONS)).program
}

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name)
    return entry.isDirectory()
      ? collectTsxFiles(filePath)
      : filePath.endsWith('.tsx')
        ? [filePath]
        : []
  })
}

test('documentation previews are self-contained in one file', async () => {
  const pagesRoot = path.resolve(__dirname, '../../pages')
  const localImports: string[] = []

  for (const filePath of collectTsxFiles(pagesRoot)) {
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
  test('reads the whole code and converts @src imports to moraine', async () => {
    const source = `import { Button } from '@src'
import type { ButtonT } from '@src'
import { For, createSignal } from 'solid-js'

export function BasicExample() {
  const [count, setCount] = createSignal(0)
  return <Button onClick={() => setCount(c => c + 1)}>Count: {count()}</Button>
}
`

    expect(await resolvePreviewComponentSource(source, parsePreviewCode)).toBe(
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
    const source = `import { useListVirtualizer } from '@src/virtualizer.ts'
import { unocssPreset } from '@src/unocss'
import { Button } from '@src/elements/button/button.tsx'
import '@src/icon.css'

export const VirtualList = () => <div />
`

    expect(await resolvePreviewComponentSource(source, parsePreviewCode)).toBe(
      `import { useListVirtualizer } from 'moraine/virtualizer'
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

    expect(await resolvePreviewComponentSource(source, parsePreviewCode)).toBe(
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

    expect(await resolvePreviewComponentSource(source, parsePreviewCode))
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
    expect(await resolvePreviewComponentSource('', parsePreviewCode)).toBeNull()
    expect(await resolvePreviewComponentSource('   \n  \t  ', parsePreviewCode)).toBeNull()
  })
})

describe('transformPreviewModule', () => {
  test('creates a default descriptor for one named component export', async () => {
    const transformed = await transformPreviewModule(
      'export function Variants() { return <div /> }',
      '/tmp/docs/pages/general/button/variants.tsx',
      parsePreviewCode,
    )

    expect(transformed).toContain("import { Variants as __Preview } from './variants.tsx'")
    expect(transformed).toContain("import __PreviewSource from './variants.tsx?preview-source'")
    expect(transformed).toContain('const component = __Preview')
    expect(transformed).toContain('export default { component, source: __PreviewSource }')
  })

  test('creates a default descriptor for one default component export', async () => {
    const transformed = await transformPreviewModule(
      'export default function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx',
      parsePreviewCode,
    )

    expect(transformed).toContain("import __Preview from './basic.tsx'")
    expect(transformed).toContain("import __PreviewSource from './basic.tsx?preview-source'")
  })

  test('ignores type-only exports when validating the component export', async () => {
    const transformed = await transformPreviewModule(
      'export interface BasicProps { label: string }\nexport function Basic() { return <div /> }',
      '/tmp/docs/pages/general/button/basic.tsx',
      parsePreviewCode,
    )

    expect(transformed).toContain("import { Basic as __Preview } from './basic.tsx'")
  })

  test('does not import the preview component during SSR', async () => {
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

  test.each([
    ['no component exports', 'const Basic = () => <div />', 0],
    [
      'multiple component exports',
      'export const Basic = () => <div />\nexport const Advanced = () => <div />',
      2,
    ],
  ])('rejects %s', async (_name, source, count) => {
    await expect(
      transformPreviewModule(source, '/tmp/docs/pages/general/button/basic.tsx', parsePreviewCode),
    ).rejects.toThrow(`expected exactly one component export in`)
    await expect(
      transformPreviewModule(source, '/tmp/docs/pages/general/button/basic.tsx', parsePreviewCode),
    ).rejects.toThrow(`found ${count}`)
  })

  test('rejects component re-exports', async () => {
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
  test('transforms ?preview-source requests to highlighted html module with converted imports', async () => {
    const source = `import { Button } from '@src'

export const BasicExample = () => <Button>basic</Button>
`
    const toHtml = vi.fn(async (value: string, lang: 'tsx') => `<pre ${lang}>${value}</pre>`)

    const transformed = await transformPreviewSourceModule(source, parsePreviewCode, toHtml)

    expect(transformed).toContain('export default ')
    expect(toHtml).toHaveBeenCalledWith(
      `import { Button } from 'moraine'

export const BasicExample = () => <Button>basic</Button>`,
      'tsx',
    )
  })

  test('returns empty html module when source is empty', async () => {
    const toHtml = vi.fn(async () => '<pre>code</pre>')

    const transformed = await transformPreviewSourceModule('   \n\t  ', parsePreviewCode, toHtml)

    expect(transformed).toBe('export default ""\n')
    expect(toHtml).not.toHaveBeenCalled()
  })
})
