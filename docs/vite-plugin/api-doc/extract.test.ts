import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import { generateApiDoc, normalizePathForComparison, shouldIncludeInheritedGroup } from './extract'

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

const D_MTS_GENERIC_DEFAULT = `
type BaseProps<T extends string> = {
  as?: T
  data?: T[]
}

type DemoProps<T extends string = 'button'> = {
  foo?: T
  nested?: { kind: T }
} & BaseProps<T>;

declare function Demo<T extends string = 'button'>(props: DemoProps<T>): JSX.Element
`

const D_MTS_KOBALTE_HASH = `
import type { ButtonRootProps } from '@kobalte/core/button'

interface DemoProps extends ButtonRootProps {}
declare function Demo(props: DemoProps): JSX.Element
`

const D_MTS_KOBALTE_HASHED_DIST_FILE = `
import type { NumberFieldRootProps } from '@kobalte/core/dist/number-field-root-30f25adc.js'

interface DemoProps extends NumberFieldRootProps {}
declare function Demo(props: DemoProps): JSX.Element
`

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-api-doc-'))
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

    expect(generateApiDoc(projectRoot)).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found, skipping generation'))

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts props, slots and items docs from declarations', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_SAMPLE)

    const result = generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    expect(data.indexDoc.components.map((component) => component.key)).toEqual(
      expect.arrayContaining(['demo', 'empty']),
    )

    const demoDoc = data.componentDocs.get('demo')
    expect(demoDoc?.slots).toEqual(['root', 'item'])
    expect(demoDoc?.items?.description).toBe('Items for demo.')
    expect(demoDoc?.items?.props).toEqual([
      {
        name: 'label',
        required: false,
        type: 'string',
        description: 'Label text.',
      },
    ])

    expect(demoDoc?.props.own.find((prop) => prop.name === 'title')).toEqual({
      name: 'title',
      required: true,
      type: 'string',
      description: 'Title text.',
    })
    expect(demoDoc?.props.own.find((prop) => prop.name === 'mode')?.defaultValue).toBe('a')

    const emptyDoc = data.componentDocs.get('empty')
    expect(emptyDoc?.slots).toEqual(['root'])
    expect(emptyDoc?.items).toBeUndefined()

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('handles alias items, non-jsx declarations and region-based category/sourcePath', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_ADVANCED)

    const result = generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    expect(data.indexDoc.components.map((component) => component.key)).toEqual(
      expect.arrayContaining(['alias', 'prop-only']),
    )
    expect(data.indexDoc.components.map((component) => component.key)).not.toContain('helper')

    const aliasDoc = data.componentDocs.get('alias')
    expect(aliasDoc?.component.category).toBe('forms')
    expect(aliasDoc?.component.sourcePath).toBe('src/forms/alias/alias.d.ts')
    expect(aliasDoc?.items).toEqual({
      description: 'Alias-only items doc.',
      props: [],
    })
    expect(aliasDoc?.props.own.find((prop) => prop.name === 'value')?.required).toBe(true)

    expect(data.componentDocs.get('prop-only')?.items).toEqual({
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

    const result = generateApiDoc(projectRoot)
    expect(result?.componentDocs.get('collection')?.items).toEqual({
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

    const result = generateApiDoc(projectRoot)
    const inheritedGroup = result?.componentDocs
      .get('external-alias')
      ?.props.inherited.find((group) => group.from === 'opaque-lib')

    const keyboardDelegateProp = inheritedGroup?.props.find(
      (prop) => prop.name === 'keyboardDelegate',
    )
    expect(keyboardDelegateProp?.type).toBe('KeyboardDelegate')
    expect(keyboardDelegateProp?.type).not.toContain('import("')
    expect(keyboardDelegateProp?.type).not.toContain('/node_modules/')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('resolves generic defaults via AST transform for top-level aliases used by declarations', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_GENERIC_DEFAULT)

    const result = generateApiDoc(projectRoot)
    const props = result?.componentDocs.get('demo')?.props.own ?? []
    const asProp = props.find((prop) => prop.name === 'as')
    const dataProp = props.find((prop) => prop.name === 'data')
    const fooProp = props.find((prop) => prop.name === 'foo')

    expect(asProp?.type).toBe('"button"')
    expect(dataProp?.type).toBe('"button"[]')
    expect(fooProp?.type).toBe('"button"')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('normalizes windows and posix style paths for compiler host comparison', () => {
    const winPath = 'E:\\project\\moraine\\dist\\index.d.mts'
    const posixPath = 'E:/project/moraine/dist/index.d.mts'
    const mixedCasePath = 'e:/PROJECT/moraine/dist/index.d.mts'

    const normalizedWin = normalizePathForComparison(winPath)
    const normalizedPosix = normalizePathForComparison(posixPath)
    const normalizedMixedCase = normalizePathForComparison(mixedCasePath)

    expect(normalizedWin).toBe(normalizedPosix)
    expect(normalizedWin.toLowerCase()).toBe(normalizedMixedCase.toLowerCase())
  })

  test('infers @kobalte/core component from hash index using AST exports parsing', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_KOBALTE_HASH)

    await writeNodeModuleFile(
      projectRoot,
      '@kobalte/core',
      'package.json',
      JSON.stringify({
        name: '@kobalte/core',
        version: '1.0.0',
        types: 'dist/index.d.ts',
        exports: {
          '.': { types: './dist/index.d.ts' },
          './button': { types: './dist/button/index.d.ts' },
        },
      }),
    )
    await writeNodeModuleFile(projectRoot, '@kobalte/core', 'dist/index.d.ts', 'export {}\n')
    await writeNodeModuleFile(
      projectRoot,
      '@kobalte/core',
      'dist/button/index.d.ts',
      `export type { ButtonRootProps } from '../index-abcd1234.js'`,
    )
    await writeNodeModuleFile(
      projectRoot,
      '@kobalte/core',
      'dist/index-abcd1234.d.ts',
      `
export interface ButtonRootProps {
  disabled?: boolean
}
`,
    )

    const result = generateApiDoc(projectRoot)
    const inherited = result?.componentDocs.get('demo')?.props.inherited ?? []
    const kobalteGroup = inherited.find((group) => group.from === '@kobalte/core/button')
    expect(kobalteGroup?.props.find((prop) => prop.name === 'disabled')).toBeDefined()

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('filters solid-js inherited groups while preserving External groups', () => {
    expect(shouldIncludeInheritedGroup('solid-js')).toBe(false)
    expect(shouldIncludeInheritedGroup('External')).toBe(true)
    expect(shouldIncludeInheritedGroup('@kobalte/core')).toBe(true)
  })

  test('trims hashed @kobalte/core dist filename suffix in inherited group source', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(projectRoot, D_MTS_KOBALTE_HASHED_DIST_FILE)

    await writeNodeModuleFile(
      projectRoot,
      '@kobalte/core',
      'package.json',
      JSON.stringify({
        name: '@kobalte/core',
        version: '1.0.0',
        types: 'dist/index.d.ts',
      }),
    )
    await writeNodeModuleFile(projectRoot, '@kobalte/core', 'dist/index.d.ts', 'export {}\n')
    await writeNodeModuleFile(
      projectRoot,
      '@kobalte/core',
      'dist/number-field-root-30f25adc.d.ts',
      `
export interface NumberFieldRootProps {
  spinOnPress?: boolean
}
`,
    )

    const result = generateApiDoc(projectRoot)
    const inherited = result?.componentDocs.get('demo')?.props.inherited ?? []
    const groupNames = inherited.map((group) => group.from)

    expect(groupNames).toContain('@kobalte/core/number-field')
    expect(groupNames).not.toContain('@kobalte/core/number-field-root-30f25adc.d.ts')

    await rm(projectRoot, { recursive: true, force: true })
  })
})
