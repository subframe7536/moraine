import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  generateApiDoc,
  normalizePathForComparison,
  shouldIncludeInheritedGroup,
} from './extract.ts'

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

function resultProps(result: Awaited<ReturnType<typeof generateApiDoc>>, key: string) {
  return result?.componentDocs.get(key)?.props.own ?? []
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateApiDoc', () => {
  test('returns null when dist/index.d.mts is missing', async () => {
    const projectRoot = await createTempProject()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(await generateApiDoc(projectRoot)).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found, skipping generation'))

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts props, slots and items docs from declarations', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
declare namespace DemoT {
  /** Items for demo. */
  interface Item {
    /** Label text. */
    label?: string
  }
  interface Slot {
    /** Root wrapper. */
    root: {}
    /** Item row. */
    item: {}
  }
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
  interface Item {}
  interface Slot {
    /** Root wrapper. */
    root: {}
  }
}

interface EmptyProps {
  /** Optional value. */
  value?: number
}

declare function Empty(props: EmptyProps): JSX.Element
`,
    )

    const result = await generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    expect(data.indexDoc.components.map((component) => component.key)).toEqual(
      expect.arrayContaining(['demo', 'empty']),
    )

    const demoDoc = data.componentDocs.get('demo')
    expect(demoDoc?.slots).toEqual([
      { name: 'root', description: 'Root wrapper.' },
      { name: 'item', description: 'Item row.' },
    ])
    expect(demoDoc?.item?.description).toBe('Items for demo.')
    expect(demoDoc?.item?.props).toEqual([
      {
        name: 'label',
        required: false,
        type: 'string | undefined',
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
    expect(emptyDoc?.slots).toEqual([{ name: 'root', description: 'Root wrapper.' }])
    expect(emptyDoc?.item).toBeUndefined()

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('handles alias items, non-jsx declarations and region-based category/sourcePath', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
declare namespace AliasT {
  /** Alias-only items doc. */
  type Item = string | number
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
  interface Item {
    /** Identifier field. */
    id?: number
  }
}

interface PropOnlyProps {}
declare function PropOnly(props: PropOnlyProps): JSX.Element
`,
    )

    const result = await generateApiDoc(projectRoot)
    expect(result).not.toBeNull()
    const data = result!

    expect(data.indexDoc.components.map((component) => component.key)).toEqual(
      expect.arrayContaining(['alias', 'prop-only']),
    )
    expect(data.indexDoc.components.map((component) => component.key)).not.toContain('helper')

    const aliasDoc = data.componentDocs.get('alias')
    expect(aliasDoc?.component.category).toBe('forms')
    expect(aliasDoc?.component.sourcePath).toBe('src/forms/alias/alias.d.ts')
    expect(aliasDoc?.item).toEqual({
      description: 'Alias-only items doc.',
      props: [],
    })
    expect(aliasDoc?.props.own.find((prop) => prop.name === 'value')?.required).toBe(false)

    expect(data.componentDocs.get('prop-only')?.item).toEqual({
      props: [
        {
          name: 'id',
          required: false,
          type: 'number | undefined',
          description: 'Identifier field.',
        },
      ],
    })

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts item props from collection alias item types', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
type GenericItems<T> = T[] | T[][]

declare namespace CollectionT {
  interface SubItem {
    /** Label text. */
    label?: string
    /** Disabled state. */
    disabled?: boolean
  }

  /** Collection-based items doc. */
  type Item = GenericItems<SubItem>
  type Slot = 'root'
}

interface CollectionProps {
  items?: CollectionT.Item
}

declare function Collection(props: CollectionProps): JSX.Element
`,
    )

    const result = await generateApiDoc(projectRoot)
    expect(result?.componentDocs.get('collection')?.item).toEqual({
      description: 'Collection-based items doc.',
      props: [
        {
          name: 'disabled',
          required: false,
          type: 'boolean | undefined',
          description: 'Disabled state.',
        },
        {
          name: 'label',
          required: false,
          type: 'string | undefined',
          description: 'Label text.',
        },
      ],
    })

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('uses readable type aliases for inherited external types without absolute import paths', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
import type { ExternalProps } from 'opaque-lib'

declare namespace ExternalAliasT {
  type Slot = 'root'
}

interface ExternalAliasProps extends ExternalProps {}
declare function ExternalAlias(props: ExternalAliasProps): JSX.Element
`,
    )

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
    const inheritedGroup = result?.componentDocs
      .get('external-alias')
      ?.props.inherited.find((group) => group.from === 'opaque-lib')

    const keyboardDelegateProp = inheritedGroup?.props.find(
      (prop) => prop.name === 'keyboardDelegate',
    )
    expect(keyboardDelegateProp?.type).toBe('KeyboardDelegate | undefined')
    expect(keyboardDelegateProp?.type).not.toContain('import("')
    expect(keyboardDelegateProp?.type).not.toContain('/node_modules/')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('preserves readable local names for minified relative declaration imports', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
import { m as ComponentOrElement } from './chunk.mjs'

declare namespace RenderAliasT {
  interface RenderProps {
    active: boolean
  }
}

interface RenderAliasProps {
  itemRender?: ComponentOrElement<RenderAliasT.RenderProps>
}

declare function RenderAlias(props: RenderAliasProps): JSX.Element
`,
    )

    const props = resultProps(await generateApiDoc(projectRoot), 'render-alias')

    expect(props.find((prop) => prop.name === 'itemRender')?.type).toBe(
      'ComponentOrElement<RenderAliasT.RenderProps> | undefined',
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('resolves generic defaults via AST transform for top-level aliases used by declarations', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
type BaseProps<T extends string> = {
  as?: T
  data?: T[]
}

type DemoProps<T extends string = 'button'> = {
  foo?: T
  nested?: { kind: T }
} & BaseProps<T>;

declare function Demo<T extends string = 'button'>(props: DemoProps<T>): JSX.Element
`,
    )

    const result = await generateApiDoc(projectRoot)
    const props = result?.componentDocs.get('demo')?.props.own ?? []
    const asProp = props.find((prop) => prop.name === 'as')
    const dataProp = props.find((prop) => prop.name === 'data')
    const fooProp = props.find((prop) => prop.name === 'foo')

    expect(asProp?.type).toBe('"button" | undefined')
    expect(dataProp?.type).toBe('"button"[] | undefined')
    expect(fooProp?.type).toBe('"button" | undefined')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('uses public component aliases for BaseProps slot override props', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
type ClassValue = string
declare namespace JSX {
  interface CSSProperties {
    color?: string
  }
}

type SlotClasses<TSlot> = {
  [K in Extract<keyof TSlot, string>]?: ClassValue
}
type SlotStyles<TSlot> = {
  [K in Extract<keyof TSlot, string>]?: JSX.CSSProperties
}
type BaseProps<Base, Variant, TSlot> = Base & ([Variant] extends [never] ? {} : Variant) & {
  classes?: SlotClasses<TSlot>
  styles?: SlotStyles<TSlot>
}

declare namespace AliasButtonT {
  interface Slot<T = unknown> {
    root?: T
    label?: T
  }
  type Variant = never
  type Classes = Slot<ClassValue>
  type Styles = Slot<JSX.CSSProperties>
  interface Base {
    label?: string
  }
  interface Props extends BaseProps<Base, Variant, Slot> {}
}

declare function AliasButton(props: AliasButtonT.Props): JSX.Element
`,
    )

    const props = resultProps(await generateApiDoc(projectRoot), 'alias-button')

    expect(props.find((prop) => prop.name === 'classes')?.type).toBe(
      'AliasButtonT.Classes | undefined',
    )
    expect(props.find((prop) => prop.name === 'styles')?.type).toBe(
      'AliasButtonT.Styles | undefined',
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('keeps shared slot override aliases before component aliases', async () => {
    const projectRoot = await createTempProject()
    await writeProjectDts(
      projectRoot,
      `
type ClassValue = string
declare namespace JSX {
  interface CSSProperties {
    color?: string
  }
}

type SlotClasses<TSlot> = {
  [K in Extract<keyof TSlot, string>]?: ClassValue
}
type SlotStyles<TSlot> = {
  [K in Extract<keyof TSlot, string>]?: JSX.CSSProperties
}
type BaseProps<Base, Variant, TSlot> = Base & ([Variant] extends [never] ? {} : Variant) & {
  classes?: SlotClasses<TSlot>
  styles?: SlotStyles<TSlot>
}

interface SharedSlots<T = unknown> {
  trigger?: T
  content?: T
}
type SharedClasses = SharedSlots<ClassValue>
type SharedStyles = SharedSlots<JSX.CSSProperties>
interface SharedRootProps {
  classes?: SharedClasses
  styles?: SharedStyles
}

declare namespace SharedMenuT {
  interface Slot<T = unknown> extends SharedSlots<T> {}
  type Variant = never
  type Classes = Slot<ClassValue>
  type Styles = Slot<JSX.CSSProperties>
  interface Base extends SharedRootProps {}
  interface Props extends BaseProps<Base, Variant, Slot> {}
}

declare function SharedMenu(props: SharedMenuT.Props): JSX.Element
`,
    )

    const props = resultProps(await generateApiDoc(projectRoot), 'shared-menu')

    expect(props.find((prop) => prop.name === 'classes')?.type).toBe(
      '(SharedClasses & SharedMenuT.Classes) | undefined',
    )
    expect(props.find((prop) => prop.name === 'styles')?.type).toBe(
      '(SharedStyles & SharedMenuT.Styles) | undefined',
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts props inherited by namespace Base declarations', async () => {
    const projectRoot = await createTempProject()
    await writeNodeModuleFile(
      projectRoot,
      'overlay-lib',
      'package.json',
      JSON.stringify({ name: 'overlay-lib', types: './dist/index.d.ts' }),
    )
    await writeNodeModuleFile(
      projectRoot,
      'overlay-lib',
      'dist/index.d.ts',
      `
export interface ModalProps {
  /** Controlled open state. */
  open?: boolean
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void
}
`,
    )
    await writeProjectDts(
      projectRoot,
      `
import type { ModalProps } from 'overlay-lib'

type BaseProps<B, V, E, TClasses, TStyles> = B & ([V] extends [never] ? {} : V) & {
  classes?: TClasses
  styles?: TStyles
}

declare namespace DialogT {
  type Variant = never
  interface Classes {}
  interface Styles {}
  interface Base extends Pick<ModalProps, 'open' | 'onOpenChange'> {
    /** Dialog title. */
    title?: string
  }
  interface Props extends BaseProps<Base, Variant, never, Classes, Styles> {}
}

declare function Dialog(props: DialogT.Props): JSX.Element
`,
    )

    const result = await generateApiDoc(projectRoot)
    const dialogDoc = result?.componentDocs.get('dialog')
    const inheritedGroup = dialogDoc?.props.inherited.find((group) =>
      group.props.some((prop) => prop.name === 'open'),
    )

    expect(dialogDoc?.props.own.find((prop) => prop.name === 'title')?.description).toBe(
      'Dialog title.',
    )
    expect(inheritedGroup?.props.map((prop) => prop.name)).toEqual(['onOpenChange', 'open'])
    expect(inheritedGroup?.props.find((prop) => prop.name === 'open')?.type).toBe(
      'boolean | undefined',
    )

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('normalizes Windows and POSIX paths for source cache comparison', () => {
    const winPath = 'E:\\project\\moraine\\dist\\index.d.mts'
    const posixPath = 'E:/project/moraine/dist/index.d.mts'
    const mixedCasePath = 'e:/PROJECT/moraine/dist/index.d.mts'

    const normalizedWin = normalizePathForComparison(winPath)
    const normalizedPosix = normalizePathForComparison(posixPath)
    const normalizedMixedCase = normalizePathForComparison(mixedCasePath)

    expect(normalizedWin).toBe(normalizedPosix)
    expect(normalizedWin.toLowerCase()).toBe(normalizedMixedCase.toLowerCase())
  })

  test('filters solid-js inherited groups while preserving External groups', () => {
    expect(shouldIncludeInheritedGroup('solid-js')).toBe(false)
    expect(shouldIncludeInheritedGroup('External')).toBe(true)
    expect(shouldIncludeInheritedGroup('@scope/package')).toBe(true)
  })
})
