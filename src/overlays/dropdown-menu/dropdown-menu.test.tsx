import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { DropdownMenu } from './dropdown-menu'
import type { DropdownMenuProps } from './dropdown-menu'

describe('DropdownMenu', () => {
  test('opens by keyboard and supports keyboard selection', async () => {
    const onSelect = vi.fn()

    const screen = render(() => (
      <DropdownMenu items={[{ label: 'Open file', onSelect }, { label: 'Close file' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await fireEvent.keyDown(screen.getByText('Actions'), { key: 'ArrowDown' })

    await waitFor(() => {
      const highlighted = document.body.querySelector('[data-slot="item"][data-highlighted]')
      expect(highlighted).not.toBeNull()
    })

    const highlighted = document.body.querySelector('[data-slot="item"][data-highlighted]')
    await fireEvent.keyDown(highlighted!, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('supports controlled open state and reports close attempts', async () => {
    const onOpenChange = vi.fn()

    render(() => (
      <DropdownMenu open onOpenChange={onOpenChange} items={[{ label: 'Controlled item' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    await fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('uses shared bottom-side transition classes for default placement', async () => {
    render(() => (
      <DropdownMenu defaultOpen items={[{ label: 'Default animation item' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const rootContent = document.body.querySelector('[data-slot="content"]') as HTMLElement

    expect(rootContent.className).toContain('mt-$kb-popper-content-overflow-padding')
    expect(rootContent.className).toContain('data-expanded:slide-in-from-top-2')
    expect(rootContent.className).toContain('data-closed:slide-out-to-top-2')
    expect(rootContent.className).not.toContain('data-expanded:slide-in-from-bottom-2')
    expect(rootContent.className).not.toContain('data-closed:slide-out-to-bottom-2')
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

    render(() => (
      <DropdownMenu
        defaultOpen
        placement="left-start"
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
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

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

    expect(rootContent?.className).toContain('mr-$kb-popper-content-overflow-padding')
    expect(rootContent?.className).toContain('surface-overlay')
    expect(rootContent?.className).toContain('data-expanded:slide-in-from-right-2')
    expect(rootContent?.className).toContain('data-closed:slide-out-to-right-2')
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

    render(() => (
      <DropdownMenu
        defaultOpen
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
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

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

  test('renders into portal by default', () => {
    const screen = render(() => (
      <DropdownMenu defaultOpen items={[{ label: 'Default portal' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('keeps trigger wrapper out of tab order', () => {
    render(() => (
      <DropdownMenu items={[{ label: 'Open item' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('tabindex')).toBe('-1')
  })

  test('requires children in type contract', () => {
    // @ts-expect-error children is required
    const props: DropdownMenuProps = { defaultOpen: true, items: [{ label: 'Open item' }] }
    expect(props).toBeDefined()
  })

  test('does not open when menu trigger is disabled', async () => {
    const screen = render(() => (
      <DropdownMenu disabled items={[{ label: 'Disabled entry' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const trigger = screen.getByText('Actions')
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('supports checkbox toggle and keeps disabled item from selecting', async () => {
    const onCheckedChange = vi.fn()
    const onDisabledSelect = vi.fn()

    render(() => (
      <DropdownMenu
        defaultOpen
        items={[
          {
            type: 'checkbox',
            label: 'Show hidden files',
            onCheckedChange,
          },
          {
            label: 'Disabled action',
            disabled: true,
            onSelect: onDisabledSelect,
          },
        ]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

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
    render(() => (
      <DropdownMenu
        defaultOpen
        items={[{ label: 'Delete', color: 'destructive', icon: 'icon-trash-2' }]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="itemLeading"]')).not.toBeNull()
    })

    const leading = document.body.querySelector('[data-slot="itemLeading"]') as HTMLElement
    expect(leading.className).not.toContain('text-muted-foreground')
  })

  test('renders submenu content through portal instead of nesting inside root content', async () => {
    render(() => (
      <DropdownMenu
        defaultOpen
        items={[
          {
            label: 'More',
            defaultOpen: true,
            children: [{ label: 'Nested action' }],
          },
        ]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="content"]').length).toBeGreaterThanOrEqual(
        2,
      )
    })

    const contents = Array.from(document.body.querySelectorAll('[data-slot="content"]'))
    const root = contents[0] as HTMLElement
    const sub = contents[1] as HTMLElement

    expect(root.contains(sub)).toBe(false)
  })

  test('applies styles override to content', async () => {
    render(() => (
      <DropdownMenu
        defaultOpen
        styles={{ content: { width: '200px' } } as any}
        items={[{ label: 'Open file' }]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
