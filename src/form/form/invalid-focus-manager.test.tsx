import { describe, expect, test } from 'vitest'

import { isControlAssociatedWithForm } from './invalid-focus-manager'

describe('isControlAssociatedWithForm', () => {
  test('uses native form association and the visible trigger subtree', () => {
    const first = document.createElement('form')
    first.id = 'first-form'
    const second = document.createElement('form')
    const externalInput = document.createElement('input')
    externalInput.setAttribute('form', 'first-form')
    const internalInput = document.createElement('input')
    internalInput.setAttribute('form', 'first-form')
    const trigger = document.createElement('div')
    second.append(internalInput, trigger)
    document.body.append(first, second, externalInput)

    try {
      expect(isControlAssociatedWithForm(externalInput, first)).toBe(true)
      expect(isControlAssociatedWithForm(internalInput, second)).toBe(false)
      expect(isControlAssociatedWithForm(trigger, second)).toBe(true)
      expect(isControlAssociatedWithForm(trigger, first)).toBe(false)
    } finally {
      first.remove()
      second.remove()
      externalInput.remove()
    }
  })
})
