import { BaseSelect, Icon, useSelectState } from '@src'
import { useBaseSelectSearchInput, useSearchValue } from '@src/utils'
import type { SearchValue } from '@src/utils'
import { createMemo, untrack } from 'solid-js'

import { FrameworkListbox, frameworks } from './frameworks'

function SearchControl(props: { search: SearchValue }) {
  const search = untrack(() => props.search)
  const state = useSelectState()
  const input = useBaseSelectSearchInput(state, {}, () => true, search)
  return (
    <BaseSelect.Control class="px-2 border border-input rounded-md flex w-64 items-center">
      <input
        {...input.binding}
        class="py-1.5 outline-none bg-transparent flex-1"
        placeholder="Search frameworks…"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Toggle frameworks"
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          state.focusOwner()?.focus()
        }}
        onClick={(event) => {
          event.stopPropagation()
          state.setOpen(!state.open())
        }}
      >
        <Icon name="i-lucide:chevrons-up-down" />
      </button>
    </BaseSelect.Control>
  )
}

export default function Example() {
  const search = useSearchValue()
  const items = createMemo(() => {
    const query = search.query().toLowerCase()
    return query
      ? frameworks.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query),
        )
      : frameworks
  })
  return (
    <BaseSelect
      items={items()}
      getItemByValue={(value) => frameworks.find((item) => item.value === value)}
      itemToLabelString={(item) => `${item.label} ${item.description}`}
    >
      <SearchControl search={search} />
      <BaseSelect.Content onExitComplete={() => search.setQuery('')}>
        <FrameworkListbox items={items} />
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
