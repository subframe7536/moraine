import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { DocsPlayground, normalizeDocsPlaygroundControls } from './docs-playground'

describe('DocsPlayground', () => {
  test('calls the render prop once and updates its control values', async () => {
    let childrenReads = 0
    const screen = render(() =>
      createComponent(DocsPlayground, {
        controls: [{ kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Button' }],
        get children() {
          childrenReads += 1
          return (props: Record<string, unknown>) => <output>{props.label as string}</output>
        },
      }),
    )

    expect(childrenReads).toBe(1)
    expect(screen.getByText('Button')).not.toBeNull()

    fireEvent.input(screen.getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Save' },
    })

    expect(screen.getByText('Save')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('Button')).not.toBeNull()
  })

  test('throws when a control omits its required default value', () => {
    expect(() =>
      normalizeDocsPlaygroundControls([{ kind: 'switch', prop: 'disabled', label: 'Disabled' }]),
    ).toThrow('missing defaultValue')
  })

  test('focuses the clicked control inside preview and blurs outside focused elements', () => {
    const outsideButton = document.createElement('button')
    outsideButton.textContent = 'Outside'
    document.body.append(outsideButton)
    outsideButton.focus()
    expect(document.activeElement).toBe(outsideButton)

    const screen = render(() =>
      createComponent(DocsPlayground, {
        controls: [],
        children: () => (
          <div>
            <button type="button" id="preview-btn">
              <span>Inside Button</span>
            </button>
          </div>
        ),
      }),
    )

    const previewButton = screen.getByRole('button', { name: 'Inside Button' })
    const labelSpan = previewButton.querySelector('span')!

    // Clicking inside button transfers focus from outside
    labelSpan.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    expect(document.activeElement).toBe(previewButton)

    // Focusing outside and clicking preview background blurs outside element
    outsideButton.focus()
    expect(document.activeElement).toBe(outsideButton)

    const previewContainer = previewButton.closest('.min-h-\\[160px\\]') as HTMLElement
    previewContainer.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    expect(document.activeElement).not.toBe(outsideButton)

    outsideButton.remove()
  })
})
