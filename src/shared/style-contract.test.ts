import { createRoot, createSignal } from 'solid-js'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { applyDataAttributes, createDataAttributes } from './style-contract.ts'
import type { DataAttributeContract } from './style-contract.ts'

describe('style contract helpers', () => {
  test('normalizes static data attribute values and prefixes their names', () => {
    const attributes = createDataAttributes(
      'truthy',
      'falsy',
      'nil',
      'missing',
      'text',
      'count',
    )({
      truthy: true,
      falsy: false,
      nil: null,
      missing: undefined,
      text: 'value',
      count: 2,
    })

    expect({ ...attributes }).toEqual({
      'data-truthy': '',
      'data-falsy': undefined,
      'data-nil': undefined,
      'data-missing': undefined,
      'data-text': 'value',
      'data-count': 2,
    })
  })

  test('infers camel-case state and exact data attribute keys', () => {
    const overlay = createDataAttributes('closed', 'overlay-scroll')
    const attributes = overlay({ closed: true, overlayScroll: 'auto' })

    expectTypeOf(attributes).toHaveProperty('data-closed')
    expectTypeOf(attributes).toHaveProperty('data-overlay-scroll')
    expect(attributes['data-overlay-scroll']).toBe('auto')

    // @ts-expect-error State properties are camel-case rather than kebab-case.
    overlay({ 'overlay-scroll': true })
    // @ts-expect-error Attribute names must omit the data- prefix.
    createDataAttributes('data-expanded')
  })

  test('constrains contract targets without erasing resolver state', () => {
    const contract = {
      root: createDataAttributes('disabled'),
    } satisfies DataAttributeContract<'root' | 'trigger'>

    expect(contract.root({ disabled: true })['data-disabled']).toBe('')

    const invalidContract = {
      // @ts-expect-error Contract keys must be declared slots.
      content: createDataAttributes('expanded'),
    } satisfies DataAttributeContract<'root'>
    expect(invalidContract.content).toBeTypeOf('function')
  })

  test('keeps stable enumerable getters while accessors update', () => {
    createRoot((dispose) => {
      const [active, setActive] = createSignal(false)
      const attributes = createDataAttributes('active')({ active })
      const descriptor = Object.getOwnPropertyDescriptor(attributes, 'data-active')

      expect(descriptor?.get).toBeTypeOf('function')
      expect(attributes['data-active']).toBeUndefined()
      setActive(true)
      expect(attributes['data-active']).toBe('')
      expect(Object.getOwnPropertyDescriptor(attributes, 'data-active')?.get).toBe(descriptor?.get)
      dispose()
    })
  })

  test('applies and removes normalized attributes without replacing the element', () => {
    const element = document.createElement('div')
    let active = true
    const attributes = createDataAttributes('active')({ active: () => active })

    applyDataAttributes(element, attributes)
    expect(element.getAttribute('data-active')).toBe('')

    active = false
    applyDataAttributes(element, attributes)
    expect(element.hasAttribute('data-active')).toBe(false)
  })
})
