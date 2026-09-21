import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { discoverPublicComponents } from './discovery'

describe('discoverPublicComponents', () => {
  const projectRoot = path.resolve(__dirname, '../../..')

  test('discovers all public components in Moraine', async () => {
    const components = await discoverPublicComponents(projectRoot)
    const keys = components.map((c) => c.key)

    expect(keys).toContain('button')
    expect(keys).toContain('button-group')
    expect(keys).toContain('dialog')
    expect(keys).toContain('form')
    expect(keys).toContain('field')
    expect(keys).toContain('base-select')
    expect(keys).toContain('select')
    expect(keys).toContain('multi-select')
    expect(keys).toContain('collapsible')

    expect(components.length).toBe(44)
  })

  test('discovers attached parts for Dialog', async () => {
    const components = await discoverPublicComponents(projectRoot)
    const dialog = components.find((c) => c.key === 'dialog')
    expect(dialog).toBeDefined()
    expect(dialog?.parts.map((p) => p.name)).toEqual([
      'Dialog',
      'Dialog.Trigger',
      'Dialog.Content',
      'Dialog.Close',
    ])
    expect(dialog?.parts[1]?.access).toEqual({
      kind: 'attached',
      root: 'Dialog',
      member: 'Trigger',
    })
  })

  test('applies special ownership registry for Form', async () => {
    const components = await discoverPublicComponents(projectRoot)
    const form = components.find((c) => c.key === 'form')
    expect(form).toBeDefined()
    expect(form?.parts.map((p) => p.name)).toEqual(['form.Form', 'form.Field'])
    expect(form?.parts[0]?.access).toEqual({
      kind: 'factory-member',
      factory: 'createForm',
      member: 'Form',
    })
    expect(form?.parts[1]?.access).toEqual({
      kind: 'factory-member',
      factory: 'createForm',
      member: 'Field',
    })
  })

  test('discovers BaseSelect with all attached parts', async () => {
    const components = await discoverPublicComponents(projectRoot)
    const baseSelect = components.find((c) => c.key === 'base-select')
    expect(baseSelect).toBeDefined()
    expect(baseSelect?.parts.map((p) => p.name)).toEqual([
      'BaseSelect',
      'BaseSelect.Control',
      'BaseSelect.Trigger',
      'BaseSelect.Content',
      'BaseSelect.Listbox',
      'BaseSelect.Item',
      'BaseSelect.Group',
      'BaseSelect.GroupLabel',
      'BaseSelect.Separator',
      'BaseSelect.Empty',
    ])
  })
})
