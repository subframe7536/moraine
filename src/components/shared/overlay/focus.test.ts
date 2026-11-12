import { describe, expect, test } from 'vitest'

import { getFocusableElements } from './focus'

describe('getFocusableElements', () => {
  test('uses native disabled, details, and radio-group tab rules', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <fieldset disabled>
        <legend><button id="legend">Legend</button></legend>
        <input id="fieldset-input" />
      </fieldset>
      <details>
        <summary id="summary">Summary <a id="summary-link" href="/help">Help</a></summary>
        <button id="details-button">Hidden</button>
      </details>
      <input id="first-radio" type="radio" name="unchecked" />
      <input id="second-radio" type="radio" name="unchecked" />
      <input id="unchecked-radio" type="radio" name="checked" />
      <input id="checked-radio" type="radio" name="checked" checked />
    `
    document.body.append(container)

    expect(getFocusableElements(container).map((element) => element.id)).toEqual([
      'legend',
      'summary',
      'summary-link',
      'first-radio',
      'checked-radio',
    ])

    container.remove()
  })

  test('traverses open shadow roots and excludes inert slotted ancestors', () => {
    const container = document.createElement('div')
    const host = document.createElement('div')
    const slottedButton = document.createElement('button')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    shadowRoot.append(document.createElement('slot'))
    host.append(slottedButton)
    container.append(host)
    document.body.append(container)

    expect(getFocusableElements(container)).toEqual([slottedButton])

    host.setAttribute('inert', '')
    expect(getFocusableElements(container)).toEqual([])

    container.remove()
  })
})
