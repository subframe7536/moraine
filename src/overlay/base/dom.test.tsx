import { describe, expect, test } from 'vitest'

import { isElement, isHTMLElement, isNode } from './dom'
import { getContextMenuTriggerAccessibility, validateOverlayTrigger } from './trigger'

describe('overlay DOM realm', () => {
  test('recognizes foreign HTML roots and native input buttons', () => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const foreignDocument = iframe.contentDocument!
    try {
      const button = foreignDocument.createElement('button')
      const input = foreignDocument.createElement('input')
      input.type = 'submit'
      const div = foreignDocument.createElement('div')
      expect(isNode(button)).toBe(true)
      expect(isElement(button)).toBe(true)
      expect(isHTMLElement(button)).toBe(true)
      expect(() => validateOverlayTrigger(button, 'Modal')).not.toThrow()
      expect(() => validateOverlayTrigger(div, 'ContextMenu')).not.toThrow()
      expect(getContextMenuTriggerAccessibility(button, true)).toEqual({
        ariaDisabled: undefined,
        disabled: true,
        tabIndex: undefined,
      })
      expect(getContextMenuTriggerAccessibility(input, true)).toEqual({
        ariaDisabled: undefined,
        disabled: true,
        tabIndex: undefined,
      })
      expect(getContextMenuTriggerAccessibility(div, true)).toEqual({
        ariaDisabled: 'true',
        disabled: undefined,
        tabIndex: -1,
      })
    } finally {
      iframe.remove()
    }
  })
})
