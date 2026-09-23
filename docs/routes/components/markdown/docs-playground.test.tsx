import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Dialog, MoraineProvider, Select } from '../../../../src'
import { finishExitMotion } from '../../../../src/test-utils/overlay-test'
import type { ComponentApi } from '../../../build/api-doc/types'

import { DocsPlayground, normalizeDocsPlaygroundControls } from './docs-playground'
import { DocsPlaygroundApiContext } from './docs-playground-slots'

function api(key: string, slots: string[]): ComponentApi {
  return { key, name: key, kind: 'single', parts: [], slots, dataAttributes: [] }
}

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

  test('lists API slots in order and highlights repeated preview nodes without intercepting them', async () => {
    let top = 20
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({
        top,
        left: 10,
        width: 40,
        height: 20,
        right: 50,
        bottom: 40,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }))
    try {
      const view = render(() => (
        <DocsPlaygroundApiContext.Provider value={api('button', ['root', 'leading', 'label'])}>
          <DocsPlayground controls={[]}>
            {() => (
              <button data-slot="button" type="button">
                <span data-slot="button-label">First</span>
                <span data-slot="button-label">Second</span>
              </button>
            )}
          </DocsPlayground>
        </DocsPlaygroundApiContext.Provider>
      ))
      const slotButtons = within(
        view.getByRole('region', { name: 'Component slots' }),
      ).getAllByRole('button')
      expect(slotButtons.map((button) => button.textContent)).toEqual(['root', 'leading', 'label'])
      expect(slotButtons.every((button) => button.getAttribute('data-slot') === 'badge')).toBe(true)
      expect(slotButtons[1]).toHaveProperty('disabled', true)

      fireEvent.pointerEnter(slotButtons[2]!)
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight="label"]')).toHaveLength(2)
      })
      fireEvent.click(slotButtons[2]!)
      expect(slotButtons[2]!.getAttribute('aria-pressed')).toBe('true')
      expect(document.querySelectorAll('[data-docs-slot-highlight="label"]')).toHaveLength(2)
      fireEvent.click(slotButtons[2]!)
      expect(slotButtons[2]!.getAttribute('aria-pressed')).toBe('false')
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight]')).toHaveLength(0)
      })
      fireEvent.pointerLeave(slotButtons[2]!)
      fireEvent.pointerEnter(slotButtons[2]!)
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight="label"]')).toHaveLength(2)
      })
      fireEvent.click(slotButtons[2]!)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(slotButtons[2]!.getAttribute('aria-pressed')).toBe('false')
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight]')).toHaveLength(0)
      })
      const autoSwitch = view.getByRole('switch', { name: 'Auto' })
      expect(autoSwitch.getAttribute('aria-checked')).toBe('false')
      fireEvent.pointerMove(view.container.querySelector('[data-slot="button-label"]')!)
      expect(document.querySelectorAll('[data-docs-slot-highlight]')).toHaveLength(0)
      fireEvent.click(autoSwitch)
      expect(autoSwitch.getAttribute('aria-checked')).toBe('true')
      fireEvent.pointerMove(view.container.querySelectorAll('[data-slot="button-label"]')[1]!)
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight="label"]')).toHaveLength(2)
      })
      top = 65
      fireEvent.scroll(window)
      await waitFor(() => {
        expect(
          (document.querySelector('[data-docs-slot-highlight="label"]') as HTMLElement).style.top,
        ).toBe('65px')
      })
      fireEvent.pointerMove(document.body)
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight]')).toHaveLength(0)
      })
      fireEvent.click(autoSwitch)
      expect(autoSwitch.getAttribute('aria-checked')).toBe('false')
      fireEvent.pointerMove(view.container.querySelector('[data-slot="button-label"]')!)
      expect(document.querySelectorAll('[data-docs-slot-highlight]')).toHaveLength(0)
      fireEvent.pointerEnter(slotButtons[2]!)
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight="label"]')).toHaveLength(2)
      })
      fireEvent.pointerLeave(slotButtons[2]!)
      fireEvent.click(autoSwitch)
      expect(autoSwitch.getAttribute('aria-checked')).toBe('true')
      fireEvent.pointerMove(view.container.querySelector('[data-slot="button-label"]')!)
      await waitFor(() => {
        expect(document.querySelectorAll('[data-docs-slot-highlight="label"]')).toHaveLength(2)
      })
      view.unmount()
    } finally {
      rect.mockRestore()
    }
  })

  test('finds Select portal slots through its trigger without borrowing another example', async () => {
    const view = render(() => (
      <MoraineProvider>
        <DocsPlaygroundApiContext.Provider value={api('select', ['control', 'content', 'item'])}>
          <DocsPlayground controls={[]}>
            {() => <Select items={[{ label: 'Apple', value: 'apple' }]} />}
          </DocsPlayground>
        </DocsPlaygroundApiContext.Provider>
        <div data-slot="select-content">Unrelated example</div>
      </MoraineProvider>
    ))
    const slots = within(view.getByRole('region', { name: 'Component slots' }))
    expect(slots.getByRole('button', { name: 'content' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(view.getByRole('combobox'))
    await waitFor(() => {
      expect(slots.getByRole('button', { name: 'content' }).hasAttribute('disabled')).toBe(false)
      expect(slots.getByRole('button', { name: 'item' }).hasAttribute('disabled')).toBe(false)
    })
    fireEvent.click(view.getByRole('combobox'))
    await finishExitMotion()
    await waitFor(() => {
      expect(slots.getByRole('button', { name: 'content' }).hasAttribute('disabled')).toBe(true)
    })
  })

  test('tracks Dialog content and overlay in the same portal and clears a removed selection', async () => {
    const [open, setOpen] = createSignal(false)
    const view = render(() => (
      <MoraineProvider>
        <DocsPlaygroundApiContext.Provider
          value={api('dialog', ['trigger', 'content', 'overlay', 'title'])}
        >
          <DocsPlayground controls={[]}>
            {() => (
              <Dialog open={open()}>
                <Dialog.Trigger as="button" type="button">
                  Open
                </Dialog.Trigger>
                <Dialog.Content title="Confirm" body="Body" />
              </Dialog>
            )}
          </DocsPlayground>
        </DocsPlaygroundApiContext.Provider>
      </MoraineProvider>
    ))
    const slots = within(view.getByRole('region', { name: 'Component slots' }))
    setOpen(true)
    await waitFor(() => {
      expect(
        slots.getByRole('button', { name: 'content', hidden: true }).hasAttribute('disabled'),
      ).toBe(false)
      expect(
        slots.getByRole('button', { name: 'overlay', hidden: true }).hasAttribute('disabled'),
      ).toBe(false)
      expect(
        slots.getByRole('button', { name: 'title', hidden: true }).hasAttribute('disabled'),
      ).toBe(false)
    })
    const contentSlot = slots.getByRole('button', { name: 'content', hidden: true })
    fireEvent.pointerMove(document.body.querySelector('[data-slot="dialog-content"]')!)
    fireEvent.click(contentSlot)
    expect(contentSlot.getAttribute('aria-pressed')).toBe('true')
    setOpen(false)
    await finishExitMotion()
    await waitFor(() => {
      expect(slots.getByRole('button', { name: 'content' }).hasAttribute('disabled')).toBe(true)
      expect(slots.getByRole('button', { name: 'content' }).getAttribute('aria-pressed')).toBe(
        'false',
      )
    })
  })
})
