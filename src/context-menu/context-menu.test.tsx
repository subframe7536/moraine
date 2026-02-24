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
    expect(document.body.querySelector('[data-slot="item-indicator"]')).not.toBeNull()

    expect(rootContent?.className).toContain('mt-$kb-popper-content-overflow-padding')
    expect(rootContent?.className).toContain('ring-foreground/10')
    expect(rootContent?.className).toContain('data-exxpanded:slide-in-from-top-2')
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
    const screen = render(() => (
      <ContextMenu disabled items={[{ label: 'Disabled entry' }]}>
        <div>Row Item</div>
      </ContextMenu>
    ))

    await fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 24, clientY: 32 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
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
})
