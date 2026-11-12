import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'
import { defineTheme } from '../../theme'
import { Dialog } from '../dialog'

import { CommandPalette } from './command-palette'
import type { CommandPaletteT } from './command-palette.types'

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
  test('keeps an identified listbox around the empty state', () => {
    const screen = render(() => <CommandPalette groups={[]} autofocus={false} />)
    const input = screen.getByRole('combobox')
    const listbox = screen.getByRole('listbox')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
    expect(input.getAttribute('aria-label')).toBe('Search...')
    expect(listbox.querySelector('[data-slot="command-palette-empty"]')?.textContent).toBe(
      'No results.',
    )
  })

  test('keeps explicit input naming ahead of the placeholder fallback', () => {
    const labelled = render(() => (
      <CommandPalette
        groups={[]}
        autofocus={false}
        inputProps={{ 'aria-labelledby': 'search-title' }}
      />
    ))
    const input = labelled.getByRole('combobox')
    expect(input.getAttribute('aria-labelledby')).toBe('search-title')
    expect(input.hasAttribute('aria-label')).toBe(false)
    labelled.unmount()

    const named = render(() => (
      <CommandPalette
        groups={[]}
        autofocus={false}
        inputProps={{ 'aria-label': 'Find a command' }}
      />
    ))
    expect(named.getByRole('combobox').getAttribute('aria-label')).toBe('Find a command')
  })

  test('protects virtual row identity and positional semantics', () => {
    render(() => (
      <CommandPalette
        autofocus={false}
        groups={[{ id: 'actions', items: [{ value: 'run', label: 'Run' }] }]}
        virtualizer={{
          scrollToIndex: () => {},
          virtualRender: (context) => (
            <For each={context.entries}>
              {(entry) =>
                context.render(entry, 0, {
                  id: 'wrong-row',
                  role: 'button',
                  'aria-selected': false,
                  'aria-posinset': 99,
                  'aria-setsize': 99,
                })
              }
            </For>
          ),
        }}
      />
    ))
    const option = body().getByRole('option')
    expect(option.id).not.toBe('wrong-row')
    expect(option.getAttribute('aria-selected')).toBe('true')
    expect(option.getAttribute('aria-posinset')).toBe('1')
    expect(option.getAttribute('aria-setsize')).toBe('1')
    expect(option.getAttribute('data-slot')).toBe('command-palette-item')
  })

  test('updates replacement item data in a retained virtual row renderer', () => {
    const initial = { value: 'run', label: 'Run', disabled: false }
    const replacement = { value: 'run', label: 'Run again', disabled: true }
    const [item, setItem] = createSignal(initial)
    const onSelect = vi.fn()
    render(() => (
      <CommandPalette
        autofocus={false}
        groups={[{ id: 'actions', items: [item()] }]}
        onSelect={onSelect}
        itemRender={(context) => (
          <span>
            {context.item.label}:{context.disabled ? 'disabled' : 'enabled'}
          </span>
        )}
        virtualizer={{
          scrollToIndex: () => {},
          virtualRender: (context) => {
            const entry = context.entries[0]!
            return context.render(entry, 0, { 'data-index': 0 })
          },
        }}
      />
    ))

    expect(body().getByRole('option').textContent).toBe('Run:enabled')
    setItem(replacement)
    const disabledOption = body().getByRole('option')
    expect(disabledOption.textContent).toBe('Run again:disabled')
    expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(disabledOption)
    expect(onSelect).not.toHaveBeenCalled()

    const enabled = { ...replacement, disabled: false }
    setItem(enabled)
    const enabledOption = body().getByRole('option')
    expect(enabledOption.textContent).toBe('Run again:enabled')
    fireEvent.click(enabledOption)
    expect(onSelect).toHaveBeenCalledWith(enabled)
  })

  test('protects listbox and option semantics from forwarded props', async () => {
    const select = vi.fn()
    render(() => (
      <CommandPalette
        autofocus={false}
        groups={[{ id: 'actions', items: [{ value: 'run', label: 'Run' }] }]}
        onSelect={select}
        listboxProps={{ id: 'wrong', role: 'menu', 'data-slot': 'wrong-list' }}
        itemProps={() => ({
          id: 'wrong-item',
          role: 'button',
          'aria-selected': false,
          'data-slot': 'wrong-item',
          onClick: (event) => event.preventDefault(),
        })}
      />
    ))
    const input = body().getByRole('combobox')
    const listbox = body().getByRole('listbox')
    const option = body().getByRole('option')
    expect(listbox.id).not.toBe('wrong')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
    expect(option.id).not.toBe('wrong-item')
    expect(input.getAttribute('aria-activedescendant')).toBe(option.id)
    expect(option.getAttribute('aria-selected')).toBe('true')
    expect(listbox.getAttribute('data-slot')).toBe('command-palette-listbox')
    expect(option.getAttribute('data-slot')).toBe('command-palette-item')
    fireEvent.click(option)
    expect(select).not.toHaveBeenCalled()
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
    render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const input = document.body.querySelector(
        '[data-slot="command-palette-input"]',
      ) as HTMLInputElement

      expect(input).not.toBeNull()
      expect(input.hasAttribute('autofocus')).toBe(false)
      expect(document.activeElement).toBe(input)
    })
  })

  test('renders the search input, group labels, items, and per-item leading and trailing content', () => {
    render(() => <CommandPalette groups={GROUPS} autofocus={false} />)

    expect(body().getByPlaceholderText('Search...')).toBeTruthy()
    expect(body().getByRole('group', { name: 'Actions' })).toBeTruthy()
    expect(body().getByRole('group', { name: 'Navigation' })).toBeTruthy()
    expect(body().getAllByRole('option')).toHaveLength(5)

    const newFile = body().getByRole('option', { name: /New File/ })
    expect(newFile.querySelector('[data-slot="command-palette-item-leading"]')).not.toBeNull()
    expect(within(newFile).getByText('⌘N')).toBeTruthy()
    const dashboard = body().getByRole('option', { name: 'Go to Dashboard' })
    expect(dashboard.querySelector('[data-slot="command-palette-item-leading"]')).toBeNull()
    expect(dashboard.querySelector('[data-slot="command-palette-item-trailing"]')).toBeNull()
  })

  test('filters as the user types, reports the term, and shows the empty state without matches', () => {
    const onSearchTermChange = vi.fn()
    render(() => (
      <CommandPalette groups={GROUPS} autofocus={false} onSearchTermChange={onSearchTermChange} />
    ))
    const input = body().getByRole('combobox')

    fireEvent.input(input, { target: { value: 'settings' } })
    expect(onSearchTermChange).toHaveBeenLastCalledWith('settings')
    expect(
      body()
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Go to Settings'])
    expect(body().queryByRole('group', { name: 'Actions' })).toBeNull()

    fireEvent.input(input, { target: { value: 'zzz' } })
    expect(body().queryByRole('option')).toBeNull()
    expect(body().getByText('No results.')).toBeTruthy()
  })

  test('keeps a controlled searchTerm until the parent updates it', () => {
    const [term, setTerm] = createSignal('settings')
    render(() => <CommandPalette groups={GROUPS} autofocus={false} searchTerm={term()} />)
    const input = body().getByRole('combobox') as HTMLInputElement

    expect(input.value).toBe('settings')
    setTerm('dashboard')
    expect(input.value).toBe('dashboard')
    expect(
      body()
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Go to Dashboard'])
  })

  test('moves the highlight through enabled commands with wrapping and ignores disabled ones', () => {
    const onSelect = vi.fn()
    render(() => <CommandPalette groups={GROUPS} autofocus={false} onSelect={onSelect} />)
    const input = body().getByRole('combobox')
    const active = () => document.getElementById(input.getAttribute('aria-activedescendant')!)

    expect(active()?.textContent).toContain('New File')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()?.textContent).toContain('Open Folder')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(active()?.textContent).toContain('Go to Dashboard')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(active()?.textContent).toContain('Go to Settings')

    fireEvent.click(body().getByRole('option', { name: 'Disabled Action' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  test('fires item and palette selection callbacks and closes by default', async () => {
    const onItemSelect = vi.fn()
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const selectedItem = { value: 'action', label: 'Action', onSelect: onItemSelect }

    render(() => (
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
    render(() => (
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
    render(() => (
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

    render(() => (
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

    render(() => (
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
    const screen = render(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]}
        filterItems={({ groups }) => groups}
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

  test('ignores Enter that follows a second composition session shortly after it ends', () => {
    vi.useFakeTimers()
    const onSelect = vi.fn()
    const screen = render(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action' }] }]}
        onSelect={onSelect}
      />
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
    expect(onSelect).not.toHaveBeenCalled()
  })

  test('does not filter on partial IME composition', () => {
    const onSearchTermChange = vi.fn()
    const screen = render(() => (
      <CommandPalette groups={GROUPS} onSearchTermChange={onSearchTermChange} />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: 'zzzz' } })
    expect(onSearchTermChange).not.toHaveBeenCalled()
    expect(body().getByRole('option', { name: /New File/ })).not.toBeNull()
    fireEvent.compositionEnd(input)
    expect(onSearchTermChange).toHaveBeenCalledWith('zzzz')
    expect(body().queryByRole('option', { name: /New File/ })).toBeNull()
  })

  test('keeps Home and End on the search caret', () => {
    const screen = render(() => <CommandPalette groups={GROUPS} />)
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const highlighted = () =>
      body()
        .getAllByRole('option')
        .find((option) => option.hasAttribute('data-highlighted'))?.textContent
    const current = highlighted()
    const home = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Home' })
    input.dispatchEvent(home)
    expect(home.defaultPrevented).toBe(false)
    expect(highlighted()).toBe(current)
  })

  test('supports overriding built-in icons', () => {
    const [loading, setLoading] = createSignal(false)
    render(() => (
      <CommandPalette
        autofocus={false}
        closable
        leadingIcon="icon-hash"
        loadingIcon="icon-reload"
        closeIcon="icon-minus"
        loading={loading()}
        groups={GROUPS}
      />
    ))
    const leading = () =>
      document.body.querySelector<HTMLElement>('[data-slot="command-palette-input-leading"]')!
    const close = document.body.querySelector<HTMLElement>(
      '[data-slot="command-palette-close"] > *',
    )!

    expect(leading().className).toContain('icon-hash')
    expect(leading().hasAttribute('aria-busy')).toBe(false)
    expect(close.className).toContain('icon-minus')

    setLoading(true)
    expect(leading().className).toContain('icon-reload')
    expect(leading().getAttribute('aria-busy')).toBe('true')
  })

  test('shows a close button only when closable and reports clicks through onClose', () => {
    const onClose = vi.fn()
    const closable = render(() => (
      <CommandPalette groups={GROUPS} autofocus={false} closable onClose={onClose} />
    ))
    fireEvent.click(closable.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    closable.unmount()

    const plain = render(() => <CommandPalette groups={GROUPS} autofocus={false} />)
    expect(plain.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  test('composes with Dialog for trigger and controlled close behavior', async () => {
    const [open, setOpen] = createSignal(false)

    render(() => (
      <Dialog open={open()} onOpenChange={setOpen} closable={false}>
        <Dialog.Trigger as="button" type="button">
          Open palette
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>
            <CommandPalette groups={GROUPS} closable onClose={() => setOpen(false)} />
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
    render(() => <CommandPalette groups={GROUPS} />)

    await waitFor(() => {
      const items = document.body.querySelectorAll('[data-slot="command-palette-item"]')
      const disabledItem = [...items].find((el) => el.getAttribute('data-disabled') !== null)
      expect(disabledItem).toBeTruthy()
    })
  })

  test('renders custom placeholder', async () => {
    render(() => <CommandPalette groups={GROUPS} placeholder="Type a command..." />)

    await waitFor(() => {
      expect(body().getByPlaceholderText('Type a command...')).toBeTruthy()
    })
  })

  test('routes classes and styles to each slot', () => {
    render(() => (
      <CommandPalette
        autofocus={false}
        closable
        groups={GROUPS}
        classes={{
          root: 'user-root',
          inputWrapper: 'user-input-wrapper',
          input: 'user-input',
          listbox: 'user-listbox',
          footer: 'user-footer',
          group: 'user-group',
          groupLabel: 'user-group-label',
          item: 'user-item',
          itemTrailing: 'user-item-trailing',
          inputLeading: 'user-input-leading',
          close: 'user-close',
        }}
        styles={{ footer: { width: '200px' } }}
        footerRender={() => <span>Footer content</span>}
      />
    ))
    const slot = (name: string) =>
      document.body.querySelector<HTMLElement>(`[data-slot="command-palette-${name}"]`)!

    expect(slot('input-wrapper').className).toContain('user-input-wrapper')
    expect(slot('input').className).toContain('user-input')
    expect(slot('listbox').className).toContain('user-listbox')
    expect(slot('footer').className).toContain('user-footer')
    expect(slot('footer').style.width).toBe('200px')
    expect(slot('group').className).toContain('user-group')
    expect(slot('group-label').className).toContain('user-group-label')
    expect(slot('item').className).toContain('user-item')
    expect(slot('item-trailing').className).toContain('user-item-trailing')
    expect(slot('input-leading').className).toContain('user-input-leading')
    expect(slot('close').className).toContain('user-close')
    expect(document.body.querySelector('[data-slot="command-palette"]')!.className).toContain(
      'user-root',
    )
  })

  test('routes classes and styles to the empty slot', () => {
    render(() => (
      <CommandPalette
        autofocus={false}
        groups={[]}
        classes={{ empty: 'user-empty' }}
        styles={{ empty: { width: '200px' } }}
      />
    ))
    const empty = document.body.querySelector<HTMLElement>('[data-slot="command-palette-empty"]')!

    expect(empty.className).toContain('user-empty')
    expect(empty.style.width).toBe('200px')
  })

  test('warns for duplicate item values while keeping items renderable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(() => (
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
    render(() => (
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
    render(() => <CommandPalette groups={GROUPS} />)

    const input = body().getByPlaceholderText('Search...')
    fireEvent.keyDown(input, { key: 'Backspace' })

    await waitFor(() => {
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('passes filtered visibleGroups to footerRender', async () => {
    render(() => (
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
    render(() => (
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
    render(() => (
      <CommandPalette
        groups={[{ id: 'g', items: [{ value: 'action', label: 'Action', description: 'Run it' }] }]}
        itemRender={(ctx) => (
          <span data-testid="custom-item">
            {ctx.item.label}:{ctx.item.description}:{ctx.highlighted ? 'highlighted' : 'idle'}
          </span>
        )}
      />
    ))

    await waitFor(() => {
      expect(body().getByTestId('custom-item').textContent).toBe('Action:Run it:highlighted')
    })
  })

  test('passes filtered visibleGroups to itemRender', async () => {
    render(() => (
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

    render(() => (
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

  test('places the description by the resolved descriptionPosition, honoring theme defaults', async () => {
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

    setDescriptionPosition('bottom')

    expect(
      item.querySelector('[data-slot="command-palette-item-description"]')?.parentElement,
    ).toBe(wrapper)
  })

  test('passes runtime state to leadingRender and trailingRender', async () => {
    render(() => (
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
                    {ctx.highlighted ? 'highlighted' : 'idle'}:
                    {ctx.disabled ? 'disabled' : 'enabled'}
                  </span>
                ),
                trailingRender: (ctx) => (
                  <span data-testid="trailing-state">
                    {ctx.searchTerm}:{ctx.highlighted ? 'highlighted' : 'idle'}
                  </span>
                ),
              },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByTestId('leading-state').textContent).toBe('highlighted:enabled')
      expect(body().getByTestId('trailing-state').textContent).toBe('run:highlighted')
    })
  })

  test('applies combobox and active descendant accessibility attributes', async () => {
    render(() => <CommandPalette groups={GROUPS} />)

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
    const scrollToIndex = vi.fn()
    render(() => (
      <CommandPalette
        groups={GROUPS}
        virtualizer={{
          scrollToIndex: (index) => {
            scrollToIndex(index)
            setEntryIndex(index)
          },
          virtualRender: (context) => (
            <For each={[context.entries[entryIndex()]!]}>
              {(entry) => context.render(entry, entryIndex(), { 'data-index': entryIndex() })}
            </For>
          ),
        }}
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
    expect(scrollToIndex).toHaveBeenLastCalledWith(2)
  })

  test('renders virtual group labels with virtual row props', async () => {
    render(() => (
      <CommandPalette
        groups={GROUPS}
        virtualizer={{
          scrollToIndex: () => {},
          virtualRender: (context) => {
            const firstEntry = context.entries[0]
            return (
              <For each={firstEntry ? [firstEntry] : []}>
                {(entry) => context.render(entry, 0, { 'data-index': 'virtual-label' })}
              </For>
            )
          },
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

  test('matches item keywords in built-in search', async () => {
    render(() => (
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
  })

  test('matches item descriptions in built-in search', async () => {
    render(() => (
      <CommandPalette
        searchTerm="description"
        groups={[
          {
            id: 'g',
            items: [
              { value: 'run', label: 'Run', description: 'Visible by description' },
              { value: 'docs', label: 'Docs' },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      expect(body().getByText('Run')).toBeTruthy()
      expect(body().queryByText('Docs')).toBeNull()
    })
  })

  test('supports getItemSearchText override', async () => {
    render(() => (
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
    render(() => (
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

  test('renders the items returned by filterItems in the order it returns them', async () => {
    render(() => (
      <CommandPalette
        groups={GROUPS}
        filterItems={() => [
          {
            id: 'ranked',
            label: 'Ranked',
            items: [
              { value: 'z-last', label: 'Zeta' },
              { value: 'a-first', label: 'Alpha' },
            ],
          },
        ]}
      />
    ))

    await waitFor(() => {
      const options = body().getAllByRole('option')
      expect(options.map((option) => option.textContent)).toEqual([
        expect.stringContaining('Zeta'),
        expect.stringContaining('Alpha'),
      ])
    })
  })

  test('skips built-in filtering when custom filterItems returns all groups', async () => {
    render(() => (
      <CommandPalette groups={GROUPS} searchTerm="missing" filterItems={({ groups }) => groups} />
    ))

    await waitFor(() => {
      expect(body().getByText('New File')).toBeTruthy()
      expect(body().getByText('Go to Dashboard')).toBeTruthy()
    })
  })

  test('forwards input, listbox, and item props', async () => {
    const listboxRef = vi.fn()
    const itemRef = vi.fn()
    render(() => (
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
  })
})
