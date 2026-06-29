// @vitest-environment node

import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createServer, parseSync } from 'vite'
import type { ViteDevServer } from 'vite'
import { describe, expect, test } from 'vitest'

import { EXAMPLE_PARSE_OPTIONS } from './examples/ast'
import { docsBuildPlugin } from './plugin'

const TRANSFORM_CONTEXT = {
  parse(code: string) {
    return parseSync('example.tsx', code, EXAMPLE_PARSE_OPTIONS).program
  },
}

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
  return mkdtemp(path.join(tmpdir(), 'moraine-docs-build-plugin-'))
}

async function seedDocsProject(projectRoot: string): Promise<void> {
  await mkdir(path.join(projectRoot, 'dist'), { recursive: true })
  await mkdir(path.join(projectRoot, 'docs/pages/general/button'), { recursive: true })
  await mkdir(path.join(projectRoot, 'docs/components'), { recursive: true })

  await writeFile(path.join(projectRoot, 'dist/index.d.mts'), D_MTS_SAMPLE, 'utf8')
  await writeFile(
    path.join(projectRoot, 'docs/components/docs-demo-block.tsx'),
    'export function createDocsDemo(component, source) { return { component, source } }\n',
    'utf8',
  )
  await writeFile(
    path.join(projectRoot, 'docs/pages/general/button/button.mdx'),
    `
---
header: true
status: new
---

import { DemoButtonBasicExample } from './basic-example?example'

## Button

<DemoButtonBasicExample />
`,
    'utf8',
  )
  await writeFile(
    path.join(projectRoot, 'docs/pages/general/button/basic-example.tsx'),
    'export const BasicExample = () => <button>Basic</button>\n',
    'utf8',
  )
}

describe('docsBuildPlugin', () => {
  test('generates api docs, virtual api data and transforms content', async () => {
    const projectRoot = await createTempProject()
    await seedDocsProject(projectRoot)

    try {
      const plugin = docsBuildPlugin({ projectRoot })
      const configResolved = plugin.configResolved as
        | ((config: { root: string }) => Promise<void> | void)
        | { handler: (config: { root: string }) => Promise<void> | void }
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
        | {
            handler: (id: string) => Promise<string | null | undefined> | string | null | undefined
          }
        | undefined
      const transform = plugin.transform as
        | {
            handler: (
              code: string,
              id: string,
              options?: { ssr?: boolean },
            ) => Promise<string | null> | string | null
          }
        | undefined

      if (typeof configResolved === 'function') {
        await configResolved({ root: path.join(projectRoot, 'docs') })
      } else {
        await configResolved?.handler({ root: path.join(projectRoot, 'docs') })
      }

      if (typeof buildStart === 'function') {
        await buildStart()
      } else {
        await buildStart?.handler()
      }

      const apiDocJson = JSON.parse(
        await readFile(path.join(projectRoot, 'docs/pages/_api-index.json'), 'utf8'),
      ) as { components: Array<{ key: string }> }
      expect(apiDocJson.components.map((component) => component.key)).toContain('button')
      expect(
        await readFile(path.join(projectRoot, 'docs/pages/general/button/api.json'), 'utf8'),
      ).toContain('"button"')

      await expect(access(path.join(projectRoot, 'docs/.generated'))).rejects.toThrow()

      const resolvedApiId =
        typeof resolveId === 'function'
          ? resolveId('virtual:api-doc')
          : resolveId?.handler('virtual:api-doc')
      const apiModule =
        typeof load === 'function'
          ? await load(resolvedApiId as string)
          : await load?.handler(resolvedApiId as string)
      expect(apiModule).toContain('export default')
      expect(apiModule).toContain('"button"')

      const exampleModule = await transform?.handler.call(
        TRANSFORM_CONTEXT,
        'export const BasicExample = () => <button>Basic</button>\n',
        path.join(projectRoot, 'docs/pages/general/button/basic-example.tsx?example'),
      )
      expect(exampleModule).toContain('export const DemoButtonBasicExample')
      expect(exampleModule).toContain('?example-source&name=BasicExample')

      const ssrExampleModule = await transform?.handler.call(
        TRANSFORM_CONTEXT,
        'export const BasicExample = () => <button>Basic</button>\n',
        path.join(projectRoot, 'docs/pages/general/button/basic-example.tsx?example'),
        { ssr: true },
      )
      expect(ssrExampleModule).toContain('createDocsDemo(() => null')
      expect(ssrExampleModule).not.toContain('import { BasicExample as __BasicExample }')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
  test('runs transforms through a real Vite dev server', async () => {
    const projectRoot = await createTempProject()
    await seedDocsProject(projectRoot)
    let server: ViteDevServer | undefined

    try {
      server = await createServer({
        root: path.join(projectRoot, 'docs'),
        configFile: false,
        logLevel: 'silent',
        appType: 'custom',
        server: { middlewareMode: true },
        plugins: [docsBuildPlugin({ projectRoot })],
      })

      const apiModule = await server.pluginContainer.load('\0moraine-api-doc')
      expect(String(apiModule)).toContain('"button"')

      const exampleModule = await server.transformRequest(
        path.join(projectRoot, 'docs/pages/general/button/basic-example.tsx?example'),
      )
      expect(exampleModule?.code).toContain('export const DemoButtonBasicExample')
      expect(exampleModule?.code).toContain('?example-source&name=BasicExample')
    } finally {
      await server?.close()
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
