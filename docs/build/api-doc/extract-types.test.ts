import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { TypeExtractor } from './extract-types'

describe('TypeExtractor', () => {
  const projectRoot = path.resolve(__dirname, '../../..')
  const extractor = new TypeExtractor(projectRoot)

  test('extracts Button component types, generics, and BaseProps', async () => {
    const module = await extractor.loadModule('src/elements/button/button.types.ts')
    expect(module).toBeDefined()

    const kind = await extractor.extractKind(module!, 'ButtonT')
    expect(kind).toBe('single')

    const slots = await extractor.extractSlots(module!, 'ButtonT')
    expect(slots.map((s) => s.name)).toEqual(['label', 'leading', 'loading', 'root', 'trailing'])

    const part = await extractor.extractPart(module!, 'ButtonT', 'Props', 'Button', true)

    expect(part.generics).toEqual([
      { name: 'T', constraint: 'ValidComponent', default: "'button'" },
    ])
    expect(part.rendering).toEqual({
      rendersDom: true,
      defaultElement: 'button',
      asProp: 'as',
      polymorphic: { name: 'T', constraint: 'ValidComponent', default: "'button'" },
    })

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
    expect(asProp?.type.text).toBe('T')
    expect(asProp?.default).toEqual({ kind: 'literal', value: 'button' })
  })

  test('extracts Dialog composite slots, parts, and contentClose slot', async () => {
    const module = await extractor.loadModule('src/overlays/dialog/dialog.types.ts')
    expect(module).toBeDefined()

    const kind = await extractor.extractKind(module!, 'DialogT')
    expect(kind).toBe('composite')

    const slots = await extractor.extractSlots(module!, 'DialogT')
    expect(slots.map((s) => s.name)).toContain('contentClose')
    expect(slots.map((s) => s.name)).not.toContain('close')

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
    const module = await extractor.loadModule('src/forms/select/select.types.ts')
    expect(module).toBeDefined()

    const item = await extractor.extractItem(module!, 'SelectT')
    expect(item).toBeDefined()
    expect(item?.props.map((p) => p.name)).toEqual(
      expect.arrayContaining(['value', 'label', 'disabled', 'icon', 'description']),
    )

    const part = await extractor.extractPart(module!, 'SelectT', 'Props', 'Select', true)
    expect(part.props.map((p) => p.name)).toContain('value')
    expect(part.props.map((p) => p.name)).toContain('onChange')
    expect(part.props.map((p) => p.name)).toContain('placeholder')

    const placeholder = part.props.find((p) => p.name === 'placeholder')
    expect(placeholder?.default).toEqual({ kind: 'literal', value: '' })
  })

  test('extracts Form factory parts and schemas', async () => {
    const module = await extractor.loadModule('src/forms/form/form.types.ts')
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

    const slots = await extractor.extractSlots(parsed, 'NeverT')
    expect(slots).toEqual([])

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
      'src/forms/checkbox-group/checkbox-group.types.ts',
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

    // Verify CheckboxGroup props have expanded types rather than CheckboxProps<...>['...']
    const indicatorProp = cbPart.props.find((p) => p.name === 'indicator')
    expect(indicatorProp?.type.text).toBe("'start' | 'end' | 'hidden'")

    const checkedIconProp = cbPart.props.find((p) => p.name === 'checkedIcon')
    expect(checkedIconProp?.type.text).toBe('IconT.Name')

    const indeterminateIconProp = cbPart.props.find((p) => p.name === 'indeterminateIcon')
    expect(indeterminateIconProp?.type.text).toBe('IconT.Name')

    // Verify CheckboxGroup item props have expanded types
    const itemCheckedIcon = cbItem?.props.find((p) => p.name === 'checkedIcon')
    expect(itemCheckedIcon?.type.text).toBe('IconT.Name')

    const itemIndeterminate = cbItem?.props.find((p) => p.name === 'indeterminate')
    expect(itemIndeterminate?.type.text).toBe('boolean')

    // Verify Pagination variants expanded from ButtonStyleVariant['variant']
    const paginationModule = await extractor.loadModule(
      'src/navigation/pagination/pagination.types.ts',
    )
    expect(paginationModule).toBeDefined()

    const paginationPart = await extractor.extractPart(
      paginationModule!,
      'PaginationT',
      'Props',
      'Pagination',
      true,
    )
    const variantProp = paginationPart.props.find((p) => p.name === 'variant')
    expect(variantProp?.type.text).toBe(
      "'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'",
    )
  })
})
