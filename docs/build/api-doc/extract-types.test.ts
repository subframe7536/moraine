import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { TypeExtractor } from './extract-types'
import { RecipeExtractor } from './recipe'

describe('TypeExtractor', () => {
  const projectRoot = path.resolve(__dirname, '../../..')
  const extractor = new TypeExtractor(projectRoot)
  const recipes = new RecipeExtractor(projectRoot)

  test('expands shared style vocabulary in component props', async () => {
    for (const [file, namespace, expected] of [
      [
        'src/form/input/input.types.ts',
        'InputT',
        { size: "'sm' | 'md' | 'lg'", variant: "'outline' | 'subtle' | 'ghost' | 'none'" },
      ],
      ['src/navigation/tabs/tabs.types.ts', 'TabsT', { orientation: "'horizontal' | 'vertical'" }],
      [
        'src/overlay/popover/popover.types.ts',
        'PopoverT',
        { placement: "'top' | 'right' | 'bottom' | 'left'", align: "'start' | 'center' | 'end'" },
      ],
    ] as const) {
      const module = await extractor.loadModule(file)
      const part = await extractor.extractPart(
        module!,
        namespace,
        'Props',
        namespace.slice(0, -1),
        true,
      )
      for (const [name, type] of Object.entries(expected)) {
        expect(part.props.find((prop) => prop.name === name)?.type).toBe(type)
      }
    }
  })

  test('only expands style aliases and stops cyclic style references', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'moraine-style-types-'))
    try {
      writeFileSync(
        path.join(directory, 'common.types.ts'),
        "export type OrdinaryAlias = 'a' | 'b'\n",
      )
      writeFileSync(
        path.join(directory, 'demo.style-types.ts'),
        "export type StyleAlias = 'x' | 'y'\nexport type StyleObject = { key: string }\nexport type CycleA = CycleB\nexport type CycleB = CycleA\n",
      )
      writeFileSync(
        path.join(directory, 'demo.types.ts'),
        "import type { OrdinaryAlias } from './common.types.ts'\nimport type { StyleAlias, StyleObject, CycleA } from './demo.style-types.ts'\nexport namespace DemoT { export interface Props { ordinary?: OrdinaryAlias; style?: StyleAlias; object?: StyleObject; cyclic?: CycleA } }\n",
      )
      const local = new TypeExtractor(directory)
      const module = await local.loadModule('demo.types.ts')
      const part = await local.extractPart(module!, 'DemoT', 'Props', 'Demo', true)
      expect(part.props.find((prop) => prop.name === 'ordinary')?.type).toBe('OrdinaryAlias')
      expect(part.props.find((prop) => prop.name === 'style')?.type).toBe("'x' | 'y'")
      expect(part.props.find((prop) => prop.name === 'object')?.type).toBe('StyleObject')
      expect(part.props.find((prop) => prop.name === 'cyclic')?.type).toBe('CycleA')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test('extracts Button component types, generics, and BaseProps', async () => {
    const module = await extractor.loadModule('src/element/button/button.types.ts')
    expect(module).toBeDefined()

    const kind = await extractor.extractKind(module!, 'ButtonT')
    expect(kind).toBe('single')

    const recipe = await recipes.extract('src/element/button/button.recipe.ts', 'Button')
    expect(recipe.slots).toEqual(['root', 'leading', 'label', 'trailing'])

    const part = await extractor.extractPart(
      module!,
      'ButtonT',
      'Props',
      'Button',
      true,
      recipe.variants,
    )

    expect(part.generics).toEqual([
      { name: 'T', constraint: 'ValidComponent', default: "'button'" },
    ])
    expect(part.defaultElement).toBe('button')

    const propNames = part.props.map((p) => p.name)
    expect(propNames).toContain('as')
    expect(propNames).toContain('loading')
    expect(propNames).toContain('disabled')
    expect(propNames).toContain('variant')
    expect(propNames).toContain('size')
    expect(propNames).toContain('class')
    expect(propNames).toContain('style')

    const loadingProp = part.props.find((p) => p.name === 'loading')
    expect(loadingProp?.default).toEqual({ kind: 'literal', value: false })

    const asProp = part.props.find((p) => p.name === 'as')
    expect(asProp?.type).toBe('T')
    expect(asProp?.default).toEqual({ kind: 'literal', value: 'button' })
  })

  test('extracts Dialog composite parts and inherited Modal props', async () => {
    const module = await extractor.loadModule('src/overlay/dialog/dialog.types.ts')
    expect(module).toBeDefined()

    const kind = await extractor.extractKind(module!, 'DialogT')
    expect(kind).toBe('composite')

    const rootPart = await extractor.extractPart(module!, 'DialogT', 'Props', 'Dialog', true)
    expect(rootPart.props.map((p) => p.name)).toContain('open')
    expect(rootPart.props.map((p) => p.name)).toContain('defaultOpen')
    expect(rootPart.props.map((p) => p.name)).toContain('onOpenChange')

    const triggerPart = await extractor.extractPart(
      module!,
      'DialogT',
      'TriggerProps',
      'Dialog.Trigger',
      false,
    )
    expect(triggerPart.props.map((p) => p.name)).toContain('as')
    expect(triggerPart.props.map((p) => p.name)).toContain('disabled')

    const contentPart = await extractor.extractPart(
      module!,
      'DialogT',
      'ContentProps',
      'Dialog.Content',
      false,
    )
    expect(contentPart.props.map((p) => p.name)).toContain('title')
    expect(contentPart.props.map((p) => p.name)).toContain('close')
  })

  test('extracts Select item metadata and props', async () => {
    const module = await extractor.loadModule('src/form/select/select.types.ts')
    expect(module).toBeDefined()

    const item = await extractor.extractItem(module!, 'SelectT')
    expect(item).toBeDefined()
    expect(item?.props.map((p) => p.name)).toEqual(
      expect.arrayContaining(['value', 'label', 'disabled', 'icon', 'description']),
    )

    const recipe = await recipes.extract('src/form/select/select.recipe.ts', 'Select')
    const part = await extractor.extractPart(
      module!,
      'SelectT',
      'Props',
      'Select',
      true,
      recipe.variants,
    )
    expect(part.props.map((p) => p.name)).toContain('value')
    expect(part.props.map((p) => p.name)).toContain('onChange')
    expect(part.props.map((p) => p.name)).toContain('placeholder')

    const placeholder = part.props.find((p) => p.name === 'placeholder')
    expect(placeholder?.default).toEqual({ kind: 'literal', value: '' })
  })

  test('extracts Form factory parts and schemas', async () => {
    const module = await extractor.loadModule('src/form/form/form.types.ts')
    expect(module).toBeDefined()

    const formPart = await extractor.extractPart(module!, 'FormT', 'Props', 'form.Form', true)
    expect(formPart.generics).toEqual([
      { name: 'TSchema', constraint: 'FormSchema', default: 'FormSchema' },
    ])
    expect(formPart.props.map((p) => p.name)).toContain('onSubmit')
    expect(formPart.props.map((p) => p.name)).toContain('class')
    expect(formPart.props.map((p) => p.name)).toContain('style')
  })

  test('distinguishes optional property (?) from required undefined (T | undefined)', async () => {
    const fixtureSource = `
export namespace TestT {
  export interface Props {
    requiredUndefined: string | undefined
    optionalString?: string
  }
}
`
    const source = await import('./ast').then((m) =>
      m.parseTypeScript('test.ts', fixtureSource, 'ts'),
    )
    const nss = new Map()
    for (const s of source.program.body) {
      if (s.type === 'ExportNamedDeclaration' && s.declaration?.type === 'TSModuleDeclaration') {
        nss.set((s.declaration.id as any).name, s.declaration)
      }
    }
    const parsed = {
      filePath: 'test.ts',
      source,
      declarations: new Map(),
      namespaces: nss,
      imports: new Map(),
    }

    const part = await extractor.extractPart(parsed, 'TestT', 'Props', 'Test', true)
    const reqUndef = part.props.find((p) => p.name === 'requiredUndefined')
    const optStr = part.props.find((p) => p.name === 'optionalString')

    expect(reqUndef?.optional).toBe(false)
    expect(optStr?.optional).toBe(true)
  })

  test('distinguishes all default kinds: empty string, false, 0, null, expression, and none', async () => {
    const fixtureSource = `
export namespace DefaultsT {
  export interface Props {
    /** @default "" */
    emptyStr?: string
    /** @default false */
    boolFalse?: boolean
    /** @default 0 */
    numZero?: number
    /** @default null */
    nullVal?: string | null
    /** @default ['a', 'b'] */
    exprVal?: string[]
    noDefault?: string
  }
}
`
    const source = await import('./ast').then((m) =>
      m.parseTypeScript('defaults.ts', fixtureSource, 'ts'),
    )
    const nss = new Map()
    for (const s of source.program.body) {
      if (s.type === 'ExportNamedDeclaration' && s.declaration?.type === 'TSModuleDeclaration') {
        nss.set((s.declaration.id as any).name, s.declaration)
      }
    }
    const parsed = {
      filePath: 'defaults.ts',
      source,
      declarations: new Map(),
      namespaces: nss,
      imports: new Map(),
    }

    const part = await extractor.extractPart(parsed, 'DefaultsT', 'Props', 'Defaults', true)
    const emptyStr = part.props.find((p) => p.name === 'emptyStr')
    const boolFalse = part.props.find((p) => p.name === 'boolFalse')
    const numZero = part.props.find((p) => p.name === 'numZero')
    const nullVal = part.props.find((p) => p.name === 'nullVal')
    const exprVal = part.props.find((p) => p.name === 'exprVal')
    const noDefault = part.props.find((p) => p.name === 'noDefault')

    expect(emptyStr?.default).toEqual({ kind: 'literal', value: '' })
    expect(boolFalse?.default).toEqual({ kind: 'literal', value: false })
    expect(numZero?.default).toEqual({ kind: 'literal', value: 0 })
    expect(nullVal?.default).toEqual({ kind: 'literal', value: null })
    expect(exprVal?.default).toEqual({ kind: 'expression', text: "['a', 'b']" })
    expect(noDefault?.default).toBeUndefined()
  })

  test('handles never capability for Slot, Variant, Classes, Styles without manufacturing props', async () => {
    const fixtureSource = `
import type { BaseProps } from '../../shared/types'
export namespace NeverT {
  export type Slot = never
  export type Variant = never
  export type Classes = never
  export type Styles = never

  export interface Base {
    title?: string
  }

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}
`
    const source = await import('./ast').then((m) =>
      m.parseTypeScript('never.ts', fixtureSource, 'ts'),
    )
    const nss = new Map()
    for (const s of source.program.body) {
      if (s.type === 'ExportNamedDeclaration' && s.declaration?.type === 'TSModuleDeclaration') {
        nss.set((s.declaration.id as any).name, s.declaration)
      }
    }
    const parsed = {
      filePath: 'never.ts',
      source,
      declarations: new Map(),
      namespaces: nss,
      imports: new Map(),
    }

    const part = await extractor.extractPart(parsed, 'NeverT', 'Props', 'Never', true)
    const propNames = part.props.map((p) => p.name)
    expect(propNames).toContain('title')
    expect(propNames).toContain('class')
    expect(propNames).toContain('style')
    expect(propNames).not.toContain('classes')
    expect(propNames).not.toContain('styles')
    expect(propNames).not.toContain('variant')
    expect(propNames).not.toContain('size')
  })

  test('expands indexed access types in CheckboxGroup and Pagination', async () => {
    const checkboxGroupModule = await extractor.loadModule(
      'src/form/checkbox-group/checkbox-group.types.ts',
    )
    expect(checkboxGroupModule).toBeDefined()

    const cbPart = await extractor.extractPart(
      checkboxGroupModule!,
      'CheckboxGroupT',
      'Props',
      'CheckboxGroup',
      true,
    )
    const cbItem = await extractor.extractItem(checkboxGroupModule!, 'CheckboxGroupT')

    const indicatorProp = cbPart.props.find((p) => p.name === 'indicator')
    expect(indicatorProp?.type).toBe("'start' | 'end' | 'hidden'")

    const checkedIconProp = cbPart.props.find((p) => p.name === 'checkedIcon')
    expect(checkedIconProp?.type).toBe('IconT.Name')

    const indeterminateIconProp = cbPart.props.find((p) => p.name === 'indeterminateIcon')
    expect(indeterminateIconProp?.type).toBe('IconT.Name')

    // Verify CheckboxGroup item props have expanded types
    const itemCheckedIcon = cbItem?.props.find((p) => p.name === 'checkedIcon')
    expect(itemCheckedIcon?.type).toBe('IconT.Name')

    const itemIndeterminate = cbItem?.props.find((p) => p.name === 'indeterminate')
    expect(itemIndeterminate?.type).toBe('boolean')

    // Verify Pagination variants expanded from ButtonStyleVariant['variant']
    const paginationModule = await extractor.loadModule(
      'src/navigation/pagination/pagination.types.ts',
    )
    expect(paginationModule).toBeDefined()

    const paginationRecipe = await recipes.extract(
      'src/navigation/pagination/pagination.recipe.ts',
      'Pagination',
    )
    const paginationPart = await extractor.extractPart(
      paginationModule!,
      'PaginationT',
      'Props',
      'Pagination',
      true,
      paginationRecipe.variants,
    )
    const variantProp = paginationPart.props.find((p) => p.name === 'variant')
    expect(variantProp?.type).toBe(
      "'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'",
    )
  })
})
