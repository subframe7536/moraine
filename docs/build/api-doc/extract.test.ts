import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { scanDocsPages } from '../routes.ts'

import { generateApiDoc } from './extract.ts'

describe('generateApiDoc', () => {
  const projectRoot = path.resolve(__dirname, '../../..')

  test('generates the frontmatter registry from types and recipes', async () => {
    const result = await generateApiDoc(projectRoot, scanDocsPages(projectRoot))

    expect(result.indexDoc.components).toHaveLength(44)
    expect(result.componentDocs).toHaveLength(44)
    const button = result.componentDocs.get('button')
    expect(button).toMatchObject({
      name: 'Button',
      kind: 'single',
      slots: expect.arrayContaining(['root']),
      dataAttributes: [{ target: 'root', attributes: ['data-disabled', 'data-loading'] }],
    })
    expect(button).not.toHaveProperty('category')
    expect(button?.parts[0]).toMatchObject({ defaultElement: 'button' })
    expect(button?.parts[0]).not.toHaveProperty('rendering')
    expect(button?.parts[0]?.access).toEqual({ kind: 'export', name: 'Button' })
    expect(typeof button?.parts[0]?.props[0]?.type).toBe('string')
    expect(button?.parts[0]?.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['as', 'loading', 'variant', 'size']),
    )
    expect(button?.parts[0]?.props.find((prop) => prop.name === 'variant')?.default).toEqual({
      kind: 'literal',
      value: 'default',
    })

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
    expect(select?.item).not.toHaveProperty('name')
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
          'virtualRender',
          'scrollToItem',
          'onScrollBottom',
          'scrollBottomThreshold',
          'gutter',
          'overflowPadding',
        ]),
      )
      if (key !== 'select') {
        expect(props.map((prop) => prop.name)).toEqual(
          expect.arrayContaining([
            'searchValue',
            'defaultSearchValue',
            'onSearch',
            'filterItem',
            'searchMaxLength',
          ]),
        )
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
      expect(names).not.toContain('grouped')
      expect(names).not.toContain('groupedOrientation')
      expect(names).not.toContain('square')
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
    expect(buttonGroup.parts[0]!.props.find((prop) => prop.name === 'size')?.type).toContain(
      "'icon-xl'",
    )
    const separator = buttonGroup.parts.find((part) => part.name === 'ButtonGroup.Separator')!
    expect(separator.props.find((prop) => prop.name === 'orientation')?.default).toEqual({
      kind: 'literal',
      value: 'vertical',
    })
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
    expect(baseSelectItem.props.map((prop) => prop.name)).not.toContain('value')
    expect(baseSelectItem.props.map((prop) => prop.name)).not.toContain('label')
    expect(baseSelectItem.props.map((prop) => prop.name)).not.toContain('disabled')
    expect(baseSelectItem.props.map((prop) => prop.name)).not.toContain('as')
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

    expect(Object.keys(result.indexDoc.components[0] ?? {}).sort()).toEqual([
      'category',
      'key',
      'name',
    ])
  })

  test('is deterministic', async () => {
    const pages = scanDocsPages(projectRoot)
    const first = await generateApiDoc(projectRoot, pages)
    const second = await generateApiDoc(projectRoot, pages)
    expect(JSON.stringify(first.indexDoc)).toBe(JSON.stringify(second.indexDoc))
    expect(JSON.stringify([...first.componentDocs])).toBe(JSON.stringify([...second.componentDocs]))
  })
})
