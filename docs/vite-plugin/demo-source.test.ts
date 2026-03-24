import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { transformDemoSource } from './demo-source'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'rock-ui-demo-source-'))
}

async function writeComponentApiDoc(
  projectRoot: string,
  componentKey: string,
  data: Record<string, unknown>,
): Promise<void> {
  const apiDir = path.join(projectRoot, 'docs', 'api-doc', 'components')
  await mkdir(apiDir, { recursive: true })
  await writeFile(path.join(apiDir, `${componentKey}.json`), JSON.stringify(data), 'utf8')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('transformDemoSource', () => {
  test('injects DemoSection code prop from named arrow demo component', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn((source: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${source}</pre>`)

    const source = `
import { DemoSection } from '../components/demo-section'

const helperText = 'helper'

export const BasicDemo = () => <div>{helperText}</div>

export default () => (
  <DemoSection title="Basic" description="desc" demo={BasicDemo} />
)
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/general/sample-demos.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).toContain('code={')
    expect(toHTML).toHaveBeenCalledWith(
      'export const BasicDemo = () => <div>{helperText}</div>',
      'tsx',
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('injects DemoSection code prop from named function demo component', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn((source: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${source}</pre>`)

    const source = `
import { DemoSection } from '../components/demo-section'

function BasicDemo() {
  return <div>demo</div>
}

export default () => (
  <DemoSection title="Basic" description="desc" demo={BasicDemo} />
)
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/general/sample-demos.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).toContain('code={')
    expect(toHTML).toHaveBeenCalledWith(
      `function BasicDemo() {
  return <div>demo</div>
}`,
      'tsx',
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('warns and skips DemoSection code injection when demo is not an identifier', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn((source: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${source}</pre>`)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const source = `
import { DemoSection } from '../components/demo-section'

export default () => (
  <DemoSection title="Basic" description="desc" demo={() => <div>demo</div>} />
)
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/general/sample-demos.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).toBeNull()
    expect(toHTML).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('DemoSection demo must be a direct identifier'),
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('warns and skips DemoSection code injection when named demo component is missing', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn((source: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${source}</pre>`)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const source = `
import { DemoSection } from '../components/demo-section'

export default () => (
  <DemoSection title="Basic" description="desc" demo={MissingDemo} />
)
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/general/sample-demos.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).toBeNull()
    expect(toHTML).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Demo component "MissingDemo" was not found'),
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('does not inject DemoSection code from legacy children-only usage', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn((source: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${source}</pre>`)

    const source = `
import { DemoSection } from '../components/demo-section'

export default () => (
  <DemoSection title="Basic" description="desc">
    <div>demo</div>
  </DemoSection>
)
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/general/sample-demos.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).toBeNull()
    expect(toHTML).not.toHaveBeenCalled()

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('injects DemoPage apiDoc prop from docs/api-doc/components', async () => {
    const projectRoot = await createTempProject()
    await writeComponentApiDoc(projectRoot, 'button', { component: { key: 'button' } })

    const source = `
import { DemoPage } from '../components/demo-page'

export default () => <DemoPage componentKey="button"></DemoPage>
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/general/sample-demos.tsx',
      () => '<pre></pre>',
      projectRoot,
    )

    expect(transformed).toContain('apiDoc={{"component":{"key":"button"}}}')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('injects SourceCode html with bash lang and defaults to tsx', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn(
      (input: string, lang: 'tsx' | 'bash') => `<pre data-lang="${lang}">${input}</pre>`,
    )

    const source = `
import { SourceCode } from 'virtual:demo-source'

export default () => (
  <>
    <SourceCode lang="bash">bun add solid-toaster</SourceCode>
    <SourceCode>{\`const x = 1\`}</SourceCode>
  </>
)
`

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/guide/intro.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).toContain('html={')
    expect(toHTML).toHaveBeenCalledWith('bun add solid-toaster', 'bash')
    expect(toHTML).toHaveBeenCalledWith('const x = 1', 'tsx')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('transforms a real demo file using top-level demo components', async () => {
    const projectRoot = await createTempProject()
    const toHTML = vi.fn((source: string, lang: 'tsx' | 'bash') => `<pre ${lang}>${source}</pre>`)
    const source = await readFile(
      path.join(process.cwd(), 'docs/demo/overlay/tooltip-demos.tsx'),
      'utf8',
    )

    const transformed = await transformDemoSource(
      source,
      '/tmp/docs/demo/overlay/tooltip-demos.tsx',
      toHTML,
      projectRoot,
    )

    expect(transformed).not.toBeNull()
    expect(transformed).toContain('demo={PlacementsDemo}')
    expect(transformed).toContain('code={')
    expect(toHTML).toHaveBeenCalledWith(expect.stringContaining('function PlacementsDemo'), 'tsx')

    await rm(projectRoot, { recursive: true, force: true })
  })
})
