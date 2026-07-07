import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Dialog } from '../../overlays/dialog'

import { CommandPalette } from './command-palette'
import type { CommandPaletteT } from './command-palette'

const GROUPS: CommandPaletteT.Group[] = [
  {
    id: 'actions',
    label: 'Actions',
    items: [
      { value: 'new-file', label: 'New File', icon: 'i-lucide-file-plus', kbds: ['⌘', 'N'] },
      { value: 'open-folder', label: 'Open Folder', icon: 'i-lucide-folder-open' },
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

describe('CommandPalette', () => {
  test('forces input focus in dialog when autofocus is enabled', async () => {
    render(() => (
      <Dialog open close={false} body={<CommandPalette groups={GROUPS} />}>
        <button type="button">Open</button>
      </Dialog>
    ))

    await waitFor(() => {
      const input = document.body.querySelector('[data-slot="input"]') as HTMLInputElement | null

      expect(input).not.toBeNull()
      expect(document.activeElement).toBe(input)
    })
  })

  test('applies fixed listbox max height', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(screen.container.querySelector('[data-slot="listbox"]')?.className).toContain(
        'max-h-36vh',
      )
    })
  })

  test('adjusts item trailing spacing via classes.itemTrailingKbds', async () => {
    const xs = render(() => (
      <CommandPalette groups={GROUPS} classes={{ itemTrailingKbds: 'gap-1' }} />
    ))

    await waitFor(() => {
      const trailing = xs.container.querySelector(
        '[data-slot="itemTrailing-kbds"]',
      ) as HTMLElement | null
      expect(trailing?.classList.contains('gap-1')).toBe(true)
    })

    const md = render(() => (
      <CommandPalette groups={GROUPS} classes={{ itemTrailingKbds: 'gap-1.5' }} />
    ))

    await waitFor(() => {
      const trailing = md.container.querySelector(
        '[data-slot="itemTrailing-kbds"]',
      ) as HTMLElement | null
      expect(trailing?.classList.contains('gap-1.5')).toBe(true)
    })

    const xl = render(() => (
      <CommandPalette groups={GROUPS} classes={{ itemTrailingKbds: 'gap-2' }} />
    ))

    await waitFor(() => {
      const trailing = xl.container.querySelector(
        '[data-slot="itemTrailing-kbds"]',
      ) as HTMLElement | null
      expect(trailing?.classList.contains('gap-2')).toBe(true)
    })
  })

  test('keeps item gap classes for icon and non-icon entries', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const withIcon = screen.getByText('New File').closest('[data-slot="item"]')
      const withoutIcon = screen.getByText('Go to Dashboard').closest('[data-slot="item"]')

      expect(withIcon?.className).toContain('gap-2')
      expect(withoutIcon?.className).toContain('gap-2')
      expect(screen.container.querySelector('[data-slot="itemLeading"]')).not.toBeNull()
    })
  })

  test('renders input and item labels', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy()
      expect(screen.getByText('New File')).toBeTruthy()
      expect(screen.getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('renders group labels', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeTruthy()
      expect(screen.getByText('Navigation')).toBeTruthy()
    })
  })

  test('shows empty state when no groups', async () => {
    const screen = render(() => <CommandPalette groups={[]} />)

    await waitFor(() => {
      expect(screen.getByText('No results.')).toBeTruthy()
    })
  })

  test('kbds render in item', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const kbds = screen.container.querySelectorAll('[data-slot="itemTrailing-kbd"]')
      expect(kbds.length).toBeGreaterThan(0)
      expect(screen.container.querySelector('[data-slot="itemTrailing-kbds"]')).not.toBeNull()
    })
  })

  test('fires onSelect when a leaf item is activated', async () => {
    const onSelect = vi.fn()

    const screen = render(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', onSelect }] }]}
      />
    ))

    await waitFor(() => screen.getByText('Action'))

    const item = screen.container.querySelector('[data-slot="item"]') as HTMLElement
    await fireEvent.click(item)

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('activates the highlighted item on Enter', async () => {
    const onSelect = vi.fn()

    const screen = render(() => (
      <CommandPalette
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

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('supports overriding built-in icons', async () => {
    const screen = render(() => (
      <CommandPalette
        showClose
        leadingIcon="icon-hash"
        loadingIcon="icon-reload"
        closeIcon="icon-minus"
        groups={GROUPS}
      />
    ))

    await waitFor(() => {
      const search = screen.container.querySelector(
        '[data-slot="search"] [data-slot="icon"]',
      ) as HTMLElement
      const close = screen.container.querySelector(
        '[data-slot="close"] [data-slot="icon"]',
      ) as HTMLElement

      expect(search.className).toContain('icon-hash')
      expect(close.className).toContain('icon-minus')
    })
  })

  test('close button renders and calls onClose', async () => {
    const onClose = vi.fn()
    const screen = render(() => <CommandPalette groups={GROUPS} showClose onClose={onClose} />)

    await waitFor(() => {
      const closeBtn = screen.container.querySelector('[data-slot="close"]') as HTMLElement
      expect(closeBtn).not.toBeNull()
      fireEvent.click(closeBtn)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('disabled item has data-disabled attribute', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const items = screen.container.querySelectorAll('[data-slot="item"]')
      const disabledItem = [...items].find((el) => el.getAttribute('data-disabled') !== null)
      expect(disabledItem).toBeTruthy()
    })
  })

  test('renders custom placeholder', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} placeholder="Type a command..." />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command...')).toBeTruthy()
    })
  })

  test('applies classes overrides to root and slots', async () => {
    const screen = render(() => (
      <CommandPalette
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
      expect(screen.container.querySelector('[data-slot="root"]')?.className).toContain(
        'root-override',
      )
      expect(screen.container.querySelector('[data-slot="inputWrapper"]')?.className).toContain(
        'input-wrapper-override',
      )
      expect(screen.container.querySelector('[data-slot="input"]')?.className).toContain(
        'input-override',
      )
      expect(screen.container.querySelector('[data-slot="listbox"]')?.className).toContain(
        'listbox-override',
      )
      expect(screen.container.querySelector('[data-slot="footer"]')?.className).toContain(
        'footer-override',
      )
      expect(screen.container.querySelector('[data-slot="group"]')?.className).toContain(
        'group-override',
      )
      expect(screen.container.querySelector('[data-slot="label"]')?.className).toContain(
        'label-override',
      )
      expect(screen.container.querySelector('[data-slot="item"]')?.className).toContain(
        'item-override',
      )
      expect(screen.container.querySelector('[data-slot="search"]')?.className).toContain(
        'search-override',
      )
      expect(screen.container.querySelector('[data-slot="close"]')?.className).toContain(
        'close-override',
      )
    })
  })

  test('renders footer content when footer is provided', async () => {
    const screen = render(() => (
      <CommandPalette groups={GROUPS} footerRender={() => <span>Palette Footer</span>} />
    ))

    await waitFor(() => {
      expect(screen.getByText('Palette Footer')).toBeTruthy()
      expect(screen.container.querySelector('[data-slot="footer"]')).not.toBeNull()
    })
  })

  test('applies classes.empty override', async () => {
    const screen = render(() => (
      <CommandPalette groups={[]} classes={{ empty: 'empty-override' }} />
    ))

    await waitFor(() => {
      expect(screen.container.querySelector('[data-slot="empty"]')?.className).toContain(
        'empty-override',
      )
    })
  })

  test('applies styles.empty override', async () => {
    const screen = render(() => (
      <CommandPalette groups={[]} styles={{ empty: { width: '200px' } }} />
    ))

    await waitFor(() => {
      expect(
        (screen.container.querySelector('[data-slot="empty"]') as HTMLElement | null)?.style.width,
      ).toBe('200px')
    })
  })

  test('filters by controlled searchTerm', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} searchTerm="Settings" />)

    await waitFor(() => {
      expect(screen.getByText('Go to Settings')).toBeTruthy()
      expect(screen.queryByText('Go to Dashboard')).toBeNull()
    })
  })

  test('warns for duplicate item values while keeping items renderable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const screen = render(() => (
      <CommandPalette
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
      expect(screen.getByText('First')).toBeTruthy()
      expect(screen.getByText('Second')).toBeTruthy()
    })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate item value "dup"'))
    warnSpy.mockRestore()
  })

  test('renders footerRender and emptyRender with current state', async () => {
    const screen = render(() => (
      <CommandPalette
        groups={[]}
        searchTerm="missing"
        emptyRender={(ctx) => <span>Empty {ctx.searchTerm}</span>}
        footerRender={(ctx) => <span>Groups {ctx.groups.length}</span>}
      />
    ))

    await waitFor(() => {
      expect(screen.getByText('Empty missing')).toBeTruthy()
      expect(screen.getByText('Groups 0')).toBeTruthy()
    })
  })

  test('keeps the list unchanged on Backspace with an empty input', async () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'Backspace' })

    await waitFor(() => {
      expect(screen.getByText('New File')).toBeTruthy()
      expect(screen.getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('passes filtered visibleGroups to footerRender', async () => {
    const screen = render(() => (
      <CommandPalette
        groups={GROUPS}
        searchTerm="Settings"
        footerRender={(ctx) => (
          <span>Visible {ctx.visibleGroups.flatMap((group) => group.items ?? []).length}</span>
        )}
      />
    ))

    await waitFor(() => {
      expect(screen.getByText('Visible 1')).toBeTruthy()
    })
  })

  test('passes filtered visibleGroups to emptyRender', async () => {
    const screen = render(() => (
      <CommandPalette
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
      expect(screen.getByText('Empty missing:0')).toBeTruthy()
    })
  })

  test('supports custom itemRender with runtime item context', async () => {
    const screen = render(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', description: 'Run it' }] }]}
        itemRender={(ctx) => (
          <span data-testid="custom-item">
            {ctx.item.label}:{ctx.item.description}:{ctx.focused ? 'focused' : 'idle'}
          </span>
        )}
      />
    ))

    await waitFor(() => {
      expect(screen.getByTestId('custom-item').textContent).toBe('Action:Run it:focused')
    })
  })

  test('passes filtered visibleGroups to itemRender', async () => {
    const screen = render(() => (
      <CommandPalette
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
      expect(screen.getByTestId('visible-groups').textContent).toBe('go-settings:1')
    })
  })

  test('infers custom item metadata in itemRender', async () => {
    interface CustomItem extends CommandPaletteT.Item {
      route: string
    }

    const screen = render(() => (
      <CommandPalette<CustomItem>
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
      expect(screen.getByTestId('typed-item').textContent).toBe('g:/docs/action')
    })
  })

  test('supports root and item-level search and description position options', async () => {
    const screen = render(() => (
      <CommandPalette
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
      const always = screen.getByText('Always').closest('[data-slot="item"]')
      const bottom = screen.getByText('Bottom').closest('[data-slot="item"]')

      expect(
        always?.querySelector('[data-slot="itemTrailing"] [data-slot="itemDescription"]'),
      ).not.toBeNull()
      expect(
        bottom?.querySelector('[data-slot="itemWrapper"] [data-slot="itemDescription"]'),
      ).not.toBeNull()
    })
  })

  test('requires value in item type contract', () => {
    // @ts-expect-error value is required
    const item: CommandPaletteT.Item = { label: 'No value' }
    expect(item).toBeDefined()
  })

  test('rejects item classes in type contract', () => {
    // @ts-expect-error item-level classes has been removed
    const item: CommandPaletteT.Item = { value: 'x', label: 'Legacy', classes: { item: 'x' } }
    expect(item).toBeDefined()
  })
})
