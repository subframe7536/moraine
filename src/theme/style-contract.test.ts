import { createSignal, flush } from 'solid-js'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { createDataAttributes } from './style-contract'
import type { DataAttributeContract } from './style-contract'
describe('style contract helpers', () => {
  it('normalizes static data attribute values and prefixes their names', () => {
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

  it('reads accessor state lazily on every attribute read', () => {
    const [open, setOpen] = createSignal(false)
    const attributes = createDataAttributes('expanded')(() => state)
    const state = { expanded: open }

    expect(attributes['data-expanded']).toBeUndefined()
    flush(() => setOpen(true))
    expect(attributes['data-expanded']).toBe('')
  })

  it('infers camel-case state and exact data attribute keys', () => {
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

  it('constrains contract targets without erasing resolver state', () => {
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
})
