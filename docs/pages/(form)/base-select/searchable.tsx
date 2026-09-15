import { BaseSelect, Button, Input, useSelectState } from '@src'
import { useBaseSelectSearchInput, useSearchValue } from '@src/utils'
import type { SearchValue } from '@src/utils'
import { createMemo, untrack } from 'solid-js'

import { FrameworkListbox, frameworks } from './frameworks'

function SearchInput(props: { search: SearchValue }) {
  const search = untrack(() => props.search)
  const input = useBaseSelectSearchInput(useSelectState(), {}, () => true, search)
  return (
    <Input
      {...input.binding}
      role="searchbox"
      autofocus
      class="mb-1"
      placeholder="Search frameworks…"
    />
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
    <BaseSelect items={items()} itemToLabelString={(item) => `${item.label} ${item.description}`}>
      <BaseSelect.Trigger
        as={Button}
        variant="outline"
        class="min-w-52 justify-between"
        trailing="i-lucide:chevrons-up-down"
      >
        {(state) => (
          <span>
            {frameworks.find((item) => item.value === state.value[0])?.label ?? 'Select framework…'}
          </span>
        )}
      </BaseSelect.Trigger>
      <BaseSelect.Content onExitComplete={() => search.setQuery('')}>
        <SearchInput search={search} />
        <FrameworkListbox items={items} />
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
