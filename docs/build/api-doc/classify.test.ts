import { describe, expect, test } from 'vitest'

import { classifyPropGroup, derivePropTraits, deriveStateRelation } from './classify'

describe('classifyPropGroup and state relations', () => {
  test('classifies state props and relations', () => {
    expect(classifyPropGroup('value')).toBe('state')
    expect(classifyPropGroup('defaultValue')).toBe('state')
    expect(classifyPropGroup('onChange')).toBe('state')
    expect(deriveStateRelation('value')).toEqual({ key: 'value', role: 'value' })
    expect(deriveStateRelation('defaultValue')).toEqual({ key: 'value', role: 'default' })
    expect(deriveStateRelation('onChange')).toEqual({ key: 'value', role: 'change' })

    expect(classifyPropGroup('open')).toBe('state')
    expect(classifyPropGroup('defaultOpen')).toBe('state')
    expect(classifyPropGroup('onOpenChange')).toBe('state')
    expect(deriveStateRelation('open')).toEqual({ key: 'open', role: 'value' })
    expect(deriveStateRelation('defaultOpen')).toEqual({ key: 'open', role: 'default' })
    expect(deriveStateRelation('onOpenChange')).toEqual({ key: 'open', role: 'change' })
  })

  test('classifies data props', () => {
    expect(classifyPropGroup('items')).toBe('data')
    expect(classifyPropGroup('itemToLabelString')).toBe('data')
    expect(classifyPropGroup('isItemDisabled')).toBe('data')
  })

  test('classifies form props', () => {
    expect(classifyPropGroup('name')).toBe('form')
    expect(classifyPropGroup('required')).toBe('form')
    expect(classifyPropGroup('readOnly')).toBe('form')
    expect(classifyPropGroup('serializeValue')).toBe('form')
    expect(classifyPropGroup('onReset')).toBe('form')
  })

  test('classifies rendering props', () => {
    expect(classifyPropGroup('children')).toBe('rendering')
    expect(classifyPropGroup('itemRender')).toBe('rendering')
    expect(classifyPropGroup('emptyRender')).toBe('rendering')
    expect(classifyPropGroup('leadingIcon')).toBe('rendering')
    expect(classifyPropGroup('trailingIcon')).toBe('rendering')
  })

  test('classifies styling props', () => {
    expect(classifyPropGroup('class')).toBe('styling')
    expect(classifyPropGroup('style')).toBe('styling')
    expect(classifyPropGroup('classes')).toBe('styling')
    expect(classifyPropGroup('styles')).toBe('styling')
    expect(classifyPropGroup('variant')).toBe('styling')
    expect(classifyPropGroup('size')).toBe('styling')
  })

  test('classifies behavior props and positioning traits', () => {
    expect(classifyPropGroup('dismissible')).toBe('behavior')
    expect(classifyPropGroup('loop')).toBe('behavior')
    expect(classifyPropGroup('closeOnSelect')).toBe('behavior')
    expect(classifyPropGroup('onExitComplete')).toBe('behavior')

    expect(classifyPropGroup('gutter')).toBe('behavior')
    expect(derivePropTraits('gutter')).toContain('positioning')

    expect(classifyPropGroup('overflowPadding')).toBe('behavior')
    expect(derivePropTraits('overflowPadding')).toContain('positioning')
  })

  test('identifies callback and render-prop traits', () => {
    expect(derivePropTraits('onChange', '(value: string) => void')).toContain('callback')
    expect(derivePropTraits('onClosePrevent', '() => void')).toContain('callback')

    const itemRenderTraits = derivePropTraits(
      'itemRender',
      '(state: ItemRenderProps) => JSX.Element',
    )
    expect(itemRenderTraits).toContain('render-prop')
    expect(itemRenderTraits).toContain('callback')
  })
})
