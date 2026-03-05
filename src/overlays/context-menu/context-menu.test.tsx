import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { ContextMenu } from './context-menu'
import type { ContextMenuProps } from './context-menu'

describe('ContextMenu', () => {
  test('opens on context menu event and supports keyboard selection', async () => {
    const onSelect = vi.fn()

    const screen = render(() => (
      <ContextMenu
        items={[
          { label: 'Rename', onSelect },
          { label: 'Delete', color: 'destructive' },
        ]}
      >
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="item"]').length).toBeGreaterThan(0)
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    await fireEvent.keyDown(content, { key: 'ArrowDown' })

    const highlighted = document.body.querySelector('[data-slot="item"][data-highlighted]')
    expect(highlighted).not.toBeNull()

    await fireEvent.keyDown(highlighted!, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('does not open on left click', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Open by right click only' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.click(screen.getByText('Row Item'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('fires onOpenChange when opened and blocks opening when disabled', async () => {
    const onOpenChange = vi.fn()

    const enabledScreen = render(() => (
      <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Enabled action' }]}>
        <div data-testid="enabled-row">Enabled Row</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(enabledScreen.getByTestId('enabled-row'), {
      clientX: 12,
      clientY: 18,
    })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    enabledScreen.unmount()

    const disabledOnOpenChange = vi.fn()
    const disabledScreen = render(() => (
      <ContextMenu
        disabled
        onOpenChange={disabledOnOpenChange}
        items={[{ label: 'Disabled action' }]}
      >
        <div data-testid="disabled-row">Disabled Row</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(disabledScreen.getByTestId('disabled-row'), {
      clientX: 24,
      clientY: 32,
    })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })

    expect(disabledOnOpenChange).not.toHaveBeenCalled()
    disabledScreen.unmount()
  })

  test('supports controlled open state and reports right-click open attempts', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <ContextMenu open={false} onOpenChange={onOpenChange} items={[{ label: 'Controlled item' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('supports defaultOpen without anchor coordinates', async () => {
    render(() => (
      <ContextMenu defaultOpen items={[{ label: 'Default open item' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
      expect(document.body.textContent).toContain('Default open item')
    })
  })

  test('opens after 700ms touch long press', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          <div>Row Item</div>
        </ContextMenu>
      ))

      await fireEvent.pointerDown(screen.getByText('Row Item'), {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })

      await vi.advanceTimersByTimeAsync(699)
      expect(onOpenChange).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('dismisses menu when right-clicking opened menu content', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Pinned action' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 18,
      clientY: 24,
    })
    const notCanceled = content.dispatchEvent(event)

    expect(notCanceled).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(
      screen.getByText('Row Item').closest('[data-slot="trigger"]')?.getAttribute('aria-expanded'),
    ).toBe('false')
    expect(document.body.querySelector('[data-slot="content"][data-expanded]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"][data-closed]')).not.toBeNull()
  })

  test('dismisses menu when right-clicking trigger again while open', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Pinned action' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    const row = screen.getByText('Row Item')

    await fireEvent.contextMenu(row, { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 16,
      clientY: 22,
    })
    const notCanceled = row.dispatchEvent(event)

    expect(notCanceled).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(row.closest('[data-slot="trigger"]')?.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.querySelector('[data-slot="content"][data-expanded]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"][data-closed]')).not.toBeNull()
  })

  test('renders item matrix, nested submenu, and content slots', async () => {
    const contentTop = vi.fn((props: { sub: boolean }) => (
      <div data-testid={props.sub ? 'content-top-sub' : 'content-top-root'}>
        {props.sub ? 'Top Sub' : 'Top Root'}
      </div>
    ))
    const contentBottom = vi.fn((props: { sub: boolean }) => (
      <div data-testid={props.sub ? 'content-bottom-sub' : 'content-bottom-root'}>
        {props.sub ? 'Bottom Sub' : 'Bottom Root'}
      </div>
    ))

    const screen = render(() => (
      <ContextMenu
        placement="bottom-start"
        classes={{
          content: 'content-class',
        }}
        contentTop={contentTop}
        contentBottom={contentBottom}
        items={[
          [
            { type: 'label', label: 'Account' },
            { type: 'separator' },
            {
              label: 'Profile',
              description: 'View profile',
              icon: 'icon-user',
              kbds: ['meta', 'p'],
            },
            {
              label: 'Avatar row',
              icon: <span data-testid="avatar-node">A</span>,
            },
            {
              type: 'checkbox',
              label: 'Pinned',
              checked: true,
            },
            {
              label: 'More',
              defaultOpen: true,
              children: [{ label: 'Nested action' }],
            },
          ],
        ]}
      >
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.textContent).toContain('Nested action')
    })

    const rootContent = document.body.querySelector('[data-slot="content"]')

    expect(document.body.textContent).toContain('Account')
    expect(document.body.querySelector('[data-slot="separator"]')).not.toBeNull()
    expect(document.body.textContent).toContain('View profile')
    expect(document.body.querySelectorAll('[data-slot="item-kbd"]').length).toBeGreaterThanOrEqual(
      2,
    )
    expect(document.body.querySelector('[data-testid="avatar-node"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="itemIndicator"]')).not.toBeNull()

    expect(rootContent?.className).toContain('mt-$kb-popper-content-overflow-padding')
    expect(rootContent?.className).toContain('ring-foreground/10')
    expect(rootContent?.className).toContain('data-expanded:slide-in-from-t-2')
    expect(rootContent?.className).toContain('content-class')

    expect(document.body.querySelector('[data-testid="content-top-root"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content-bottom-root"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content-top-sub"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content-bottom-sub"]')).not.toBeNull()

    expect(contentTop).toHaveBeenCalledWith({ sub: false })
    expect(contentTop).toHaveBeenCalledWith({ sub: true })
    expect(contentBottom).toHaveBeenCalledWith({ sub: false })
    expect(contentBottom).toHaveBeenCalledWith({ sub: true })
  })

  test('passes itemRender context for root and nested items', async () => {
    const itemRender = vi.fn((props: any) => (
      <span data-testid={`custom-${String(props.item.label)}-${props.depth}`}>
        {String(props.item.label)}:{props.depth}:{String(props.hasChildren)}:
        {String(props.isCheckbox)}
      </span>
    ))

    const screen = render(() => (
      <ContextMenu
        itemRender={itemRender}
        items={[
          {
            label: 'Parent',
            defaultOpen: true,
            children: [{ label: 'Child' }],
          },
          {
            type: 'checkbox',
            label: 'Checkbox',
          },
        ]}
      >
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="custom-Child-1"]')).not.toBeNull()
    })

    expect(document.body.querySelector('[data-testid="custom-Parent-0"]')?.textContent).toContain(
      'Parent:0:true:false',
    )
    expect(document.body.querySelector('[data-testid="custom-Child-1"]')?.textContent).toContain(
      'Child:1:false:false',
    )
    expect(document.body.querySelector('[data-testid="custom-Checkbox-0"]')?.textContent).toContain(
      'Checkbox:0:false:true',
    )

    expect(itemRender).toHaveBeenCalled()
  })

  test('renders into portal by default', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Default portal' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 10, clientY: 10 })

    await waitFor(() => {
      expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('requires children in type contract', () => {
    // @ts-expect-error children is required
    const props: ContextMenuProps = { items: [{ label: 'Open item' }] }
    expect(props).toBeDefined()
  })

  test('does not open when context menu trigger is disabled', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <ContextMenu disabled items={[{ label: 'Disabled entry' }]}>
          <div>Row Item</div>
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      await fireEvent.contextMenu(row, { clientX: 24, clientY: 32 })

      await waitFor(() => {
        expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      })

      await fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 30,
        clientY: 42,
      })
      await vi.advanceTimersByTimeAsync(700)

      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('supports checkbox toggle and keeps disabled item from selecting', async () => {
    const onCheckedChange = vi.fn()
    const onDisabledSelect = vi.fn()

    const screen = render(() => (
      <ContextMenu
        items={[
          {
            type: 'checkbox',
            label: 'Pin',
            onCheckedChange,
          },
          {
            label: 'Disabled action',
            disabled: true,
            onSelect: onDisabledSelect,
          },
        ]}
      >
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 24, clientY: 32 })

    const checkboxItem = document.body.querySelector('[data-slot="item"]') as HTMLElement
    checkboxItem.focus()
    await fireEvent.keyDown(checkboxItem, { key: 'Enter' })

    const disabledItem = Array.from(document.body.querySelectorAll('[data-slot="item"]')).find(
      (el) => el.textContent?.includes('Disabled action'),
    ) as HTMLElement

    await fireEvent.click(disabledItem)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(onDisabledSelect).not.toHaveBeenCalled()
  })

  test('destructive item icon does not force muted color class', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Delete', color: 'destructive', icon: 'icon-trash-2' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 16, clientY: 16 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="itemLeading"]')).not.toBeNull()
    })

    const leading = document.body.querySelector('[data-slot="itemLeading"]') as HTMLElement
    expect(leading.className).not.toContain('text-muted-foreground')
  })
})
