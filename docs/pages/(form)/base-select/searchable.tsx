import { BaseSelect, Icon, useSelectState } from '@src'
import { useBaseSelectSearchInput, useSearchValue } from '@src/utils'
import type { SearchValue } from '@src/utils'
import { createMemo, For, untrack } from 'solid-js'

const FRAMEWORKS = [
  { value: 'solid', label: 'Solid', description: 'Fine-grained reactive UI' },
  { value: 'react', label: 'React', description: 'Component-based UI' },
  { value: 'astro', label: 'Astro', description: 'Content-focused web framework' },
  { value: 'sveltekit', label: 'SvelteKit', description: 'Application framework for Svelte' },
]

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
      ? FRAMEWORKS.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query),
        )
      : FRAMEWORKS
  })
  return (
    <BaseSelect
      items={items()}
      getItemByValue={(value) => FRAMEWORKS.find((item) => item.value === value)}
      itemToLabelString={(item) => `${item.label} ${item.description}`}
    >
      <SearchControl search={search} />
      <BaseSelect.Content onExitComplete={() => search.setQuery('')}>
        <BaseSelect.Listbox>
          <For each={items()}>
            {(item) => (
              <BaseSelect.Item item={item}>
                {(state) => (
                  <>
                    <Icon
                      name="i-lucide:check"
                      class={state.selected ? 'opacity-100' : 'opacity-0'}
                    />
                    <span>
                      {state.item.label}
                      <small class="text-muted-foreground block">{state.item.description}</small>
                    </span>
                  </>
                )}
              </BaseSelect.Item>
            )}
          </For>
        </BaseSelect.Listbox>
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
