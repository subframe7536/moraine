import { describe, expect, test } from 'vitest'

import {
  createApiReferenceModel,
  formatDefaultValue,
  getApiReferenceTocEntries,
  getDomSlotName,
} from './presentation'
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
        { name: 'open', optional: false, type: 'cls_variant0.Boolean_$' },
        { name: 'children', optional: true, type: 'JSX.Element' },
        { name: 'alpha', optional: true, type: 'string' },
        {
          name: 'items',
          optional: false,
          type: 'Item[]',
          typeDetails: '(string | { value: string; })[]',
        },
        { name: 'onChange', optional: true, type: '(value: string) => void' },
      ],
    },
    {
      id: 'trigger',
      name: 'Demo.Trigger',
      access: { kind: 'attached', root: 'Demo', member: 'Trigger' },
      defaultElement: 'button',
      generics: [{ name: 'T', constraint: 'string | number', default: 'string' }],
      props: [{ name: 'disabled', optional: true, type: 'boolean' }],
    },
  ],
  item: {
    generics: [{ name: 'Value', constraint: 'string | number', default: 'string' }],
    props: [
      {
        name: 'value',
        optional: false,
        type: 'Value',
        default: { kind: 'literal', value: '' },
      },
    ],
  },
  slots: ['root', 'control', 'trigger', 'content', 'unused'],
  dataAttributes: [
    { target: 'root', attributes: ['data-disabled', 'data-unknown'] },
    { target: 'control', attributes: ['data-disabled', 'data-invalid'] },
    { target: 'trigger', attributes: ['data-disabled', 'data-expanded'] },
    { target: 'content', attributes: ['data-expanded'] },
  ],
}

describe('createApiReferenceModel', () => {
  test('keeps deterministic prop ordering with common props last', () => {
    const model = createApiReferenceModel(component)!
    expect(model.parts[0]?.props.map((prop) => prop.name)).toEqual([
      'alpha',
      'items',
      'onChange',
      'open',
      'children',
      'class',
    ])
    expect(model.parts[0]?.props.find((prop) => prop.name === 'open')?.type).toBe('Boolean')
  })

  test('formats literal and expression defaults', () => {
    expect(formatDefaultValue({ kind: 'literal', value: '' })).toBe('""')
    expect(formatDefaultValue({ kind: 'literal', value: 'value' })).toBe("'value'")
    expect(formatDefaultValue({ kind: 'literal', value: false })).toBe('false')
    expect(formatDefaultValue({ kind: 'expression', text: 'items.length' })).toBe('items.length')
  })

  test('shows concise triggers and complete types in prop details', () => {
    const model = createApiReferenceModel(component)!
    expect(model).not.toHaveProperty('item')
    expect(model.parts[0]?.props.find((prop) => prop.name === 'items')).toMatchObject({
      summaryType: 'Item[]',
      type: '(string | { value: string; })[]',
    })
    expect(model.parts[0]?.props.find((prop) => prop.name === 'onChange')).toMatchObject({
      summaryType: 'Function',
      type: '(value: string) => void',
    })
  })

  test('derives concise composite headings while retaining full names', () => {
    const model = createApiReferenceModel(component)!
    expect(model.parts.map((part) => [part.heading, part.shortHeading])).toEqual([
      ['Demo', 'Demo'],
      ['Demo.Trigger', 'Trigger'],
    ])
  })

  test('aggregates attributes and follows declared slot order', () => {
    const model = createApiReferenceModel(component)!
    expect(model.attributes?.slots).toEqual([
      'demo',
      'demo-control',
      'demo-trigger',
      'demo-content',
      'demo-unused',
    ])
    expect(model.attributes?.items).toEqual([
      {
        name: 'data-disabled',
        slots: ['demo', 'demo-control', 'demo-trigger'],
        description: 'Present when the component, slot, or item is disabled.',
      },
      { name: 'data-unknown', slots: ['demo'] },
      {
        name: 'data-invalid',
        slots: ['demo-control'],
        description: 'Present when the field or form has a validation error.',
      },
      {
        name: 'data-expanded',
        slots: ['demo-trigger', 'demo-content'],
        description: 'Present when the panel, accordion, or menu is expanded.',
      },
    ])
  })

  test('maps forwarded style keys to the child DOM owner', () => {
    expect(getDomSlotName('avatar-group', 'fallbackContent')).toBe('avatar-fallback-content')
    expect(getDomSlotName('checkbox-group', 'control')).toBe('checkbox-control')
    expect(getDomSlotName('pagination', 'controlLabel')).toBe('button-label')
    expect(getDomSlotName('select', 'itemLabel')).toBe('select-item-label')
  })

  test('uses the simplified API hierarchy in the TOC', () => {
    expect(getApiReferenceTocEntries(component)).toEqual([
      { id: 'api-attributes', label: 'Attributes', level: 1 },
      { id: 'api-reference', label: 'Props', level: 1 },
      { id: 'api-demo', label: 'Demo', level: 2 },
      { id: 'api-trigger', label: 'Trigger', level: 2 },
    ])
  })

  test('omits a redundant props entry for single components', () => {
    expect(
      getApiReferenceTocEntries({
        ...component,
        kind: 'single',
        parts: [component.parts[0]!],
        item: undefined,
        dataAttributes: [],
      }),
    ).toEqual([{ id: 'api-reference', label: 'Props', level: 1 }])
  })

  test('includes part entries for single components with multiple parts', () => {
    expect(
      getApiReferenceTocEntries({
        ...component,
        kind: 'single',
        dataAttributes: [],
      }),
    ).toEqual([
      { id: 'api-reference', label: 'Props', level: 1 },
      { id: 'api-demo', label: 'Demo', level: 2 },
      { id: 'api-trigger', label: 'Trigger', level: 2 },
    ])
  })
})
