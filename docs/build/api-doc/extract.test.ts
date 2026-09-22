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
    expect(select?.item).not.toHaveProperty('name')
    expect(select?.item?.generics).toEqual([
      { name: 'Val', constraint: 'string | number', default: 'string | number' },
    ])
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
