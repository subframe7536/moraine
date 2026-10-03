import { BaseSelect, Icon } from '@src'
import { createBaseSelectSearchInput } from '@src/utils'
import type { BaseSelectSearchInputOptions } from '@src/utils'
import { createMemo, createSignal, For } from 'solid-js'

const FRAMEWORKS = [
  { value: 'solid', label: 'Solid', description: 'Fine-grained reactive UI' },
  { value: 'react', label: 'React', description: 'Component-based UI' },
  { value: 'astro', label: 'Astro', description: 'Content-focused web framework' },
  { value: 'sveltekit', label: 'SvelteKit', description: 'Application framework for Svelte' },
]

function SearchControl(
  props: Pick<BaseSelectSearchInputOptions, 'searchValue' | 'setSearchValue'>,
) {
  const state = BaseSelect.useContext()
  const input = createBaseSelectSearchInput({
    state,
    searchValue: () => props.searchValue(),
    setSearchValue: (value) => props.setSearchValue(value),
  })
  return (
    <BaseSelect.Control class="px-2 border border-input rounded-md flex w-64 items-center">
      <input
        {...input.inputProps}
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
  const [searchValue, setSearchValue] = createSignal('')
  const items = createMemo(() => {
    const query = searchValue().toLowerCase()
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
      <SearchControl searchValue={searchValue} setSearchValue={setSearchValue} />
      <BaseSelect.Content onExitComplete={() => setSearchValue('')}>
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
