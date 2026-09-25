import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import type { JSX } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { Dialog } from '../../overlay/dialog'
import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'
import { defineTheme } from '../../theme'

import { CommandPalette } from './command-palette'
import type { CommandPaletteT } from './command-palette.types'

function renderWithTheme(ui: () => JSX.Element) {
  return render(() => <MoraineProvider>{ui()}</MoraineProvider>)
}

const body = () => within(document.body)

afterEach(() => {
  vi.useRealTimers()
})

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

describe('CommandPalette', () => {
  test('renders component defaults when provider is absent', async () => {
    render(() => <CommandPalette groups={GROUPS} />)
    await waitFor(() => {
      const root = document.body.querySelector('[data-slot="command-palette"]')
      expect(root?.className).not.toBe('')
      const listbox = document.body.querySelector('[data-slot="command-palette-listbox"]')
      expect(listbox?.className).not.toBe('')
    })
  })

  test('forwards ref to root div and inputRef to input element', async () => {
    let rootRef: HTMLDivElement | undefined
    let inputRef: HTMLInputElement | undefined
    render(() => (
      <CommandPalette
        ref={(el) => (rootRef = el)}
        inputRef={(el) => (inputRef = el)}
        groups={GROUPS}
      />
    ))
    await waitFor(() => {
      expect(rootRef).toBeInstanceOf(HTMLDivElement)
      expect(inputRef).toBeInstanceOf(HTMLInputElement)
    })
  })
  test('focuses the standalone input without a native autofocus attribute', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const input = document.body.querySelector(
        '[data-slot="command-palette-input"]',
      ) as HTMLInputElement

      expect(input).not.toBeNull()
      expect(input.hasAttribute('autofocus')).toBe(false)
      expect(document.activeElement).toBe(input)
    })
  })

  test('applies fixed listbox max height', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="command-palette-listbox"]')?.className,
      ).toContain('max-h-72')
    })
  })

  test('adjusts item trailing spacing via classes.itemTrailing', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} classes={{ itemTrailing: 'gap-2' }} />)

    await waitFor(() => {
      const trailing = Array.from(
        document.body.querySelectorAll('[data-slot="command-palette-item-trailing"]'),
      )
      expect(trailing.some((el) => el.classList.contains('gap-2'))).toBe(true)
    })
  })

  test('keeps item gap classes for icon and non-icon entries', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const withIcon = body().getByText('New File').closest('[data-slot="command-palette-item"]')
      const withoutIcon = body()
        .getByText('Go to Dashboard')
        .closest('[data-slot="command-palette-item"]')

      expect(withIcon?.className).toContain('gap-2')
      expect(withoutIcon?.className).toContain('gap-2')
      expect(
        document.body.querySelector('[data-slot="command-palette-item-leading"]'),
      ).not.toBeNull()
    })
  })

  test('renders input and item labels', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(body().getByPlaceholderText('Search...')).toBeTruthy()
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('renders group labels', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(body().getByText('Actions')).toBeTruthy()
      expect(body().getByText('Navigation')).toBeTruthy()
    })
  })

  test('shows empty state when no groups', async () => {
    renderWithTheme(() => <CommandPalette groups={[]} />)

    await waitFor(() => {
      expect(body().getByText('No results.')).toBeTruthy()
    })
  })

  test('custom trailing content renders in item', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      expect(body().getByText('⌘N')).toBeTruthy()
      expect(
        document.body.querySelector('[data-slot="command-palette-item-trailing"]'),
      ).not.toBeNull()
    })
  })

  test('fires item and palette selection callbacks and closes by default', async () => {
    const onItemSelect = vi.fn()
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const selectedItem = { value: 'action', label: 'Action', onSelect: onItemSelect }

    renderWithTheme(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [selectedItem] }]}
        onSelect={onSelect}
        onClose={onClose}
      />
    ))

    await waitFor(() => body().getByText('Action'))

    const item = document.body.querySelector('[data-slot="command-palette-item"]') as HTMLElement
    fireEvent.click(item)

    expect(onItemSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(selectedItem)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('prevents mouse pointerdown but preserves touch and pen tap synthesis', async () => {
    const onSelect = vi.fn()
    renderWithTheme(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]}
        closeOnSelect={false}
        onSelect={onSelect}
      />
    ))
    const item = body()
      .getByText('Action')
      .closest('[data-slot="command-palette-item"]') as HTMLElement
    const mouseEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    })
    const touchEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
    })
    const penEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'pen',
    })

    item.dispatchEvent(mouseEvent)
    item.dispatchEvent(touchEvent)
    item.dispatchEvent(penEvent)
    fireEvent.click(item)

    expect(mouseEvent.defaultPrevented).toBe(true)
    expect(touchEvent.defaultPrevented).toBe(false)
    expect(penEvent.defaultPrevented).toBe(false)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('preserves caller pointerdown cancellation', () => {
    renderWithTheme(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]}
        itemProps={() => ({ onPointerDown: (event) => event.preventDefault() })}
      />
    ))
    const item = body()
      .getByText('Action')
      .closest('[data-slot="command-palette-item"]') as HTMLElement
    const touchEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
    })

    item.dispatchEvent(touchEvent)

    expect(touchEvent.defaultPrevented).toBe(true)
  })

  test('keeps the palette open when closeOnSelect is false', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()

    renderWithTheme(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]}
        closeOnSelect={false}
        onSelect={onSelect}
        onClose={onClose}
      />
    ))

    await waitFor(() => body().getByText('Action'))
    fireEvent.click(
      document.body.querySelector('[data-slot="command-palette-item"]') as HTMLElement,
    )

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="command-palette-item"]')).not.toBeNull()
  })

  test('activates the highlighted item on Enter', async () => {
    const onSelect = vi.fn()

    renderWithTheme(() => (
      <CommandPalette
        groups={[
          {
            id: 'g',
            items: [
              { value: 'first', label: 'First' },
              { value: 'second', label: 'Second' },
            ],
          },
        ]}
        onSelect={onSelect}
      />
    ))

    const input = body().getByPlaceholderText('Search...')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('does not activate a command from composition Enter events', () => {
    vi.useFakeTimers()
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const onCompositionStart = vi.fn()
    const onCompositionEnd = vi.fn()
    const screen = renderWithTheme(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]}
        disableFilter
        onSelect={onSelect}
        onClose={onClose}
        inputProps={{ onCompositionStart, onCompositionEnd }}
      />
    ))
    const input = screen.getByRole('combobox')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '候補' } })
    const composingEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    input.dispatchEvent(composingEnter)

    fireEvent.compositionEnd(input)
    const completionEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    input.dispatchEvent(completionEnter)

    expect((input as HTMLInputElement).value).toBe('候補')
    expect(onCompositionStart).toHaveBeenCalledOnce()
    expect(onCompositionEnd).toHaveBeenCalledOnce()
    expect(composingEnter.defaultPrevented).toBe(false)
    expect(completionEnter.defaultPrevented).toBe(false)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    const intentionalEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    input.dispatchEvent(intentionalEnter)

    expect(intentionalEnter.defaultPrevented).toBe(true)
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  test('restarts and disposes the composition Enter guard', () => {
    vi.useFakeTimers()
    const screen = renderWithTheme(() => (
      <CommandPalette groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]} />
    ))
    const input = screen.getByRole('combobox')

    fireEvent.compositionStart(input)
    fireEvent.compositionEnd(input)
    vi.advanceTimersByTime(50)
    fireEvent.compositionStart(input)
    fireEvent.compositionEnd(input)
    vi.advanceTimersByTime(50)

    const guardedEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    input.dispatchEvent(guardedEnter)
    expect(guardedEnter.defaultPrevented).toBe(false)

    expect(vi.getTimerCount()).toBeGreaterThan(0)
    screen.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('supports overriding built-in icons', async () => {
    renderWithTheme(() => (
      <CommandPalette
        showClose
        leadingIcon="icon-hash"
        loadingIcon="icon-reload"
        closeIcon="icon-minus"
        groups={GROUPS}
      />
    ))

    await waitFor(() => {
      const search = document.body.querySelector(
        '[data-slot="command-palette-input-leading"]',
      ) as HTMLElement
      const close = document.body.querySelector(
        '[data-slot="command-palette-close"] [data-slot="icon"]',
      ) as HTMLElement

      expect(search.className).toContain('icon-hash')
      expect(close.className).toContain('icon-minus')
    })
  })

  test('close button renders and calls onClose', async () => {
    const onClose = vi.fn()
    renderWithTheme(() => <CommandPalette groups={GROUPS} showClose onClose={onClose} />)

    await waitFor(() => {
      const closeBtn = document.body.querySelector(
        '[data-slot="command-palette-close"]',
      ) as HTMLElement
      expect(closeBtn).not.toBeNull()
      fireEvent.click(closeBtn)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('composes with Dialog for trigger and controlled close behavior', async () => {
    const [open, setOpen] = createSignal(false)

    renderWithTheme(() => (
      <Dialog open={open()} onOpenChange={setOpen}>
        <Dialog.Trigger as="button" type="button">
          Open palette
        </Dialog.Trigger>
        <Dialog.Content close={false}>
          <Dialog.Body>
            {<CommandPalette groups={GROUPS} showClose onClose={() => setOpen(false)} />}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="command-palette-input"]')).toBeNull()
    fireEvent.click(document.body.querySelector('[data-slot="dialog-trigger"]') as HTMLElement)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="command-palette-input"]')).not.toBeNull()
      expect(document.activeElement).toBe(
        document.body.querySelector('[data-slot="command-palette-input"]'),
      )
    })

    fireEvent.click(
      document.body.querySelector('[data-slot="command-palette-close"]') as HTMLElement,
    )
    await finishExitMotion()

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="command-palette-input"]')).toBeNull()
    })
  })

  test('disabled item has data-disabled attribute', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const items = document.body.querySelectorAll('[data-slot="command-palette-item"]')
      const disabledItem = [...items].find((el) => el.getAttribute('data-disabled') !== null)
      expect(disabledItem).toBeTruthy()
    })
  })

  test('renders custom placeholder', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} placeholder="Type a command..." />)

    await waitFor(() => {
      expect(body().getByPlaceholderText('Type a command...')).toBeTruthy()
    })
  })

  test('applies classes overrides to root and slots', async () => {
    renderWithTheme(() => (
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
          groupLabel: 'label-override',
          item: 'item-override',
          inputLeading: 'search-override',
          close: 'close-override',
        }}
        footerRender={() => <span>Footer content</span>}
      />
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="command-palette"]')?.className).toContain(
        'root-override',
      )
      expect(
        document.body.querySelector('[data-slot="command-palette-input-wrapper"]')?.className,
      ).toContain('input-wrapper-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-input"]')?.className,
      ).toContain('input-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-listbox"]')?.className,
      ).toContain('listbox-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-footer"]')?.className,
      ).toContain('footer-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-group"]')?.className,
      ).toContain('group-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-group-label"]')?.className,
      ).toContain('label-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-item"]')?.className,
      ).toContain('item-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-input-leading"]')?.className,
      ).toContain('search-override')
      expect(
        document.body.querySelector('[data-slot="command-palette-close"]')?.className,
      ).toContain('close-override')
    })
  })

  test('renders footer content when footer is provided', async () => {
    renderWithTheme(() => (
      <CommandPalette groups={GROUPS} footerRender={() => <span>Palette Footer</span>} />
    ))

    await waitFor(() => {
      expect(body().getByText('Palette Footer')).toBeTruthy()
      expect(document.body.querySelector('[data-slot="command-palette-footer"]')).not.toBeNull()
    })
  })

  test('applies classes.empty override', async () => {
    renderWithTheme(() => <CommandPalette groups={[]} classes={{ empty: 'empty-override' }} />)

    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="command-palette-empty"]')?.className,
      ).toContain('empty-override')
    })
  })

  test('applies styles.empty override', async () => {
    renderWithTheme(() => <CommandPalette groups={[]} styles={{ empty: { width: '200px' } }} />)

    await waitFor(() => {
      expect(
        document.body.querySelector<HTMLElement>('[data-slot="command-palette-empty"]')?.style
          .width,
      ).toBe('200px')
    })
  })

  test('filters by controlled searchTerm', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} searchTerm="Settings" />)

    await waitFor(() => {
      expect(body().getByText('Go to Settings')).toBeTruthy()
      expect(body().queryByText('Go to Dashboard')).toBeNull()
    })
  })

  test('warns for duplicate item values while keeping items renderable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    renderWithTheme(() => (
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
      expect(body().getByText('First')).toBeTruthy()
      expect(body().getByText('Second')).toBeTruthy()
    })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[moraine] CommandPalette'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate item value "dup"'))
    warnSpy.mockRestore()
  })

  test('renders footerRender and emptyRender with current state', async () => {
    renderWithTheme(() => (
      <CommandPalette
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
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    const input = body().getByPlaceholderText('Search...')
    fireEvent.keyDown(input, { key: 'Backspace' })

    await waitFor(() => {
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('passes filtered visibleGroups to footerRender', async () => {
    renderWithTheme(() => (
      <CommandPalette
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
    renderWithTheme(() => (
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
      expect(body().getByText('Empty missing:0')).toBeTruthy()
    })
  })

  test('supports custom itemRender with runtime item context', async () => {
    renderWithTheme(() => (
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
      expect(body().getByTestId('custom-item').textContent).toBe('Action:Run it:focused')
    })
  })

  test('passes filtered visibleGroups to itemRender', async () => {
    renderWithTheme(() => (
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
      expect(body().getByTestId('visible-groups').textContent).toBe('go-settings:1')
    })
  })

  test('infers custom item metadata in itemRender', async () => {
    interface CustomItem extends CommandPaletteT.Item {
      route: string
    }

    renderWithTheme(() => (
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
      expect(body().getByTestId('typed-item').textContent).toBe('g:/docs/action')
    })
  })

  test('uses the resolved description position for classes and item structure', async () => {
    const [descriptionPosition, setDescriptionPosition] = createSignal<
      'bottom' | 'trailing' | undefined
    >()
    render(() => (
      <MoraineProvider
        theme={defineTheme({
          commandPalette: { defaultVariants: { descriptionPosition: 'trailing' } },
        })}
      >
        <CommandPalette
          descriptionPosition={descriptionPosition()}
          groups={[
            {
              id: 'g',
              items: [{ value: 'item', label: 'Item', description: 'Description' }],
            },
          ]}
        />
      </MoraineProvider>
    ))

    await waitFor(() => {
      expect(body().getByText('Item')).not.toBeNull()
    })

    const item = body().getByText('Item').closest('[data-slot="command-palette-item"]')!
    const wrapper = item.querySelector('[data-slot="command-palette-item-wrapper"]')!
    const label = item.querySelector('[data-slot="command-palette-item-label"]')!
    const description = item.querySelector('[data-slot="command-palette-item-description"]')!

    expect(description.parentElement).toBe(label)
    expect(wrapper.className).toContain('flex-row')
    expect(label.className).toContain('flex-1')
    expect(wrapper.hasAttribute('data-description-position')).toBe(false)
    expect(label.hasAttribute('data-description-position')).toBe(false)

    setDescriptionPosition('bottom')

    expect(
      item.querySelector('[data-slot="command-palette-item-description"]')?.parentElement,
    ).toBe(wrapper)
    expect(wrapper.className).not.toContain('flex-row')
    expect(label.className).not.toContain('flex-1')
  })

  test('passes runtime state to leadingRender and trailingRender', async () => {
    renderWithTheme(() => (
      <CommandPalette
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
                    {ctx.searchTerm}:{ctx.active ? 'active' : 'inactive'}:
                    {ctx.selected ? 'selected' : 'unselected'}
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
      expect(body().getByTestId('trailing-state').textContent).toBe('run:active:selected')
    })
  })

  test('applies combobox and active descendant accessibility attributes', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const input = body().getByPlaceholderText('Search...')
      const listbox = document.body.querySelector('[data-slot="command-palette-listbox"]')
      const activeItem = document.body.querySelector(
        '[data-slot="command-palette-item"][data-highlighted]',
      )

      expect(input.getAttribute('role')).toBe('combobox')
      expect(input.getAttribute('aria-controls')).toBe(listbox?.id)
      expect(input.getAttribute('aria-expanded')).toBe('true')
      expect(input.getAttribute('aria-autocomplete')).toBe('list')
      expect(input.getAttribute('aria-activedescendant')).toBe(activeItem?.id)
      expect(activeItem?.getAttribute('aria-selected')).toBe('true')
    })
  })

  test('renders a virtual window while the input keeps active-descendant focus', async () => {
    const [entryIndex, setEntryIndex] = createSignal(1)
    const scrollToItem = vi.fn()
    renderWithTheme(() => (
      <CommandPalette
        groups={GROUPS}
        scrollToItem={(item, index) => {
          scrollToItem(item, index)
          setEntryIndex(index)
        }}
        virtualRender={(context) => (
          <For each={[context.entries[entryIndex()]!]}>
            {(entry) => context.render(entry, entryIndex(), { 'data-index': entryIndex() })}
          </For>
        )}
      />
    ))

    const input = body().getByPlaceholderText('Search...')
    input.focus()
    await waitFor(() => {
      expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(1)
      expect(document.body.querySelector('[role="option"]')?.textContent).toContain('New File')
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    await waitFor(() => {
      const option = document.body.querySelector('[role="option"]')
      expect(option?.textContent).toContain('Open Folder')
      expect(option?.getAttribute('data-index')).toBe('2')
      expect(option?.getAttribute('aria-posinset')).toBe('2')
      expect(option?.getAttribute('aria-setsize')).toBe('5')
      expect(input.getAttribute('aria-activedescendant')).toBe(option?.id)
    })
    expect(document.activeElement).toBe(input)
    expect(scrollToItem).toHaveBeenLastCalledWith(GROUPS[0]?.items?.[1], 2)
  })

  test('renders virtual group labels with virtual row props', async () => {
    renderWithTheme(() => (
      <CommandPalette
        groups={GROUPS}
        virtualRender={(context) => {
          const firstEntry = context.entries[0]
          return (
            <For each={firstEntry ? [firstEntry] : []}>
              {(entry) => context.render(entry, 0, { 'data-index': 'virtual-label' })}
            </For>
          )
        }}
      />
    ))

    await waitFor(() => {
      const group = document.body.querySelector('[data-slot="command-palette-group"]')

      expect(group?.getAttribute('role')).toBe('presentation')
      expect(group?.getAttribute('data-index')).toBe('virtual-label')
      expect(group?.querySelector('[data-slot="command-palette-group-label"]')?.textContent).toBe(
        'Actions',
      )
    })
  })

  test('uses consistent command row metrics', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const option = document.body.querySelector('[role="option"]')
      expect(option?.className).toContain('text-sm')
      expect(option?.className).toContain('min-h-8')
    })
  })

  test('includes description and keywords in built-in search', async () => {
    renderWithTheme(() => (
      <CommandPalette
        searchTerm="alias"
        groups={[
          {
            id: 'g',
            items: [
              { value: 'run', label: 'Run', description: 'Visible by description' },
              { value: 'docs', label: 'Docs', keywords: ['alias'] },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Docs')).toBeTruthy()
      expect(body().queryByText('Run')).toBeNull()
    })

    renderWithTheme(() => (
      <CommandPalette
        searchTerm="description"
        groups={[
          {
            id: 'g2',
            items: [{ value: 'run', label: 'Run', description: 'Visible by description' }],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Run')).toBeTruthy()
    })
  })

  test('supports getItemSearchText override', async () => {
    renderWithTheme(() => (
      <CommandPalette
        searchTerm="custom-hit"
        getItemSearchText={(item) => (item.value === 'second' ? 'custom-hit' : item.value)}
        groups={[
          {
            id: 'g',
            items: [
              { value: 'first', label: 'First' },
              { value: 'second', label: 'Second' },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Second')).toBeTruthy()
      expect(body().queryByText('First')).toBeNull()
    })
  })

  test('supports filterItems override and keeps visibleGroups in sync', async () => {
    renderWithTheme(() => (
      <CommandPalette
        searchTerm="ignored"
        groups={GROUPS}
        filterItems={({ groups }) => groups.filter((group) => group.id === 'navigation')}
        footerRender={(ctx) => <span>Visible {ctx.visibleGroups.length}</span>}
      />
    ))

    await waitFor(() => {
      expect(body().queryByText('Actions')).toBeNull()
      expect(body().getByText('Navigation')).toBeTruthy()
      expect(body().getByText('Visible 1')).toBeTruthy()
    })
  })

  test('skips built-in filtering when disableFilter is enabled', async () => {
    renderWithTheme(() => <CommandPalette groups={GROUPS} searchTerm="missing" disableFilter />)

    await waitFor(() => {
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('forwards input, listbox, and item props', async () => {
    const listboxRef = vi.fn()
    const itemRef = vi.fn()
    renderWithTheme(() => (
      <CommandPalette
        groups={GROUPS}
        inputProps={{
          name: 'command-search',
          'aria-label': 'Command Search',
          'data-track': 'command-input',
        }}
        listboxProps={{
          ref: listboxRef,
          'data-track': 'command-list',
          class: 'listbox-prop',
          style: { height: '200px' },
        }}
        itemProps={(context) => ({
          ref: context.item.value === 'new-file' ? itemRef : undefined,
          'data-value': context.item.value,
          class: 'item-prop',
          style: { height: '40px' },
        })}
      />
    ))

    await waitFor(() => {
      const input = body().getByLabelText<HTMLInputElement>('Command Search')

      expect(input.name).toBe('command-search')
      expect(input.getAttribute('data-track')).toBe('command-input')
    })

    const listbox = document.body.querySelector(
      '[data-slot="command-palette-listbox"]',
    ) as HTMLElement
    const item = document.body.querySelector('[data-value="new-file"]') as HTMLElement

    expect(listboxRef).toHaveBeenCalledWith(listbox)
    expect(itemRef).toHaveBeenCalledWith(item)
    expect(listbox.getAttribute('data-track')).toBe('command-list')
    expect(listbox.className).toContain('listbox-prop')
    expect(listbox.style.height).toBe('200px')
    expect(item.className).toContain('item-prop')
    expect(item.style.height).toBe('40px')

    fireEvent.scroll(listbox)
  })
})
