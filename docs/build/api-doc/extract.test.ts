import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { generateApiDoc } from './extract'

describe('generateApiDoc', () => {
  const projectRoot = path.resolve(__dirname, '../../..')

  test('generates the frontmatter registry from types and recipes', async () => {
    const result = await generateApiDoc(projectRoot)

    expect(result.indexDoc.components).toHaveLength(44)
    expect(result.componentDocs).toHaveLength(44)
    expect(result.diagnostics).toEqual([])

    const button = result.componentDocs.get('button')
    expect(button).toMatchObject({
      name: 'Button',
      kind: 'single',
      slots: expect.arrayContaining(['root']),
      dataAttributes: [{ target: 'root', attributes: ['data-disabled', 'data-loading'] }],
    })
    expect(button?.parts[0]?.props.map((prop) => prop.name)).toEqual(
      expect.arrayContaining(['as', 'loading', 'variant', 'size']),
    )
    expect(button?.parts[0]?.props.find((prop) => prop.name === 'variant')?.default).toEqual({
      kind: 'literal',
      value: 'default',
    })

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

    const select = result.componentDocs.get('select')
    expect(select?.item?.props.map((prop) => prop.name)).toContain('value')
    expect(
      select?.dataAttributes.find((target) => target.target === 'value')?.attributes,
    ).toContain('data-placeholder')

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
    expect(form?.parts[0]?.access).toMatchObject({ kind: 'factory-member', factory: 'createForm' })
  })

  test('is deterministic', async () => {
    const first = await generateApiDoc(projectRoot)
    const second = await generateApiDoc(projectRoot)
    expect(JSON.stringify(first.indexDoc)).toBe(JSON.stringify(second.indexDoc))
    expect(JSON.stringify([...first.componentDocs])).toBe(JSON.stringify([...second.componentDocs]))
  })
})
