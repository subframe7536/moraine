import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { docsPlugin } from './docs-plugin'

const D_MTS_SAMPLE = `
declare namespace ButtonT {
  type Slot = 'root'
}

interface ButtonProps {
  /** Button label. */
  label: string
}

declare function Button(props: ButtonProps): JSX.Element
`

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-docs-plugin-'))
}

async function seedDocsProject(projectRoot: string): Promise<void> {
  await mkdir(path.join(projectRoot, 'dist'), { recursive: true })
  await mkdir(path.join(projectRoot, 'docs/pages/general/button/examples'), { recursive: true })

  await writeFile(path.join(projectRoot, 'dist/index.d.mts'), D_MTS_SAMPLE, 'utf8')
  await writeFile(
    path.join(projectRoot, 'docs/pages/general/button/button.md'),
    `
## Button

:::example
name: BasicExample
:::
`,
    'utf8',
  )
  await writeFile(
    path.join(projectRoot, 'docs/pages/general/button/examples/basic-example.tsx'),
    'export const BasicExample = () => <button>Basic</button>\n',
    'utf8',
  )
}

describe('docsPlugin', () => {
  test('handles buildStart, virtual modules and transforms', async () => {
    const projectRoot = await createTempProject()
    await seedDocsProject(projectRoot)

    const plugin = docsPlugin({ projectRoot })
    const configResolved = plugin.configResolved as
      | ((config: { root: string }) => void)
      | { handler: (config: { root: string }) => void }
      | undefined
    const buildStart = plugin.buildStart as
      | (() => Promise<void> | void)
      | { handler: () => Promise<void> | void }
      | undefined
    const resolveId = plugin.resolveId as
      | ((id: string) => string | null | undefined)
      | { handler: (id: string) => string | null | undefined }
      | undefined
    const load = plugin.load as
      | ((id: string) => Promise<string | null | undefined> | string | null | undefined)
      | { handler: (id: string) => Promise<string | null | undefined> | string | null | undefined }
      | undefined
    const transform = plugin.transform as
      | { handler: (code: string, id: string) => Promise<string | null> | string | null }
      | undefined

    if (typeof configResolved === 'function') {
      configResolved({ root: path.join(projectRoot, 'docs') })
    } else {
      configResolved?.handler({ root: path.join(projectRoot, 'docs') })
    }

    if (typeof buildStart === 'function') {
      await buildStart()
    } else {
      await buildStart?.handler()
    }

    const apiDocJson = JSON.parse(
      await readFile(path.join(projectRoot, 'docs/api-doc/index.json'), 'utf8'),
    ) as { components: Array<{ key: string }> }
    expect(apiDocJson.components.map((component) => component.key)).toContain('button')

    const resolvedApiId =
      typeof resolveId === 'function'
        ? resolveId('virtual:api-doc')
        : resolveId?.handler('virtual:api-doc')
    const resolvedPagesId =
      typeof resolveId === 'function'
        ? resolveId('virtual:example-pages')
        : resolveId?.handler('virtual:example-pages')

    const apiModule =
      typeof load === 'function'
        ? await load(resolvedApiId as string)
        : await load?.handler(resolvedApiId as string)
    const pagesModule =
      typeof load === 'function'
        ? await load(resolvedPagesId as string)
        : await load?.handler(resolvedPagesId as string)

    expect(apiModule).toContain('export default')
    expect(apiModule).toContain('"button"')
    expect(pagesModule).toContain('export const exampleMap')
    expect(pagesModule).toContain("'button'")

    const markdownModule = await transform?.handler(
      `
## Button

:::example
name: BasicExample
:::
`,
      path.join(projectRoot, 'docs/pages/general/button/button.md'),
    )
    expect(markdownModule).toContain('componentKey: "button"')
    expect(markdownModule).toContain('?example-source&name=BasicExample')

    const sourceModule = await transform?.handler(
      'export const BasicExample = () => <button>Basic</button>\n',
      path.join(
        projectRoot,
        'docs/pages/general/button/examples/basic-example.tsx?example-source&name=BasicExample',
      ),
    )
    expect(sourceModule).toContain('export default')
    expect(sourceModule).toContain('BasicExample')

    await rm(projectRoot, { recursive: true, force: true })
  })
})
