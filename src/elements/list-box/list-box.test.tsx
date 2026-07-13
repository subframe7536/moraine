import { fireEvent, render } from '@solidjs/testing-library'
import { For } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { ListBox } from './list-box'

const ITEMS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
]

describe('ListBox', () => {
  test('renders a semantic list by default', () => {
    const screen = render(() => <ListBox items={ITEMS} />)

    expect(screen.getByRole('list')).not.toBeNull()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  test('renders structural label and separator entries', () => {
    const screen = render(() => (
      <ListBox
        items={[{ type: 'label', label: 'Fruit' }, ITEMS[0]!, { type: 'separator' }, ITEMS[1]!]}
      />
    ))

    expect(screen.getByText('Fruit')).not.toBeNull()
    expect(screen.container.querySelector('[role="separator"]')).not.toBeNull()
  })

  test('filters items from an external search value', () => {
    const screen = render(() => <ListBox items={ITEMS} searchValue="ban" />)

    expect(screen.getByText('Banana')).not.toBeNull()
    expect(screen.queryByText('Apple')).toBeNull()
  })

  test('supports uncontrolled single selection and keyboard navigation', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <ListBox selectionMode="single" items={ITEMS} onChange={onChange} />
    ))
    const listbox = screen.getByRole('listbox')

    await fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    expect(listbox.getAttribute('aria-activedescendant')).toBe(`${listbox.id}-banana`)

    await fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('banana')
    expect(screen.getByRole('option', { name: 'Banana' }).getAttribute('aria-selected')).toBe(
      'true',
    )
  })

  test('supports multiple selection and skips disabled items', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <ListBox selectionMode="multiple" items={ITEMS} onChange={onChange} />
    ))
    const listbox = screen.getByRole('listbox')

    await fireEvent.keyDown(listbox, { key: 'Enter' })
    await fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    await fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana'])
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true')
  })

  test('does not react to printable keys', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <ListBox selectionMode="single" items={ITEMS} onChange={onChange} />
    ))

    await fireEvent.keyDown(screen.getByRole('listbox'), { key: 'b' })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelector('[data-highlighted]')?.textContent).toContain('Apple')
  })

  test('hides structural entries from the interactive accessibility tree', () => {
    const screen = render(() => (
      <ListBox
        selectionMode="single"
        items={[{ type: 'label', label: 'Fruit' }, ITEMS[0]!, { type: 'separator' }]}
      />
    ))

    expect(screen.container.querySelector('[data-slot="label"]')?.getAttribute('role')).toBe(
      'presentation',
    )
    expect(screen.container.querySelector('[data-slot="separator"]')?.getAttribute('role')).toBe(
      'presentation',
    )
  })

  test('delegates virtual rendering and scroll requests', async () => {
    const scrollToItem = vi.fn()
    const screen = render(() => (
      <ListBox
        selectionMode="single"
        items={ITEMS}
        virtualized
        scrollToItem={scrollToItem}
        virtualRender={({ entries, renderItem }) => (
          <For each={entries}>{(entry) => renderItem(entry, entries.indexOf(entry))}</For>
        )}
      />
    ))

    await fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })

    expect(scrollToItem).toHaveBeenCalledWith('banana')
  })
})
