import { describe, expect, test } from 'vitest'

import { acquireAriaHideOutside } from './aria-hide'

describe('acquireAriaHideOutside', () => {
  test('keeps a shadow host accessible and observes both light and shadow siblings', async () => {
    const outside = document.createElement('main')
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const content = document.createElement('div')
    shadowRoot.append(content)
    document.body.append(outside, host)

    const release = acquireAriaHideOutside(content)
    expect(outside.getAttribute('aria-hidden')).toBe('true')
    expect(host.hasAttribute('aria-hidden')).toBe(false)
    expect(content.closest('[aria-hidden="true"]')).toBeNull()

    const addedOutside = document.createElement('aside')
    const addedShadowSibling = document.createElement('aside')
    document.body.append(addedOutside)
    shadowRoot.append(addedShadowSibling)
    await Promise.resolve()
    expect(addedOutside.getAttribute('aria-hidden')).toBe('true')
    expect(addedShadowSibling.getAttribute('aria-hidden')).toBe('true')
    expect(host.hasAttribute('aria-hidden')).toBe(false)

    release()
    expect(outside.hasAttribute('aria-hidden')).toBe(false)
    expect(addedOutside.hasAttribute('aria-hidden')).toBe(false)
    expect(addedShadowSibling.hasAttribute('aria-hidden')).toBe(false)
    outside.remove()
    host.remove()
    addedOutside.remove()
  })

  test('restores nested shadow modal isolation in stack order', () => {
    const outside = document.createElement('main')
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    outer.append(inner)
    shadowRoot.append(outer)
    document.body.append(outside, host)

    const releaseOuter = acquireAriaHideOutside(outer)
    const releaseInner = acquireAriaHideOutside(inner)
    expect(host.hasAttribute('aria-hidden')).toBe(false)
    expect(outside.getAttribute('aria-hidden')).toBe('true')
    releaseInner()
    expect(outside.getAttribute('aria-hidden')).toBe('true')
    releaseOuter()
    expect(outside.hasAttribute('aria-hidden')).toBe(false)
    outside.remove()
    host.remove()
  })
})
