import { describe, expect, test } from 'vitest'

import { createApiReferenceModel, getApiReferenceTocEntries } from './presentation'
import type { ComponentApi } from './types'

const component: ComponentApi = {
  key: 'demo',
  name: 'Demo',
  kind: 'composite',
  parts: [
    {
      id: 'demo',
      name: 'Demo',
      access: { kind: 'export', name: 'Demo' },
      props: [
        { name: 'class', optional: true, type: 'string' },
        { name: 'open', optional: false, type: 'boolean' },
      ],
    },
    {
      id: 'trigger',
      name: 'Demo.Trigger',
      access: { kind: 'attached', root: 'Demo', member: 'Trigger' },
      defaultElement: 'button',
      props: [{ name: 'disabled', optional: true, type: 'boolean' }],
    },
  ],
  item: {
    generics: [{ name: 'Value', constraint: 'string | number', default: 'string' }],
    props: [{ name: 'value', optional: false, type: 'Value' }],
  },
  slots: ['trigger', 'content'],
  dataAttributes: [{ target: 'trigger', attributes: ['data-disabled', 'data-expanded'] }],
}

describe('createApiReferenceModel', () => {
  test('keeps props ungrouped and common props last', () => {
    const model = createApiReferenceModel(component)!
    expect(model.parts[0]?.props.map((prop) => prop.name)).toEqual(['open', 'class'])
    expect(model.parts[0]?.rendersDom).toBe(false)
  })

  test('creates one component-level styling contract without accessibility anatomy', () => {
    const model = createApiReferenceModel(component)!
    expect(model.styling.slots).toEqual(['trigger', 'content'])
    expect(model.styling.dataAttributes[0]).toMatchObject({
      target: 'trigger',
      attributes: [{ name: 'data-disabled' }, { name: 'data-expanded' }],
    })
    expect(model.parts[0]).not.toHaveProperty('accessibility')
    expect(model.parts[0]).not.toHaveProperty('anatomy')
  })

  test('presents item generic parameters', () => {
    const model = createApiReferenceModel(component)!
    expect(model.item?.genericsSignature).toBe('<Value extends string | number = string>')
  })

  test('adds one DOM & State TOC entry after composite parts', () => {
    expect(getApiReferenceTocEntries(component)).toEqual(
      expect.arrayContaining([
        { id: 'api-demo', label: 'Demo', level: 2 },
        { id: 'api-trigger', label: 'Demo.Trigger', level: 2 },
        { id: 'dom-styling', label: 'DOM & State', level: 2 },
      ]),
    )
  })
})
