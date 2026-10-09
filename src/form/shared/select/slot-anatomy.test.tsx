import { render } from '@solidjs/testing-library'
import { For, Show } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { BaseSelect } from '../../base-select/base-select'
import { Combobox } from '../../combobox/combobox'
import { MultiSelect } from '../../multi-select/multi-select'
import { Select } from '../../select/select'

const items = [{ value: 'one', label: 'One', description: 'First option', icon: 'icon-check' }]
const grouped = [
  {
    type: 'group' as const,
    label: 'Group',
    items: [{ value: 'one', label: 'One', description: 'First option', icon: 'icon-check' }],
  },
  { type: 'separator' as const },
  {
    type: 'group' as const,
    label: 'More',
    items: [{ value: 'two', label: 'Two' }],
  },
]

function slotName(owner: string, slot: string): string {
  return `${owner}-${slot.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}

function expectSlots(owner: string, slots: readonly string[]): void {
  for (const slot of slots) {
    const name = slotName(owner, slot)
    expect(document.body.querySelector(`[data-slot="${name}"]`), name).not.toBeNull()
  }
}

describe('Select-family slot anatomy', () => {
  test.each([
    ['select', () => <Select items={items} defaultValue="one" defaultOpen />],
    ['combobox', () => <Combobox items={items} defaultValue="one" defaultOpen />],
    ['multi-select', () => <MultiSelect items={items} defaultValue={['one']} defaultOpen />],
  ] as const)('%s keeps local style slots and owns its default row DOM', (owner, component) => {
    const screen = render(component)
    const item = document.body.querySelector(`[data-slot="${owner}-item"]`)!
    const leading = item.querySelector(`[data-slot="${owner}-item-leading"]`)
    const wrapper = item.querySelector(`[data-slot="${owner}-item-wrapper"]`)
    const label = wrapper?.querySelector(`[data-slot="${owner}-item-label"]`)
    const description = wrapper?.querySelector(`[data-slot="${owner}-item-description"]`)
    const indicator = item.querySelector(`[data-slot="${owner}-item-indicator"]`)

    expect(leading).not.toBeNull()
    expect(wrapper).not.toBeNull()
    expect(label?.textContent).toBe('One')
    expect(description?.textContent).toBe('First option')
    expect(indicator).not.toBeNull()
    expect(document.body.querySelector('[data-slot^="base-select-"]')).toBeNull()
    screen.unmount()
  })

  test('exposes every coexistable Select playground slot while open', () => {
    const screen = render(() => (
      <Select items={grouped} defaultValue="one" leadingIcon="icon-check" allowClear defaultOpen />
    ))
    expectSlots('select', [
      'control',
      'content',
      'listbox',
      'item',
      'group',
      'groupLabel',
      'separator',
      'leading',
      'clear',
      'itemLeading',
      'itemWrapper',
      'itemLabel',
      'itemDescription',
      'itemIndicator',
      'trigger',
      'trailing',
      'value',
    ])
    screen.unmount()
  })

  test('exposes every coexistable Combobox playground slot while open', () => {
    const screen = render(() => (
      <Combobox
        items={grouped}
        defaultValue="one"
        leadingIcon="icon-check"
        allowClear
        defaultOpen
      />
    ))
    expectSlots('combobox', [
      'control',
      'content',
      'listbox',
      'item',
      'group',
      'groupLabel',
      'separator',
      'leading',
      'clear',
      'itemLeading',
      'itemWrapper',
      'itemLabel',
      'itemDescription',
      'itemIndicator',
      'input',
      'trigger',
    ])
    expect(document.body.querySelector('[data-slot="combobox-empty"]')).toBeNull()
    screen.unmount()
  })

  test('exposes Combobox empty when the open list has no items', () => {
    const screen = render(() => <Combobox items={[]} defaultOpen />)
    expectSlots('combobox', ['empty', 'content', 'listbox', 'input', 'trigger'])
    screen.unmount()
  })

  test('exposes every coexistable MultiSelect playground slot while open', () => {
    const screen = render(() => (
      <MultiSelect
        items={grouped}
        defaultValue={['one', 'two']}
        leadingIcon="icon-check"
        allowClear
        maxTagCount={1}
        search
        defaultOpen
      />
    ))
    expectSlots('multi-select', [
      'control',
      'content',
      'listbox',
      'item',
      'group',
      'groupLabel',
      'separator',
      'leading',
      'clear',
      'itemLeading',
      'itemWrapper',
      'itemLabel',
      'itemDescription',
      'itemIndicator',
      'input',
      'trigger',
      'tagsContainer',
      'tag',
      'tagLabel',
      'tagRemove',
      'tagOverflow',
    ])
    expect(document.body.querySelector('[data-slot="multi-select-empty"]')).toBeNull()
    screen.unmount()
  })

  test('exposes MultiSelect empty when the open list has no items', () => {
    const screen = render(() => <MultiSelect items={[]} search defaultOpen />)
    expectSlots('multi-select', ['empty', 'content', 'listbox', 'input', 'trigger'])
    screen.unmount()
  })

  test('exposes every coexistable BaseSelect playground slot while open', () => {
    const groups = [
      { label: 'Group', items: [{ value: 'one', label: 'One' }] },
      { label: 'More', items: [{ value: 'two', label: 'Two' }] },
    ]
    const screen = render(() => (
      <BaseSelect items={groups.flatMap((group) => group.items)} defaultValue={['one']} defaultOpen>
        <BaseSelect.Control>
          <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <For each={groups}>
              {(group, index) => (
                <>
                  <Show when={index() > 0}>
                    <BaseSelect.Separator />
                  </Show>
                  <BaseSelect.Group>
                    <BaseSelect.GroupLabel>{group.label}</BaseSelect.GroupLabel>
                    <For each={group.items}>
                      {(item) => <BaseSelect.Item item={item}>{item.label}</BaseSelect.Item>}
                    </For>
                  </BaseSelect.Group>
                </>
              )}
            </For>
          </BaseSelect.Listbox>
          <BaseSelect.Empty>Empty</BaseSelect.Empty>
        </BaseSelect.Content>
      </BaseSelect>
    ))
    expectSlots('base-select', [
      'control',
      'trigger',
      'content',
      'listbox',
      'item',
      'group',
      'groupLabel',
      'separator',
    ])
    expect(document.body.querySelector('[data-slot="base-select-empty"]')).toBeNull()
    screen.unmount()
  })

  test('exposes BaseSelect empty when the open list has no items', () => {
    const screen = render(() => (
      <BaseSelect items={[]} defaultOpen>
        <BaseSelect.Control>
          <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
          <BaseSelect.Empty>Empty</BaseSelect.Empty>
        </BaseSelect.Content>
      </BaseSelect>
    ))
    expectSlots('base-select', ['control', 'trigger', 'content', 'listbox', 'empty'])
    screen.unmount()
  })
})
