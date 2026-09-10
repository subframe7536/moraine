// @vitest-environment node

import { access, mkdir, mkdtemp, readFile, realpath, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createServer, parseSync } from 'vite'
import type { ViteDevServer } from 'vite'
import { describe, expect, test } from 'vitest'

import { docsBuildPlugin } from './plugin'
import { PREVIEW_PARSE_OPTIONS } from './previews/ast'

const TRANSFORM_CONTEXT = {
  parse(code: string) {
    return parseSync('example.tsx', code, PREVIEW_PARSE_OPTIONS).program
  },
}

const D_MTS_SAMPLE = `
export declare namespace ButtonT {
  interface Slot {
    root: 'root'
  }
}

interface ButtonProps {
  /** Button label. */
  label: string
}

export declare function Button(props: ButtonProps): JSX.Element
`

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(await realpath(tmpdir()), 'moraine-docs-build-plugin-'))
}

async function seedDocsProject(projectRoot: string): Promise<void> {
  await writeFile(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({ exports: { '.': { types: './dist/index.d.mts' } } }),
  )
  await mkdir(path.join(projectRoot, 'dist'), { recursive: true })
  await mkdir(path.join(projectRoot, 'docs/pages/(general)/button'), { recursive: true })

  await writeFile(path.join(projectRoot, 'dist/index.d.mts'), D_MTS_SAMPLE, 'utf8')
  await writeFile(
    path.join(projectRoot, 'docs/pages/(general)/button/index.mdx'),
    `---
title: Button
description: Test button page.
sidebar:
  order: 10
search:
  tags: [action]
---

## Button

<Preview path="./basic-example" />
`,
    'utf8',
  )
  await writeFile(
    path.join(projectRoot, 'docs/pages/(general)/button/basic-example.tsx'),
    'export const BasicExample = () => <button>Basic</button>\n',
    'utf8',
  )
}

describe('docsBuildPlugin', () => {
  test('regenerates after a non-root declaration changes and preserves docs on invalid declarations', async () => {
    const projectRoot = await createTempProject()
    await seedDocsProject(projectRoot)
    try {
      await writeFile(
        path.join(projectRoot, 'dist/index.d.mts'),
        `export { Button } from './button.mjs'`,
      )
      const declaration = path.join(projectRoot, 'dist/button.d.mts')
      await writeFile(
        declaration,
        `export declare function Button(props: { first: string }): JSX.Element`,
      )
      const plugin = docsBuildPlugin({ projectRoot })
      const configResolved = plugin.configResolved as (config: { root: string }) => Promise<void>
      await configResolved({ root: path.join(projectRoot, 'docs') })
      const indexPath = path.join(projectRoot, 'docs/pages/_api-index.json')
      const apiPath = path.join(projectRoot, 'docs/pages/(general)/button/api.json')
      const future = new Date(Date.now() + 60_000)
      await utimes(indexPath, future, future)
      await writeFile(
        declaration,
        `export declare function Button(props: { second: boolean }): JSX.Element`,
      )
      await configResolved({ root: path.join(projectRoot, 'docs') })
      const generated = await readFile(apiPath, 'utf8')
      expect(JSON.parse(generated).props.own[0].name).toBe('second')
      await writeFile(declaration, 'export declare function Button(')
      await expect(configResolved({ root: path.join(projectRoot, 'docs') })).rejects.toThrow(
        'Failed to parse',
      )
      expect(await readFile(apiPath, 'utf8')).toBe(generated)
      await rm(declaration)
      await writeFile(path.join(projectRoot, 'dist/button.mjs'), 'export function Button() {}')
      await expect(configResolved({ root: path.join(projectRoot, 'docs') })).rejects.toThrow(
        'Cannot resolve declaration import "./button.mjs"',
      )
      expect(await readFile(apiPath, 'utf8')).toBe(generated)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

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
        await readFile(path.join(projectRoot, 'docs/pages/(general)/button/api.json'), 'utf8'),
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

      const previewModule = await transform?.handler.call(
        TRANSFORM_CONTEXT,
        'export const BasicExample = () => <button>Basic</button>\n',
        path.join(projectRoot, 'docs/pages/(general)/button/basic-example.tsx?preview'),
      )
      expect(previewModule).toContain('export default { component, source: __PreviewSource }')
      expect(previewModule).toContain('?preview-source&name=BasicExample')

      const markdownModule = await transform?.handler.call(
        TRANSFORM_CONTEXT,
        await readFile(path.join(projectRoot, 'docs/pages/(general)/button/index.mdx'), 'utf8'),
        path.join(projectRoot, 'docs/pages/(general)/button/index.mdx'),
      )
      expect(markdownModule).toBeNull()

      const ssrPreviewModule = await transform?.handler.call(
        TRANSFORM_CONTEXT,
        'export const BasicExample = () => <button>Basic</button>\n',
        path.join(projectRoot, 'docs/pages/(general)/button/basic-example.tsx?preview'),
        { ssr: true },
      )
      expect(ssrPreviewModule).toContain('const component = () => null')
      expect(ssrPreviewModule).not.toContain('import { BasicExample as __Preview }')
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
      const apiCode = typeof apiModule === 'string' ? apiModule : apiModule?.code
      expect(apiCode).toContain('"button"')

      const previewModule = await server.transformRequest(
        '/pages/(general)/button/basic-example.tsx?preview',
      )
      expect(previewModule?.code).toContain('export default')
      expect(previewModule?.code).toContain('source: __PreviewSource')
      expect(previewModule?.code).toContain('?preview-source&name=BasicExample')
    } finally {
      await server?.close()
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
