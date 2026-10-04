import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import * as Moraine from '../../../src/index.ts'
import { scanDocsPages } from '../routes.ts'

import { getIdentifierName, parseTypeScript } from './ast.ts'
import { generateApiDoc } from './extract.ts'

describe('generateApiDoc', () => {
  const projectRoot = path.resolve(__dirname, '../../..')

  test('generates the frontmatter registry from types and recipes', async () => {
    const result = await generateApiDoc(projectRoot, scanDocsPages(projectRoot))

    const entryPath = path.join(projectRoot, 'src/index.ts')
    const entry = await parseTypeScript(entryPath, readFileSync(entryPath, 'utf8'), 'ts')
    const publicNames = entry.program.body.flatMap((node) => {
      if (node.type !== 'ExportNamedDeclaration' || node.exportKind !== 'type') {
        return []
      }
      return node.specifiers.flatMap((specifier) => {
        const name = getIdentifierName(specifier.exported)
        return name?.endsWith('T') ? [name.slice(0, -1)] : []
      })
    })
    expect(result.indexDoc.components.map((component) => component.name).sort()).toEqual(
      publicNames.sort(),
    )
    expect([...result.componentDocs.values()].map((component) => component.name).sort()).toEqual(
      publicNames,
    )
    for (const component of result.componentDocs.values()) {
      if (component.name === 'Form') {
        continue
      }
      const exported = (Moraine as Record<string, unknown>)[component.name]
      expect(typeof exported, `${component.name}: missing public export`).toBe('function')
      const parts = Object.keys(exported as object)
        .filter((name) => /^[A-Z]/.test(name))
        .map((name) => `${component.name}.${name}`)
      expect(component.parts.map((part) => part.name).sort()).toEqual(
        [component.name, ...parts].sort(),
      )
    }
    const button = result.componentDocs.get('button')
    expect(button).toMatchObject({
      name: 'Button',
      kind: 'single',
      slots: expect.arrayContaining(['root']),
      dataAttributes: [{ target: 'root', attributes: ['data-disabled', 'data-loading'] }],
    })
    expect(button?.parts[0]).toMatchObject({ defaultElement: 'button' })
    expect(button?.parts[0]?.access).toEqual({ kind: 'export', name: 'Button' })
    expect(typeof button?.parts[0]?.props[0]?.type).toBe('string')
    expect(button?.parts[0]?.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['as', 'loading', 'variant', 'size']),
    )
    expect(button?.parts[0]?.props.find((prop) => prop.name === 'variant')?.default).toEqual({
      kind: 'literal',
      value: 'default',
    })

    const empty = result.componentDocs.get('empty')!
    expect(empty.kind).toBe('composite')
    expect(empty.slots).toEqual(['root', 'media', 'title', 'description', 'actions'])
    expect(empty.parts.map((part) => part.name)).toEqual([
      'Empty',
      'Empty.Media',
      'Empty.Title',
      'Empty.Description',
      'Empty.Actions',
    ])
    expect(empty.parts.map((part) => part.defaultElement)).toEqual([
      'div',
      'div',
      'div',
      'p',
      'div',
    ])
    expect(empty.parts[0]!.props.find((prop) => prop.name === 'size')).toMatchObject({
      type: "'sm' | 'md' | 'lg'",
      default: { kind: 'literal', value: 'md' },
    })
    for (const part of empty.parts.slice(1)) {
      expect(part.access).toMatchObject({ kind: 'attached', root: 'Empty' })
      expect(part.props.map((prop) => prop.name)).not.toEqual(expect.arrayContaining(['size']))
      expect(part.props.map((prop) => prop.name)).not.toEqual(expect.arrayContaining(['classes']))
      expect(part.props.map((prop) => prop.name)).not.toEqual(expect.arrayContaining(['styles']))
    }

    const list = result.componentDocs.get('list')
    expect(list?.parts[0]?.defaultElement).toBe('ul')
    expect(list?.parts[0]?.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['as', 'items', 'itemRender', 'virtualRender']),
    )

    const dialog = result.componentDocs.get('dialog')
    expect(dialog?.parts.map((part) => part.name)).toEqual([
      'Dialog',
      'Dialog.Trigger',
      'Dialog.Content',
      'Dialog.Header',
      'Dialog.Title',
      'Dialog.Description',
      'Dialog.Action',
      'Dialog.Body',
      'Dialog.Footer',
      'Dialog.Close',
    ])
    expect(
      dialog?.dataAttributes.find((target) => target.target === 'trigger')?.attributes,
    ).toEqual(expect.arrayContaining(['data-closed', 'data-expanded']))

    const keyboardItems = result.componentDocs
      .get('kbd-group')
      ?.parts[0]?.props.find((prop) => prop.name === 'items')
    expect(keyboardItems?.type).toBe('Item[]')
    expect(keyboardItems?.typeDetails).toContain('string & {}')
    expect(keyboardItems?.typeDetails).toContain('value: Key;')
    expect(keyboardItems?.typeDetails).toContain('symbol?: boolean;')
    expect(keyboardItems?.typeDetails).toContain('label?: string;')
    expect(keyboardItems?.typeDetails).toContain('Whether to resolve known key aliases to symbols.')
    expect(keyboardItems?.typeDetails).toMatch(/\)\[\]$/)

    const select = result.componentDocs.get('select')
    expect(select?.item?.props.map((prop) => prop.name)).toContain('value')
    expect(select?.item?.generics).toEqual([
      { name: 'Val', constraint: 'string | number', default: 'string | number' },
    ])
    expect(
      select?.dataAttributes.find((target) => target.target === 'value')?.attributes,
    ).toContain('data-placeholder')

    for (const key of ['select', 'combobox', 'multi-select']) {
      const props = result.componentDocs.get(key)!.parts[0]!.props
      const itemsType = props.find((prop) => prop.name === 'items')?.typeDetails
      expect(itemsType).toContain('value: string | number;')
      expect(itemsType).toContain("type: 'group';")
      expect(itemsType).toMatch(/items: \(?(?:string \| )?\{/)
      expect(itemsType).not.toContain('TItem')
      if (key !== 'multi-select') {
        expect(itemsType).toContain('string | {')
      }

      expect(props.map((prop) => prop.name)).toEqual(
        expect.arrayContaining([
          'itemRender',
          'itemProps',
          'listboxProps',
          'onScrollBottom',
          'scrollBottomThreshold',
          'gutter',
          'overflowPadding',
        ]),
      )
      if (key !== 'select') {
        expect(props.map((prop) => prop.name)).toEqual(
          expect.arrayContaining([
            'virtualRender',
            'scrollToItem',
            'searchValue',
            'defaultSearchValue',
            'onSearch',
            'filterItem',
            'searchMaxLength',
          ]),
        )
      } else {
        expect(props.map((prop) => prop.name)).not.toContain('virtualRender')
        expect(props.map((prop) => prop.name)).not.toContain('scrollToItem')
      }
    }
    for (const key of ['collapsible', 'sidebar-frame']) {
      const trigger = result.componentDocs
        .get(key)!
        .parts.find((part) => part.name.endsWith('.Trigger'))!
      expect(trigger.props.map((prop) => prop.name)).toEqual(
        expect.arrayContaining(['children', 'disabled']),
      )
    }
    for (const key of ['input', 'textarea', 'badge']) {
      const names = result.componentDocs.get(key)!.parts[0]!.props.map((prop) => prop.name)
      expect(names).toEqual(expect.arrayContaining(['size', 'variant']))
    }
    for (const part of result.componentDocs.get('input-group')!.parts.slice(1)) {
      expect(part.props).toContainEqual(
        expect.objectContaining({
          name: 'compact',
          type: 'boolean',
          default: { kind: 'literal', value: false },
        }),
      )
      for (const name of ['size', 'orientation', 'variant']) {
        expect(part.props.map((prop) => prop.name)).not.toContain(name)
      }
    }
    const buttonGroup = result.componentDocs.get('button-group')!
    expect(buttonGroup.parts[0]!.props.find((prop) => prop.name === 'size')?.type).toBe(
      "'sm' | 'md' | 'lg'",
    )
    const separator = buttonGroup.parts.find((part) => part.name === 'ButtonGroup.Separator')!
    expect(separator.props.find((prop) => prop.name === 'orientation')?.default).toBeUndefined()
    expect(separator.props.map((prop) => prop.name)).not.toContain('size')
    expect(separator.props.map((prop) => prop.name)).not.toContain('variant')
    expect(
      result.componentDocs.get('base-select')!.parts[0]!.props.map((prop) => prop.name),
    ).toContain('size')

    const baseSelectItem = result.componentDocs
      .get('base-select')!
      .parts.find((part) => part.name === 'BaseSelect.Item')!
    expect(baseSelectItem.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['item', 'children', 'class', 'style']),
    )
    expect(baseSelectItem.defaultElement).toBe('div')

    const checkboxGroup = result.componentDocs.get('checkbox-group')
    expect(checkboxGroup?.dataAttributes.map((target) => target.target)).toEqual(
      expect.arrayContaining(['root', 'control', 'indicator']),
    )

    const resizable = result.componentDocs.get('resizable')
    expect(resizable?.parts.map((part) => part.name)).toEqual([
      'Resizable',
      'Resizable.Panel',
      'Resizable.Handle',
    ])

    const form = result.componentDocs.get('form')
    expect(form?.parts.map((part) => part.name)).toEqual(['form.Form', 'form.Field'])
    expect(form?.parts[1]?.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['name', 'label', 'description', 'required']),
    )
    expect(form?.parts[0]?.access).toMatchObject({ kind: 'factory-member', factory: 'createForm' })
  })

  test('is deterministic', async () => {
    const pages = scanDocsPages(projectRoot)
    const first = await generateApiDoc(projectRoot, pages)
    const second = await generateApiDoc(projectRoot, pages)
    expect(JSON.stringify(first.indexDoc)).toBe(JSON.stringify(second.indexDoc))
    expect(JSON.stringify([...first.componentDocs])).toBe(JSON.stringify([...second.componentDocs]))
  })
})
