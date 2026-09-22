import { createRoot, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { applyDataAttributes, createCssVariables, createDataAttributes } from './style-contract.ts'

describe('style contract helpers', () => {
  test('normalizes static data attribute values', () => {
    const attributes = createDataAttributes({
      truthy: true,
      falsy: false,
      nil: null,
      missing: undefined,
      text: 'value',
      count: 2,
    })

    expect({ ...attributes }).toEqual({
      truthy: '',
      falsy: undefined,
      nil: undefined,
      missing: undefined,
      text: 'value',
      count: 2,
    })
  })

  test('keeps stable enumerable getters while accessors update', () => {
    createRoot((dispose) => {
      const [active, setActive] = createSignal(false)
      const attributes = createDataAttributes({ 'data-active': active })
      const descriptor = Object.getOwnPropertyDescriptor(attributes, 'data-active')

      expect(descriptor?.get).toBeTypeOf('function')
      expect(attributes['data-active']).toBeUndefined()
      setActive(true)
      expect(attributes['data-active']).toBe('')
      expect(Object.getOwnPropertyDescriptor(attributes, 'data-active')?.get).toBe(descriptor?.get)
      dispose()
    })
  })

  test('keeps CSS variable values reactive and omits empty sources', () => {
    createRoot((dispose) => {
      const [size, setSize] = createSignal<number | undefined>(12)
      const variables = createCssVariables({
        '--size': () => (size() === undefined ? undefined : `${size()}px`),
        '--hidden': false,
      })

      expect(variables['--size']).toBe('12px')
      expect(variables['--hidden']).toBeUndefined()
      setSize(18)
      expect(variables['--size']).toBe('18px')
      setSize(undefined)
      expect(variables['--size']).toBeUndefined()
      dispose()
    })
  })

  test('applies and removes normalized attributes without replacing the element', () => {
    const element = document.createElement('div')
    let active = true
    const attributes = createDataAttributes({ 'data-active': () => active })

    applyDataAttributes(element, attributes)
    expect(element.getAttribute('data-active')).toBe('')

    active = false
    applyDataAttributes(element, attributes)
    expect(element.hasAttribute('data-active')).toBe(false)
  })
})
