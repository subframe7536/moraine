import { Combobox } from '@src'
import type { ComboboxT } from '@src'
import { createSignal } from 'solid-js'

interface RepoItem extends ComboboxT.Item {
  label: string
}

const ALL_REPOS: RepoItem[] = [
  { label: 'subframe7536/moraine', value: 'moraine', icon: 'i-lucide:box' },
  { label: 'solidjs/solid', value: 'solid', icon: 'i-lucide:box' },
  { label: 'tailwindlabs/tailwindcss', value: 'tailwind', icon: 'i-lucide:box' },
  { label: 'unocss/unocss', value: 'unocss', icon: 'i-lucide:box' },
  { label: 'vitejs/vite', value: 'vite', icon: 'i-lucide:box' },
]

export function AsyncSearch() {
  const [query, setQuery] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [items, setItems] = createSignal<ComboboxT.Item[]>(ALL_REPOS)

  let timer: ReturnType<typeof setTimeout> | undefined

  function handleSearch(search: string) {
    setQuery(search)
    setLoading(true)
    clearTimeout(timer)

    timer = setTimeout(() => {
      const filtered = ALL_REPOS.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()),
      )
      setItems(filtered)
      setLoading(false)
    }, 400)
  }

  return (
    <div class="max-w-xs w-full space-y-2">
      <Combobox
        items={items()}
        searchValue={query()}
        onSearch={handleSearch}
        loading={loading()}
        filterItem={false}
        placeholder="Type to search repositories..."
        leadingIcon="i-lucide:search"
        openOnControlClick
        allowClear
      />
      <p class="text-xs text-muted-foreground">
        {loading() ? 'Searching remote index...' : `${items().length} repositories found`}
      </p>
    </div>
  )
}
