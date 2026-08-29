import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { DocsPlayground, normalizeDocsPlaygroundControls } from './docs-playground.tsx'

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

    await fireEvent.input(screen.getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Save' },
    })

    expect(screen.getByText('Save')).not.toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('Button')).not.toBeNull()
  })

  test('throws when a control omits its required default value', () => {
    expect(() =>
      normalizeDocsPlaygroundControls([{ kind: 'switch', prop: 'disabled', label: 'Disabled' }]),
    ).toThrow('missing defaultValue')
  })
})
