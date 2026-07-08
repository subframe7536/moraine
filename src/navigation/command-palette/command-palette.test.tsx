import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { CommandPalette } from './command-palette'
import type { CommandPaletteT } from './command-palette'

const body = () => within(document.body)

const GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'actions',
    label: 'Actions',
    items: [
      {
        value: 'new-file',
        label: 'New File',
        leadingRender: () => <span class="i-lucide-file-plus" />,
        trailingRender: () => <span>⌘N</span>,
      },
      {
        value: 'open-folder',
        label: 'Open Folder',
        leadingRender: () => <span class="i-lucide-folder-open" />,
      },
      { value: 'disabled-action', label: 'Disabled Action', disabled: true },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      { value: 'go-dashboard', label: 'Go to Dashboard' },
      { value: 'go-settings', label: 'Go to Settings' },
    ],
  },
]

async function finishExitMotion(): Promise<void> {
  const contents = Array.from(
    document.body.querySelectorAll('[data-slot="content"]'),
  ) as HTMLElement[]
  const overlays = Array.from(
    document.body.querySelectorAll('[data-slot="overlay"]'),
  ) as HTMLElement[]

  for (const content of contents) {
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)
  }

  for (const overlay of overlays) {
    await fireEvent.animationEnd(overlay)
    await fireEvent.transitionEnd(overlay)
  }
}

describe('CommandPalette', () => {
  test('forces input focus in modal when autofocus is enabled', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      const input = document.body.querySelector('[data-slot="input"]') as HTMLInputElement | null

      expect(input).not.toBeNull()
      expect(document.activeElement).toBe(input)
    })
  })

  test('opens from optional trigger children', async () => {
    const screen = render(() => (
      <CommandPalette groups={GROUPS}>
        <button type="button">Open palette</button>
      </CommandPalette>
    ))

    expect(document.body.querySelector('[data-slot="input"]')).toBeNull()

    await fireEvent.click(screen.getByText('Open palette'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="input"]')).not.toBeNull()
    })
  })

  test('supports controlled open and onOpenChange close flow', async () => {
    const onOpenChange = vi.fn()

    function ControlledPalette() {
      const [open, setOpen] = createSignal(true)

      return (
        <CommandPalette
          open={open()}
          onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen)
            setOpen(nextOpen)
          }}
          groups={GROUPS}
          showClose
        />
      )
    }

    render(() => <ControlledPalette />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    await fireEvent.click(document.body.querySelector('[data-slot="close"]') as HTMLElement)
    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('closes by default when an enabled item is selected', async () => {
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()

    render(() => (
      <CommandPalette
        defaultOpen
        onOpenChange={onOpenChange}
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', onSelect }] }]}
      />
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="item"]')).not.toBeNull()
    })

    await fireEvent.click(document.body.querySelector('[data-slot="item"]') as HTMLElement)
    await finishExitMotion()

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('keeps modal open after item selection when closeOnSelect=false', async () => {
    const onOpenChange = vi.fn()
    const onSelect = vi.fn()

    render(() => (
      <CommandPalette
        defaultOpen
        closeOnSelect={false}
        onOpenChange={onOpenChange}
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', onSelect }] }]}
      />
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="item"]')).not.toBeNull()
    })

    await fireEvent.click(document.body.querySelector('[data-slot="item"]') as HTMLElement)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('applies fixed modal content position and removes centered axes', async () => {
    render(() => <CommandPalette open groups={GROUPS} position={{ top: 72, left: 96 }} />)

    await waitFor(() => {
      const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null

      expect(content?.style.top).toBe('72px')
      expect(content?.style.left).toBe('96px')
      expect(content?.className).not.toContain('-translate-x-1/2')
      expect(content?.className).not.toContain('-translate-y-1/2')
    })
  })

  test('keeps horizontal centering when only top position is provided', async () => {
    render(() => <CommandPalette open groups={GROUPS} position={{ top: 72 }} />)

    await waitFor(() => {
      const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null

      expect(content?.style.top).toBe('72px')
      expect(content?.className).toContain('-translate-x-1/2')
      expect(content?.className).not.toContain('-translate-y-1/2')
    })
  })

  test('notifies actual modal content position after mount', async () => {
    const onPositionChange = vi.fn()

    render(() => (
      <CommandPalette
        open
        groups={GROUPS}
        position={{ top: 72, left: 96 }}
        onPositionChange={onPositionChange}
      />
    ))

    await waitFor(() => {
      expect(onPositionChange).toHaveBeenCalledWith({ top: 0, left: 0 })
    })
  })

  test('applies fixed listbox max height', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="listbox"]')?.className).toContain(
        'max-h-36vh',
      )
    })
  })

  test('adjusts item trailing spacing via classes.itemTrailing', async () => {
    render(() => <CommandPalette open groups={GROUPS} classes={{ itemTrailing: 'gap-1' }} />)

    await waitFor(() => {
      const trailing = Array.from(
        document.body.querySelectorAll('[data-slot="itemTrailing"]'),
      ) as HTMLElement[]
      expect(trailing.some((el) => el.classList.contains('gap-1'))).toBe(true)
    })

    render(() => <CommandPalette open groups={GROUPS} classes={{ itemTrailing: 'gap-1.5' }} />)

    await waitFor(() => {
      const trailing = Array.from(
        document.body.querySelectorAll('[data-slot="itemTrailing"]'),
      ) as HTMLElement[]
      expect(trailing.some((el) => el.classList.contains('gap-1.5'))).toBe(true)
    })

    render(() => <CommandPalette open groups={GROUPS} classes={{ itemTrailing: 'gap-2' }} />)

    await waitFor(() => {
      const trailing = Array.from(
        document.body.querySelectorAll('[data-slot="itemTrailing"]'),
      ) as HTMLElement[]
      expect(trailing.some((el) => el.classList.contains('gap-2'))).toBe(true)
    })
  })

  test('keeps item gap classes for icon and non-icon entries', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      const withIcon = body().getByText('New File').closest('[data-slot="item"]')
      const withoutIcon = body().getByText('Go to Dashboard').closest('[data-slot="item"]')

      expect(withIcon?.className).toContain('gap-2')
      expect(withoutIcon?.className).toContain('gap-2')
      expect(document.body.querySelector('[data-slot="itemLeading"]')).not.toBeNull()
    })
  })

  test('renders input and item labels', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      expect(body().getByPlaceholderText('Search...')).toBeTruthy()
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('renders group labels', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      expect(body().getByText('Actions')).toBeTruthy()
      expect(body().getByText('Navigation')).toBeTruthy()
    })
  })

  test('shows empty state when no groups', async () => {
    render(() => <CommandPalette open groups={[]} />)

    await waitFor(() => {
      expect(body().getByText('No results.')).toBeTruthy()
    })
  })

  test('custom trailing content renders in item', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      expect(body().getByText('⌘N')).toBeTruthy()
      expect(document.body.querySelector('[data-slot="itemTrailing"]')).not.toBeNull()
    })
  })

  test('fires onSelect when a leaf item is activated', async () => {
    const onSelect = vi.fn()

    render(() => (
      <CommandPalette
        open
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', onSelect }] }]}
      />
    ))

    await waitFor(() => body().getByText('Action'))

    const item = document.body.querySelector('[data-slot="item"]') as HTMLElement
    await fireEvent.click(item)

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('activates the highlighted item on Enter', async () => {
    const onSelect = vi.fn()

    render(() => (
      <CommandPalette
        open
        groups={[
          {
            id: 'g',
            items: [
              { value: 'first', label: 'First' },
              { value: 'second', label: 'Second', onSelect },
            ],
          },
        ]}
      />
    ))

    const input = body().getByPlaceholderText('Search...') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('supports overriding built-in icons', async () => {
    render(() => (
      <CommandPalette
        open
        showClose
        leadingIcon="icon-hash"
        loadingIcon="icon-reload"
        closeIcon="icon-minus"
        groups={GROUPS}
      />
    ))

    await waitFor(() => {
      const search = document.body.querySelector(
        '[data-slot="search"] [data-slot="icon"]',
      ) as HTMLElement
      const close = document.body.querySelector(
        '[data-slot="close"] [data-slot="icon"]',
      ) as HTMLElement

      expect(search.className).toContain('icon-hash')
      expect(close.className).toContain('icon-minus')
    })
  })

  test('close button renders and calls onClose', async () => {
    const onClose = vi.fn()
    const onOpenChange = vi.fn()
    render(() => (
      <CommandPalette
        defaultOpen
        groups={GROUPS}
        showClose
        onClose={onClose}
        onOpenChange={onOpenChange}
      />
    ))

    await waitFor(() => {
      const closeBtn = document.body.querySelector('[data-slot="close"]') as HTMLElement
      expect(closeBtn).not.toBeNull()
      fireEvent.click(closeBtn)
    })

    await finishExitMotion()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('disabled item has data-disabled attribute', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    await waitFor(() => {
      const items = document.body.querySelectorAll('[data-slot="item"]')
      const disabledItem = [...items].find((el) => el.getAttribute('data-disabled') !== null)
      expect(disabledItem).toBeTruthy()
    })
  })

  test('renders custom placeholder', async () => {
    render(() => <CommandPalette open groups={GROUPS} placeholder="Type a command..." />)

    await waitFor(() => {
      expect(body().getByPlaceholderText('Type a command...')).toBeTruthy()
    })
  })

  test('applies classes overrides to root and slots', async () => {
    render(() => (
      <CommandPalette
        open
        showClose
        groups={GROUPS}
        classes={{
          root: 'root-override',
          inputWrapper: 'input-wrapper-override',
          input: 'input-override',
          listbox: 'listbox-override',
          footer: 'footer-override',
          group: 'group-override',
          label: 'label-override',
          item: 'item-override',
          search: 'search-override',
          close: 'close-override',
        }}
        footerRender={() => <span>Footer content</span>}
      />
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="root"]')?.className).toContain(
        'root-override',
      )
      expect(document.body.querySelector('[data-slot="inputWrapper"]')?.className).toContain(
        'input-wrapper-override',
      )
      expect(document.body.querySelector('[data-slot="input"]')?.className).toContain(
        'input-override',
      )
      expect(document.body.querySelector('[data-slot="listbox"]')?.className).toContain(
        'listbox-override',
      )
      expect(document.body.querySelector('[data-slot="footer"]')?.className).toContain(
        'footer-override',
      )
      expect(document.body.querySelector('[data-slot="group"]')?.className).toContain(
        'group-override',
      )
      expect(document.body.querySelector('[data-slot="label"]')?.className).toContain(
        'label-override',
      )
      expect(document.body.querySelector('[data-slot="item"]')?.className).toContain(
        'item-override',
      )
      expect(document.body.querySelector('[data-slot="search"]')?.className).toContain(
        'search-override',
      )
      expect(document.body.querySelector('[data-slot="close"]')?.className).toContain(
        'close-override',
      )
    })
  })

  test('renders footer content when footer is provided', async () => {
    render(() => (
      <CommandPalette open groups={GROUPS} footerRender={() => <span>Palette Footer</span>} />
    ))

    await waitFor(() => {
      expect(body().getByText('Palette Footer')).toBeTruthy()
      expect(document.body.querySelector('[data-slot="footer"]')).not.toBeNull()
    })
  })

  test('applies classes.empty override', async () => {
    render(() => <CommandPalette open groups={[]} classes={{ empty: 'empty-override' }} />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="empty"]')?.className).toContain(
        'empty-override',
      )
    })
  })

  test('applies styles.empty override', async () => {
    render(() => <CommandPalette open groups={[]} styles={{ empty: { width: '200px' } }} />)

    await waitFor(() => {
      expect(
        (document.body.querySelector('[data-slot="empty"]') as HTMLElement | null)?.style.width,
      ).toBe('200px')
    })
  })

  test('filters by controlled searchTerm', async () => {
    render(() => <CommandPalette open groups={GROUPS} searchTerm="Settings" />)

    await waitFor(() => {
      expect(body().getByText('Go to Settings')).toBeTruthy()
      expect(body().queryByText('Go to Dashboard')).toBeNull()
    })
  })

  test('warns for duplicate item values while keeping items renderable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(() => (
      <CommandPalette
        open
        groups={[
          {
            id: 'g',
            items: [
              { value: 'dup', label: 'First' },
              { value: 'dup', label: 'Second' },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('First')).toBeTruthy()
      expect(body().getByText('Second')).toBeTruthy()
    })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate item value "dup"'))
    warnSpy.mockRestore()
  })

  test('renders footerRender and emptyRender with current state', async () => {
    render(() => (
      <CommandPalette
        open
        groups={[]}
        searchTerm="missing"
        emptyRender={(ctx) => <span>Empty {ctx.searchTerm}</span>}
        footerRender={(ctx) => <span>Groups {ctx.groups.length}</span>}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Empty missing')).toBeTruthy()
      expect(body().getByText('Groups 0')).toBeTruthy()
    })
  })

  test('keeps the list unchanged on Backspace with an empty input', async () => {
    render(() => <CommandPalette open groups={GROUPS} />)

    const input = body().getByPlaceholderText('Search...') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'Backspace' })

    await waitFor(() => {
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('passes filtered visibleGroups to footerRender', async () => {
    render(() => (
      <CommandPalette
        open
        groups={GROUPS}
        searchTerm="Settings"
        footerRender={(ctx) => (
          <span>Visible {ctx.visibleGroups.flatMap((group) => group.items ?? []).length}</span>
        )}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Visible 1')).toBeTruthy()
    })
  })

  test('passes filtered visibleGroups to emptyRender', async () => {
    render(() => (
      <CommandPalette
        open
        groups={GROUPS}
        searchTerm="missing"
        emptyRender={(ctx) => (
          <span>
            Empty {ctx.searchTerm}:{ctx.visibleGroups.flatMap((group) => group.items ?? []).length}
          </span>
        )}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Empty missing:0')).toBeTruthy()
    })
  })

  test('supports custom itemRender with runtime item context', async () => {
    render(() => (
      <CommandPalette
        open
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', description: 'Run it' }] }]}
        itemRender={(ctx) => (
          <span data-testid="custom-item">
            {ctx.item.label}:{ctx.item.description}:{ctx.focused ? 'focused' : 'idle'}
          </span>
        )}
      />
    ))

    await waitFor(() => {
      expect(body().getByTestId('custom-item').textContent).toBe('Action:Run it:focused')
    })
  })

  test('passes filtered visibleGroups to itemRender', async () => {
    render(() => (
      <CommandPalette
        open
        groups={GROUPS}
        searchTerm="Settings"
        itemRender={(ctx) => (
          <span data-testid="visible-groups">
            {ctx.item.value}:{ctx.visibleGroups.flatMap((group) => group.items ?? []).length}
          </span>
        )}
      />
    ))

    await waitFor(() => {
      expect(body().getByTestId('visible-groups').textContent).toBe('go-settings:1')
    })
  })

  test('infers custom item metadata in itemRender', async () => {
    interface CustomItem extends CommandPaletteT.Item {
      route: string
    }

    render(() => (
      <CommandPalette<CustomItem>
        open
        groups={[
          {
            id: 'g',
            items: [{ value: 'action', label: 'Action', route: '/docs/action' }],
          },
        ]}
        itemRender={(ctx) => (
          <span data-testid="typed-item">
            {ctx.group.id}:{ctx.item.route}
          </span>
        )}
      />
    ))

    await waitFor(() => {
      expect(body().getByTestId('typed-item').textContent).toBe('g:/docs/action')
    })
  })

  test('supports root and item-level search and description position options', async () => {
    render(() => (
      <CommandPalette
        open
        searchTerm="zzz"
        descriptionPosition="trailing"
        groups={[
          {
            id: 'g',
            items: [
              { value: 'always', label: 'Always', description: 'Visible', alwaysShow: true },
              {
                value: 'bottom',
                label: 'Bottom',
                description: 'Below',
                descriptionPosition: 'bottom',
                alwaysShow: true,
              },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      const always = body().getByText('Always').closest('[data-slot="item"]')
      const bottom = body().getByText('Bottom').closest('[data-slot="item"]')

      expect(
        always?.querySelector('[data-slot="itemLabel"] [data-slot="itemDescription"]'),
      ).not.toBeNull()
      expect(
        bottom?.querySelector('[data-slot="itemWrapper"] [data-slot="itemDescription"]'),
      ).not.toBeNull()
    })
  })

  test('passes runtime state to leadingRender and trailingRender', async () => {
    render(() => (
      <CommandPalette
        open
        searchTerm="run"
        groups={[
          {
            id: 'g',
            items: [
              {
                value: 'run',
                label: 'Run',
                leadingRender: (ctx) => (
                  <span data-testid="leading-state">
                    {ctx.focused ? 'focused' : 'idle'}:{ctx.disabled ? 'disabled' : 'enabled'}
                  </span>
                ),
                trailingRender: (ctx) => (
                  <span data-testid="trailing-state">
                    {ctx.searchTerm}:{ctx.selected ? 'selected' : 'unselected'}
                  </span>
                ),
              },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByTestId('leading-state').textContent).toBe('focused:enabled')
      expect(body().getByTestId('trailing-state').textContent).toBe('run:unselected')
    })
  })

  test('requires value in item type contract', () => {
    // @ts-expect-error value is required
    const item: CommandPaletteT.Item = { label: 'No value' }
    expect(item).toBeDefined()
  })

  test('rejects legacy item shortcut prop in type contract', () => {
    // @ts-expect-error kbds has been removed in favor of custom trailing content
    const item: CommandPaletteT.Item = { value: 'x', label: 'Legacy', kbds: ['⌘', 'K'] }
    expect(item).toBeDefined()
  })
})
