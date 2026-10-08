import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Slider } from '../../form/slider/slider'
import { Dialog } from '../../overlay/dialog/dialog'
import { DropdownMenu } from '../../overlay/dropdown-menu/dropdown-menu'
import { Popover } from '../../overlay/popover/popover'
import { Sheet } from '../../overlay/sheet/sheet'
import { MoraineProvider } from '../moraine-provider'

describe('Moraine direction', () => {
  test('flips slider arrow keys from html dir without a provider', () => {
    const previousDirection = document.documentElement.getAttribute('dir')
    document.documentElement.setAttribute('dir', 'rtl')
    const onValueChange = vi.fn()
    try {
      const screen = render(() => <Slider defaultValue={45} onValueChange={onValueChange} />)
      const thumb = screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement

      fireEvent.keyDown(thumb, { key: 'ArrowRight' })

      expect(onValueChange).toHaveBeenLastCalledWith(44)
    } finally {
      if (previousDirection === null) {
        document.documentElement.removeAttribute('dir')
      } else {
        document.documentElement.setAttribute('dir', previousDirection)
      }
    }
  })

  test('flips slider arrow keys from the provider without a dir attribute', () => {
    const previousDirection = document.documentElement.getAttribute('dir')
    document.documentElement.removeAttribute('dir')
    const onValueChange = vi.fn()
    try {
      const screen = render(() => (
        <MoraineProvider dir="rtl">
          <Slider defaultValue={45} onValueChange={onValueChange} />
        </MoraineProvider>
      ))
      const thumb = screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement

      fireEvent.keyDown(thumb, { key: 'ArrowRight' })

      expect(thumb.closest('[dir]')).toBeNull()
      expect(onValueChange).toHaveBeenLastCalledWith(44)
    } finally {
      if (previousDirection === null) {
        document.documentElement.removeAttribute('dir')
      } else {
        document.documentElement.setAttribute('dir', previousDirection)
      }
    }
  })

  test('lets a dir attribute on the slider win over the provider', () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <MoraineProvider dir="rtl">
        <Slider dir="ltr" defaultValue={45} onValueChange={onValueChange} />
      </MoraineProvider>
    ))

    fireEvent.keyDown(screen.container.querySelector('[data-slot="slider-thumb"]') as HTMLElement, {
      key: 'ArrowRight',
    })

    expect(onValueChange).toHaveBeenLastCalledWith(46)
  })

  test('opens a dropdown submenu with the logical RTL arrow from the provider', async () => {
    const previousDirection = document.documentElement.dir
    document.documentElement.dir = ''
    try {
      const screen = render(() => (
        <MoraineProvider dir="rtl">
          <DropdownMenu defaultOpen preventScroll={false}>
            <DropdownMenu.Trigger as="button" type="button">
              Actions
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              items={[{ label: 'More', children: [{ label: 'Nested action' }] }]}
            />
          </DropdownMenu>
        </MoraineProvider>
      ))

      const submenuTrigger = await waitFor(() => {
        const item = Array.from(document.body.querySelectorAll('[role="menuitem"]')).find(
          (element) => element.textContent?.includes('More'),
        )
        expect(item).toBeInstanceOf(HTMLElement)
        return item as HTMLElement
      })
      submenuTrigger.focus()
      fireEvent.keyDown(submenuTrigger, { key: 'ArrowLeft' })

      await waitFor(() => {
        expect(submenuTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(document.body.textContent).toContain('Nested action')
      })
      expect(screen.getByRole('button', { name: 'Actions' })).toBeTruthy()
    } finally {
      document.documentElement.dir = previousDirection
    }
  })

  test('sets dir on portaled popover, dialog, and sheet content', () => {
    render(() => (
      <MoraineProvider dir="rtl">
        <Popover open>
          <Popover.Trigger as="button" type="button">
            Open
          </Popover.Trigger>
          <Popover.Content>Panel</Popover.Content>
        </Popover>
        <Dialog open>
          <Dialog.Content>Dialog</Dialog.Content>
        </Dialog>
        <Sheet open>
          <Sheet.Content>Sheet</Sheet.Content>
        </Sheet>
      </MoraineProvider>
    ))

    const content = document.body.querySelector('[data-slot="popover-content"]')
    expect(content?.parentElement?.getAttribute('dir')).toBe('rtl')
    expect(document.body.querySelector('[data-slot="dialog-content"]')?.getAttribute('dir')).toBe(
      'rtl',
    )
    expect(document.body.querySelector('[data-slot="sheet-content"]')?.getAttribute('dir')).toBe(
      'rtl',
    )
  })

  test('lets a dir attribute on portaled content win over the provider', () => {
    render(() => (
      <MoraineProvider dir="rtl">
        <Popover open>
          <Popover.Trigger as="button" type="button">
            Open
          </Popover.Trigger>
          <Popover.Content dir="ltr">Panel</Popover.Content>
        </Popover>
        <Dialog open>
          <Dialog.Content dir="ltr">Dialog</Dialog.Content>
        </Dialog>
        <Sheet open>
          <Sheet.Content dir="ltr">Sheet</Sheet.Content>
        </Sheet>
      </MoraineProvider>
    ))

    const content = document.body.querySelector('[data-slot="popover-content"]')
    expect(content?.parentElement?.getAttribute('dir')).toBe('ltr')
    expect(document.body.querySelector('[data-slot="dialog-content"]')?.getAttribute('dir')).toBe(
      'ltr',
    )
    expect(document.body.querySelector('[data-slot="sheet-content"]')?.getAttribute('dir')).toBe(
      'ltr',
    )
  })
})
