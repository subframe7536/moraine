import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { componentApiPlugin, generateApiDoc, writeJsonFiles } from './api-doc'

const D_MTS_SAMPLE = `
declare namespace DemoT {
  /** Items for demo. */
  interface Items {
    /** Label text. */
    label?: string
  }
  type Slot = 'root' | 'item'
}

interface DemoProps {
  /** Title text. */
  title: string
  /**
   * Mode value.
   * @default "a"
   */
  mode?: 'a' | 'b'
}

declare function Demo(props: DemoProps): JSX.Element

declare namespace EmptyT {
  interface Items {}
  type Slot = 'root'
}

interface EmptyProps {
  /** Optional value. */
  value?: number
}

declare function Empty(props: EmptyProps): JSX.Element
`

const D_MTS_ADVANCED = `
declare namespace AliasT {
  /** Alias-only items doc. */
  type Items = string | number
  type Slot = 'root'
}

interface AliasProps {
  /** Explicit undefined union. */
  value: string | undefined
}

//#region src/forms/alias/alias.d.ts
declare function Alias(props: AliasProps): JSX.Element
//#endregion

declare function Helper(props: AliasProps): string

declare namespace PropOnlyT {
  interface Items {
    /** Identifier field. */
    id?: number
  }
}

interface PropOnlyProps {}
declare function PropOnly(props: PropOnlyProps): JSX.Element
`

const D_MTS_ITEMS_COLLECTION = `
type GenericItems<T> = T[] | T[][]

declare namespace CollectionT {
  interface Item {
    /** Label text. */
    label?: string
    /** Disabled state. */
    disabled?: boolean
  }

  /** Collection-based items doc. */
  type Items = GenericItems<Item>
  type Slot = 'root'
}

interface CollectionProps {
  items?: CollectionT.Items
}

declare function Collection(props: CollectionProps): JSX.Element
`

const D_MTS_EXTERNAL_ALIAS = `
import type { ExternalProps } from 'opaque-lib'

declare namespace ExternalAliasT {
  type Slot = 'root'
}

interface ExternalAliasProps extends ExternalProps {}
declare function ExternalAlias(props: ExternalAliasProps): JSX.Element
`

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'flint-ui-api-doc-'))
}

async function writeProjectDts(projectRoot: string, content: string): Promise<void> {
  const distDir = path.join(projectRoot, 'dist')
  await mkdir(distDir, { recursive: true })
  await writeFile(path.join(distDir, 'index.d.mts'), content, 'utf8')
}

async function writeNodeModuleFile(
  projectRoot: string,
  moduleName: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const filePath = path.join(projectRoot, 'node_modules', moduleName, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf8')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateApiDoc', () => {
  test('returns null when dist/index.d.mts is missing', async () => {
    const projectRoot = await createTempProject()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(generateApiDoc(projectRoot)).resolves.toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found, skipping generation'))

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts props, slots and items docs from declarations', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_SAMPLE)

    const result = await generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    const keys = data.indexDoc.components.map((component) => component.key)
    expect(keys).toEqual(expect.arrayContaining(['demo', 'empty']))

    const demoDoc = data.componentDocs.get('demo')
    expect(demoDoc).toBeDefined()
    expect(demoDoc!.slots).toEqual(['root', 'item'])
    expect(demoDoc!.items?.description).toBe('Items for demo.')
    expect(demoDoc!.items?.props).toEqual([
      {
        name: 'label',
        required: false,
        type: 'string',
        description: 'Label text.',
      },
    ])

    const titleProp = demoDoc!.props.own.find((prop) => prop.name === 'title')
    expect(titleProp).toEqual({
      name: 'title',
      required: true,
      type: 'string',
      description: 'Title text.',
    })

    const modeProp = demoDoc!.props.own.find((prop) => prop.name === 'mode')
    expect(modeProp?.required).toBe(false)
    expect(modeProp?.defaultValue).toBe('a')

    const emptyDoc = data.componentDocs.get('empty')
    expect(emptyDoc).toBeDefined()
    expect(emptyDoc!.slots).toEqual(['root'])
    expect(emptyDoc!.items).toBeUndefined()

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('handles alias items, non-jsx declarations and region-based category/sourcePath', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_ADVANCED)

    const result = await generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    const keys = data.indexDoc.components.map((component) => component.key)
    expect(keys).toEqual(expect.arrayContaining(['alias', 'prop-only']))
    expect(keys).not.toContain('helper')

    const aliasDoc = data.componentDocs.get('alias')
    expect(aliasDoc).toBeDefined()
    expect(aliasDoc!.slots).toEqual(['root'])
    expect(aliasDoc!.component.category).toBe('forms')
    expect(aliasDoc!.component.sourcePath).toBe('src/forms/alias/alias.d.ts')
    expect(aliasDoc!.items).toEqual({
      description: 'Alias-only items doc.',
      props: [],
    })

    const aliasValueProp = aliasDoc!.props.own.find((prop) => prop.name === 'value')
    expect(aliasValueProp?.required).toBe(true)
    expect(aliasValueProp?.description).toBe('Explicit undefined union.')

    const propOnlyDoc = data.componentDocs.get('prop-only')
    expect(propOnlyDoc).toBeDefined()
    expect(propOnlyDoc!.items).toEqual({
      props: [
        {
          name: 'id',
          required: false,
          type: 'number',
          description: 'Identifier field.',
        },
      ],
    })

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts item props from collection alias item types', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_ITEMS_COLLECTION)

    const result = await generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    const collectionDoc = data.componentDocs.get('collection')
    expect(collectionDoc).toBeDefined()
    expect(collectionDoc!.items).toEqual({
      description: 'Collection-based items doc.',
      props: [
        {
          name: 'disabled',
          required: false,
          type: 'boolean',
          description: 'Disabled state.',
        },
        {
          name: 'label',
          required: false,
          type: 'string',
          description: 'Label text.',
        },
      ],
    })

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('uses readable type aliases for inherited external types without absolute import paths', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_EXTERNAL_ALIAS)

    await writeNodeModuleFile(
      projectRoot,
      'opaque-lib',
      'package.json',
      JSON.stringify({
        name: 'opaque-lib',
        version: '1.0.0',
        types: 'dist/index.d.ts',
      }),
    )
    await writeNodeModuleFile(
      projectRoot,
      'opaque-lib',
      'dist/list.d.ts',
      `
export interface KeyboardDelegate {
  getKey?: (key: string) => string | undefined
}
`,
    )
    await writeNodeModuleFile(
      projectRoot,
      'opaque-lib',
      'dist/index.d.ts',
      `
import { KeyboardDelegate as K } from './list'

export interface ExternalProps {
  keyboardDelegate?: K
}
`,
    )

    const result = await generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    const externalDoc = data.componentDocs.get('external-alias')
    expect(externalDoc).toBeDefined()

    const inheritedGroup = externalDoc!.props.inherited.find((group) => group.from === 'opaque-lib')
    expect(inheritedGroup).toBeDefined()

    const keyboardDelegateProp = inheritedGroup!.props.find(
      (prop) => prop.name === 'keyboardDelegate',
    )
    expect(keyboardDelegateProp).toBeDefined()
    expect(keyboardDelegateProp!.type).toBe('KeyboardDelegate')
    expect(keyboardDelegateProp!.type).not.toContain('import("')
    expect(keyboardDelegateProp!.type).not.toContain('/node_modules/')

    await rm(projectRoot, { recursive: true, force: true })
  })
})

describe('writeJsonFiles', () => {
  test('writes index/components and removes stale component files', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'flint-ui-api-json-'))
    const stalePath = path.join(outDir, 'components', 'stale.json')
    await mkdir(path.dirname(stalePath), { recursive: true })
    await writeFile(stalePath, '{"stale":true}', 'utf8')

    const result: Parameters<typeof writeJsonFiles>[1] = {
      indexDoc: {
        components: [
          {
            key: 'demo',
            name: 'Demo',
            category: 'General',
            polymorphic: false,
          },
        ],
      },
      componentDocs: new Map([
        [
          'demo',
          {
            component: {
              key: 'demo',
              name: 'Demo',
              category: 'General',
              polymorphic: false,
            },
            slots: ['root'],
            props: { own: [], inherited: [] },
            items: {
              description: 'Items for demo.',
              props: [],
            },
          },
        ],
      ]),
    }

    await writeJsonFiles(outDir, result)

    expect(existsSync(stalePath)).toBe(false)
    const indexText = await readFile(path.join(outDir, 'index.json'), 'utf8')
    const demoText = await readFile(path.join(outDir, 'components', 'demo.json'), 'utf8')

    expect(JSON.parse(indexText)).toEqual(result.indexDoc)
    expect(JSON.parse(demoText)).toEqual(result.componentDocs.get('demo'))

    await rm(outDir, { recursive: true, force: true })
  })

  test('clears stale component files even when no components are generated', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'flint-ui-api-json-empty-'))
    const stalePath = path.join(outDir, 'components', 'stale.json')
    await mkdir(path.dirname(stalePath), { recursive: true })
    await writeFile(stalePath, '{"stale":true}', 'utf8')

    const result: Parameters<typeof writeJsonFiles>[1] = {
      indexDoc: { components: [] },
      componentDocs: new Map(),
    }

    await writeJsonFiles(outDir, result)

    const componentDir = path.join(outDir, 'components')
    expect(existsSync(componentDir)).toBe(true)
    expect(await readdir(componentDir)).toEqual([])
    expect(existsSync(stalePath)).toBe(false)
    expect(JSON.parse(await readFile(path.join(outDir, 'index.json'), 'utf8'))).toEqual({
      components: [],
    })

    await rm(outDir, { recursive: true, force: true })
  })
})

describe('componentApiPlugin', () => {
  test('falls back to empty data when index.json is invalid JSON', async () => {
    const projectRoot = await createTempProject()
    const docsRoot = path.join(projectRoot, 'docs')
    const apiDir = path.join(docsRoot, 'api-doc')
    await mkdir(apiDir, { recursive: true })
    await writeFile(path.join(apiDir, 'index.json'), 'not-json', 'utf8')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plugin = componentApiPlugin()
    const configResolved = plugin.configResolved as
      | ((config: { root: string }) => void)
      | { handler: (config: { root: string }) => void }
      | undefined
    if (typeof configResolved === 'function') {
      configResolved({ root: docsRoot })
    } else {
      configResolved?.handler({ root: docsRoot })
    }

    const resolveId = plugin.resolveId as
      | ((id: string) => string | null | undefined)
      | { handler: (id: string) => string | null | undefined }
      | undefined
    const resolvedId =
      typeof resolveId === 'function'
        ? resolveId('virtual:api-doc')
        : resolveId?.handler('virtual:api-doc')

    const load = plugin.load as
      | ((id: string) => Promise<string | null | undefined> | string | null | undefined)
      | { handler: (id: string) => Promise<string | null | undefined> | string | null | undefined }
      | undefined
    const loaded =
      typeof load === 'function'
        ? await load(resolvedId as string)
        : await load?.handler(resolvedId as string)

    expect(loaded).toBe('export default { components: [] }')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('serving empty data'))

    await rm(projectRoot, { recursive: true, force: true })
  })
})
