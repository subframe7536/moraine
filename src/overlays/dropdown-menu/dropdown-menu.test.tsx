import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { DropdownMenu } from './dropdown-menu'
import type { DropdownMenuProps } from './dropdown-menu'

async function finishMenuExitMotion(): Promise<void> {
  const contents = Array.from(
    document.body.querySelectorAll('[data-slot="content"]'),
  ) as HTMLElement[]

  await Promise.all(
    contents.map(async (content) => {
      await fireEvent.animationEnd(content)
      await fireEvent.transitionEnd(content)
    }),
  )
}

describe('DropdownMenu', () => {
  test('applies top-level class and style to trigger', () => {
    render(() => (
      <DropdownMenu items={[{ label: 'Archive' }]} class="trigger-class" style={{ width: '200px' }}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLElement | null

    expect(trigger?.className).toContain('trigger-class')
    expect(trigger?.style.width).toBe('200px')
  })

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

  test('closes from trigger keyboard escape while open', async () => {
    const screen = render(() => (
      <DropdownMenu items={[{ label: 'Open file' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const trigger = screen.getByText('Actions')
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    await fireEvent.keyDown(trigger, { key: 'Escape' })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"][data-expanded]')).toBeNull()
      expect(document.body.querySelector('[data-slot="content"][data-closed]')).not.toBeNull()
    })
  })

  test('focuses content on click open, ignores printable keys, and restores trigger focus on escape', async () => {
    const screen = render(() => (
      <DropdownMenu items={[{ label: 'Archive' }, { label: 'Duplicate' }, { label: 'Delete' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const trigger = screen.getByText('Actions') as HTMLButtonElement
    await fireEvent.click(trigger)

    await waitFor(() => {
      const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
      expect(content).not.toBeNull()
      expect(document.activeElement).toBe(content)
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    await fireEvent.keyDown(content, { key: 'd' })

    expect(document.body.querySelector('[data-slot="item"][data-highlighted]')).toBeNull()

    await fireEvent.keyDown(content, { key: 'Escape' })
    await finishMenuExitMotion()

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
  })

  test('scrolls the highlighted item into view when opened by keyboard', async () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

    HTMLElement.prototype.scrollIntoView = scrollIntoView

    try {
      const screen = render(() => (
        <DropdownMenu items={[{ label: 'Open file' }, { label: 'Close file' }]}>
          <button type="button">Actions</button>
        </DropdownMenu>
      ))

      await fireEvent.keyDown(screen.getByText('Actions'), { key: 'ArrowDown' })

      await waitFor(() => {
        expect(scrollIntoView).toHaveBeenCalled()
      })
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  test('opens and closes submenus with arrow keys', async () => {
    render(() => (
      <DropdownMenu
        defaultOpen
        items={[
          {
            label: 'More',
            children: [{ label: 'Nested action' }],
          },
        ]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="item"]')).not.toBeNull()
    })

    await fireEvent.keyDown(content, { key: 'ArrowDown' })

    const subTrigger = await waitFor(() => {
      const highlighted = document.body.querySelector(
        '[data-slot="item"][data-highlighted]',
      ) as HTMLElement | null
      expect(highlighted).not.toBeNull()
      return highlighted as HTMLElement
    })
    await fireEvent.keyDown(subTrigger, { key: 'ArrowRight' })

    await waitFor(() => {
      expect(document.body.textContent).toContain('Nested action')
      expect(document.body.querySelectorAll('[data-slot="content"]')).toHaveLength(2)
    })

    const submenuContent = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
      (element) => element.textContent?.includes('Nested action'),
    ) as HTMLElement

    await fireEvent.keyDown(submenuContent, { key: 'ArrowLeft' })

    await waitFor(() => {
      const closingSubmenu = Array.from(
        document.body.querySelectorAll('[data-slot="content"]'),
      ).find((element) => element.textContent?.includes('Nested action')) as HTMLElement

      expect(closingSubmenu?.getAttribute('data-closed')).toBe('')
    })

    await finishMenuExitMotion()

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="content"]')).toHaveLength(1)
    })

    expect(document.activeElement).toBe(subTrigger)
  })

  test('dismisses the deepest submenu first', async () => {
    const closeOrder: string[] = []
    const originalSetAttribute = HTMLElement.prototype.setAttribute
    const setAttributeSpy = vi
      .spyOn(HTMLElement.prototype, 'setAttribute')
      .mockImplementation(function (this: HTMLElement, name: string, value: string) {
        if (
          name === 'data-closed' &&
          value === '' &&
          this.getAttribute('data-slot') === 'content'
        ) {
          closeOrder.push(this.id)
        }

        return originalSetAttribute.call(this, name, value)
      })

    try {
      render(() => (
        <DropdownMenu
          id="dismiss-order"
          defaultOpen
          items={[
            {
              label: 'More',
              defaultOpen: true,
              children: [
                {
                  label: 'Deep',
                  defaultOpen: true,
                  children: [{ label: 'Leaf action' }],
                },
              ],
            },
          ]}
        >
          <button type="button">Actions</button>
        </DropdownMenu>
      ))

      await waitFor(() => {
        expect(document.body.querySelectorAll('[data-slot="content"]')).toHaveLength(3)
      })

      const contents = Array.from(
        document.body.querySelectorAll('[data-slot="content"]'),
      ) as HTMLElement[]
      const [rootContent, middleContent, deepestContent] = contents as [
        HTMLElement,
        HTMLElement,
        HTMLElement,
      ]

      await fireEvent.keyDown(rootContent, { key: 'Escape' })

      await waitFor(() => {
        expect(closeOrder).toHaveLength(3)
      })

      expect(closeOrder).toEqual([deepestContent.id, middleContent.id, rootContent.id])
    } finally {
      setAttributeSpy.mockRestore()
    }
  })

  test('moves focus into submenu when submenu opens by click', async () => {
    render(() => (
      <DropdownMenu
        defaultOpen
        items={[
          {
            label: 'More',
            children: [{ label: 'Nested action' }],
          },
        ]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const subTrigger = await waitFor(() => {
      const item = document.body.querySelector('[data-slot="item"]') as HTMLElement | null
      expect(item).not.toBeNull()
      return item as HTMLElement
    })

    await fireEvent.click(subTrigger)

    const submenuContent = await waitFor(() => {
      const content = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
        (element) => element.textContent?.includes('Nested action'),
      ) as HTMLElement | undefined

      expect(content).toBeDefined()
      return content!
    })

    await waitFor(() => {
      const activeElement = document.activeElement
      expect(activeElement === submenuContent || submenuContent.contains(activeElement)).toBe(true)
    })
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

  test('keeps content mounted with closed data attrs until exit motion finishes', async () => {
    render(() => (
      <DropdownMenu defaultOpen items={[{ label: 'Open file' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    await fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      const exitingContent = document.body.querySelector('[data-slot="content"]') as HTMLElement
      expect(exitingContent).not.toBeNull()
      expect(exitingContent.getAttribute('data-closed')).toBe('')
    })

    await finishMenuExitMotion()

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
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

    expect(rootContent.className).toContain('mt-$mo-popper-content-overflow-padding')
    expect(rootContent.className).toContain('data-expanded:animate-menu-in')
    expect(rootContent.className).toContain('data-closed:animate-menu-out')
    expect(rootContent.className).toContain('animate-menu-side-bottom')
    expect(rootContent.className).not.toContain('animate-menu-side-top')
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
          {
            type: 'group',
            label: 'Account',
            children: [
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
          },
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
    expect(document.body.querySelectorAll('[data-slot="item"]').length).toBeGreaterThanOrEqual(2)
    expect(document.body.querySelector('[data-testid="avatar-node"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="itemIndicator"]')).not.toBeNull()

    expect(rootContent?.className).toContain('mr-$mo-popper-content-overflow-padding')
    expect(rootContent?.className).toContain('surface-overlay')
    expect(rootContent?.className).toContain('data-expanded:animate-menu-in')
    expect(rootContent?.className).toContain('data-closed:animate-menu-out')
    expect(rootContent?.className).toContain('animate-menu-side-left')
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
    expect(checkboxItem.hasAttribute('data-selected')).toBe(false)
    checkboxItem.focus()
    await fireEvent.keyDown(checkboxItem, { key: 'Enter' })
    expect(checkboxItem.hasAttribute('data-selected')).toBe(true)

    const disabledItem = Array.from(document.body.querySelectorAll('[data-slot="item"]')).find(
      (el) => el.textContent?.includes('Disabled action'),
    ) as HTMLElement

    await fireEvent.click(disabledItem)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(onDisabledSelect).not.toHaveBeenCalled()
  })

  test('supports radio items with grouped selection and disabled prevention', async () => {
    const onCompactSelect = vi.fn()
    const onComfortableValueChange = vi.fn()
    const onDisabledSelect = vi.fn()

    render(() => (
      <DropdownMenu
        defaultOpen
        items={[
          {
            type: 'radio',
            group: 'density',
            value: 'compact',
            label: 'Compact',
            checked: true,
            onSelect: onCompactSelect,
          },
          {
            type: 'radio',
            group: 'density',
            value: 'comfortable',
            label: 'Comfortable',
            onValueChange: onComfortableValueChange,
          },
          {
            type: 'radio',
            group: 'density',
            value: 'spacious',
            label: 'Spacious',
            disabled: true,
            onSelect: onDisabledSelect,
          },
        ]}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    const radioItems = Array.from(
      document.body.querySelectorAll('[role="menuitemradio"]'),
    ) as HTMLElement[]
    const [compactItem, comfortableItem, disabledItem] = radioItems as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ]

    expect(compactItem.getAttribute('aria-checked')).toBe('true')
    expect(compactItem.hasAttribute('data-selected')).toBe(true)
    expect(comfortableItem.getAttribute('aria-checked')).toBe('false')
    expect(comfortableItem.hasAttribute('data-selected')).toBe(false)
    expect(disabledItem.getAttribute('aria-disabled')).toBe('true')

    await fireEvent.click(comfortableItem)

    expect(compactItem.getAttribute('aria-checked')).toBe('false')
    expect(compactItem.hasAttribute('data-selected')).toBe(false)
    expect(comfortableItem.getAttribute('aria-checked')).toBe('true')
    expect(comfortableItem.hasAttribute('data-selected')).toBe(true)
    expect(onComfortableValueChange).toHaveBeenCalledWith('comfortable')

    await fireEvent.click(disabledItem)

    expect(disabledItem.getAttribute('aria-checked')).toBe('false')
    expect(comfortableItem.getAttribute('aria-checked')).toBe('true')
    expect(onDisabledSelect).not.toHaveBeenCalled()
    expect(onCompactSelect).not.toHaveBeenCalled()
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

  test('keeps submenu open while pointer moves through the submenu grace area', async () => {
    render(() => (
      <DropdownMenu
        defaultOpen
        items={[
          {
            label: 'More',
            defaultOpen: true,
            children: [{ label: 'Nested action' }],
          },
          { label: 'Sibling action' },
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

    const items = Array.from(document.body.querySelectorAll('[data-slot="item"]'))
    const subTrigger = items.find((item) => item.textContent?.includes('More')) as HTMLElement
    const sibling = items.find((item) =>
      item.textContent?.includes('Sibling action'),
    ) as HTMLElement
    const subContent = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
      (content) => content.textContent?.includes('Nested action'),
    ) as HTMLElement

    subContent.getBoundingClientRect = () =>
      ({
        bottom: 120,
        height: 80,
        left: 60,
        right: 140,
        top: 40,
        width: 80,
        x: 60,
        y: 40,
        toJSON: () => ({}),
      }) as DOMRect

    await fireEvent.pointerLeave(subTrigger, { clientX: 50, clientY: 80, pointerType: 'mouse' })
    await fireEvent.pointerEnter(sibling, { clientX: 80, clientY: 80, pointerType: 'mouse' })

    expect(sibling.hasAttribute('data-highlighted')).toBe(false)
    expect(subTrigger.getAttribute('data-expanded')).toBe('')
    expect(document.body.textContent).toContain('Nested action')
  })

  test('restores submenu selection after pointer grace when moving toward another submenu', async () => {
    vi.useFakeTimers()

    try {
      render(() => (
        <DropdownMenu
          defaultOpen
          items={[
            {
              label: 'More',
              defaultOpen: true,
              children: [{ label: 'Nested action' }],
            },
            {
              label: 'More tools',
              children: [{ label: 'Second nested action' }],
            },
          ]}
        >
          <button type="button">Actions</button>
        </DropdownMenu>
      ))

      await waitFor(() => {
        expect(document.body.textContent).toContain('Nested action')
      })

      const items = Array.from(document.body.querySelectorAll('[data-slot="item"]'))
      const firstTrigger = items.find((item) => item.textContent?.includes('More')) as HTMLElement
      const secondTrigger = items.find((item) =>
        item.textContent?.includes('More tools'),
      ) as HTMLElement
      const firstContent = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
        (content) => content.textContent?.includes('Nested action'),
      ) as HTMLElement

      firstContent.getBoundingClientRect = () =>
        ({
          bottom: 120,
          height: 80,
          left: 60,
          right: 140,
          top: 40,
          width: 80,
          x: 60,
          y: 40,
          toJSON: () => ({}),
        }) as DOMRect

      await fireEvent.pointerLeave(firstTrigger, { clientX: 50, clientY: 80, pointerType: 'mouse' })
      await fireEvent.pointerEnter(secondTrigger, {
        clientX: 80,
        clientY: 80,
        pointerType: 'mouse',
      })

      expect(secondTrigger.hasAttribute('data-highlighted')).toBe(false)

      await vi.advanceTimersByTimeAsync(301)

      expect(secondTrigger.getAttribute('data-highlighted')).toBe('')

      await vi.advanceTimersByTimeAsync(100)

      await waitFor(() => {
        expect(document.body.textContent).toContain('Second nested action')
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('applies styles override to content', async () => {
    render(() => (
      <DropdownMenu
        defaultOpen
        styles={{ content: { width: '200px' } }}
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

  test('forwards content and item props and lets item events prevent selection', async () => {
    const contentRef = vi.fn()
    const itemRef = vi.fn()
    const onSelect = vi.fn()
    render(() => (
      <DropdownMenu
        defaultOpen
        items={[{ label: 'Archive', onSelect }]}
        contentProps={{
          ref: contentRef,
          'data-track': 'actions-menu',
          class: 'content-prop',
          style: { width: '240px' },
        }}
        itemProps={(context) => ({
          ref: itemRef,
          'data-label': context.item.label as string,
          class: 'item-prop',
          style: { height: '40px' },
          onClick: (event) => event.preventDefault(),
        })}
      >
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-track="actions-menu"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-track="actions-menu"]') as HTMLElement
    const item = document.body.querySelector('[data-label="Archive"]') as HTMLElement

    expect(contentRef).toHaveBeenCalledWith(content)
    expect(itemRef).toHaveBeenCalledWith(item)
    expect(content.className).toContain('content-prop')
    expect(content.style.width).toBe('240px')
    expect(item.className).toContain('item-prop')
    expect(item.style.height).toBe('40px')

    await fireEvent.click(item)

    expect(onSelect).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="content"][data-expanded]')).not.toBeNull()
  })

  test('locks body scroll and renders an overlay layer while open', async () => {
    render(() => (
      <DropdownMenu defaultOpen items={[{ label: 'Archive' }]}>
        <button type="button">Actions</button>
      </DropdownMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="overlay"]')).not.toBeNull()
    })

    const positioner = document.body.querySelector('[data-slot="positioner"]') as HTMLElement
    expect(positioner.className).not.toContain('z-50')
    expect(document.body.style.overflow).toBe('hidden')

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    await fireEvent.pointerDown(overlay, { pointerType: 'mouse' })
    await finishMenuExitMotion()

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})
