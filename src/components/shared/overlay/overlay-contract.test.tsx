import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { BaseSelect } from '../../base-select'
import { Combobox } from '../../combobox'
import { ContextMenu } from '../../context-menu'
import { DropdownMenu } from '../../dropdown-menu'
import { Popover } from '../../popover'
async function finishExit(selector: string, root: ParentNode = document.body): Promise<void> {
  await Promise.resolve()
  const element = root.querySelector<HTMLElement>(selector)
  if (element) {
    fireEvent.animationEnd(element)
  }
  await Promise.resolve()
}

describe('Unified overlay contract', () => {
  test('Popover supports custom mount and onExitComplete', async () => {
    const portalHost = document.createElement('div')
    document.body.append(portalHost)
    const onExitComplete = vi.fn()
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Popover
        open={open()}
        onOpenChange={setOpen}
        mount={portalHost}
        onExitComplete={onExitComplete}
      >
        <Popover.Trigger as="button" type="button">
          Trigger
        </Popover.Trigger>
        <Popover.Content>Mounted content</Popover.Content>
      </Popover>
    ))
    try {
      expect(portalHost.querySelector('[data-slot="popover-content"]')).not.toBeNull()
      expect(onExitComplete).not.toHaveBeenCalled()

      flush(() => setOpen(false))
      await finishExit('[data-slot="popover-content"]', portalHost)
      await waitFor(() => {
        expect(portalHost.querySelector('[data-slot="popover-content"]')).toBeNull()
        expect(onExitComplete).toHaveBeenCalledTimes(1)
      })
    } finally {
      screen.unmount()
      portalHost.remove()
    }
  })

  test('ContextMenu supports preventScroll={false}, custom mount, and onExitComplete', async () => {
    const portalHost = document.createElement('div')
    document.body.append(portalHost)
    const onExitComplete = vi.fn()
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <ContextMenu
        open={open()}
        onOpenChange={setOpen}
        preventScroll={false}
        mount={portalHost}
        onExitComplete={onExitComplete}
      >
        <ContextMenu.Trigger as="div">Target</ContextMenu.Trigger>
        <ContextMenu.Content items={[{ label: 'Copy' }]} />
      </ContextMenu>
    ))
    try {
      await waitFor(() => {
        expect(portalHost.querySelector('[data-slot="context-menu-content"]')).not.toBeNull()
      })
      expect(document.body.style.overflow).toBe('')
      expect(onExitComplete).not.toHaveBeenCalled()

      flush(() => setOpen(false))
      await finishExit('[data-slot="context-menu-content"]', portalHost)
      await waitFor(() => {
        expect(portalHost.querySelector('[data-slot="context-menu-content"]')).toBeNull()
        expect(onExitComplete).toHaveBeenCalledTimes(1)
      })
    } finally {
      screen.unmount()
      portalHost.remove()
    }
  })

  test('DropdownMenu supports custom mount and onExitComplete', async () => {
    const portalHost = document.createElement('div')
    document.body.append(portalHost)
    const onExitComplete = vi.fn()
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <DropdownMenu
        open={open()}
        onOpenChange={setOpen}
        mount={portalHost}
        onExitComplete={onExitComplete}
      >
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Content items={[{ label: 'Rename' }]} />
      </DropdownMenu>
    ))
    try {
      await waitFor(() => {
        expect(portalHost.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeNull()
      })
      expect(onExitComplete).not.toHaveBeenCalled()

      flush(() => setOpen(false))
      await finishExit('[data-slot="dropdown-menu-content"]', portalHost)
      await waitFor(() => {
        expect(portalHost.querySelector('[data-slot="dropdown-menu-content"]')).toBeNull()
        expect(onExitComplete).toHaveBeenCalledTimes(1)
      })
    } finally {
      screen.unmount()
      portalHost.remove()
    }
  })

  test('BaseSelect and Combobox support preventScroll={false} and onExitComplete', async () => {
    const onExitComplete = vi.fn()
    const [open, setOpen] = createSignal(true)
    const items = [{ label: 'Apple', value: 'apple' }]
    const baseScreen = render(() => (
      <BaseSelect items={items} defaultOpen preventScroll={false}>
        <BaseSelect.Control>
          <BaseSelect.Trigger>Pick</BaseSelect.Trigger>
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Item item={items[0]!} />
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))
    try {
      expect(document.body.querySelector('[data-slot="base-select-content"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('')
    } finally {
      baseScreen.unmount()
    }

    const comboScreen = render(() => (
      <Combobox
        items={['Apple', 'Banana']}
        open={open()}
        onOpenChange={setOpen}
        preventScroll={false}
        onExitComplete={onExitComplete}
      />
    ))
    try {
      await waitFor(() => {
        expect(document.body.querySelector('[data-slot="combobox-content"]')).not.toBeNull()
      })
      expect(document.body.style.overflow).toBe('')

      flush(() => setOpen(false))
      await finishExit('[data-slot="combobox-content"]')
      await waitFor(() => {
        expect(document.body.querySelector('[data-slot="combobox-content"]')).toBeNull()
        expect(onExitComplete).toHaveBeenCalledTimes(1)
      })
    } finally {
      comboScreen.unmount()
    }
  })
})
