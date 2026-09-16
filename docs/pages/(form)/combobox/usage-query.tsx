import { Button, Combobox } from '@src'
import type { ComboboxT } from '@src'
import { createSignal } from 'solid-js'

const FRAMEWORKS: ComboboxT.Item[] = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Astro', value: 'astro' },
]

export function UsageQuery() {
  const [selected, setSelected] = createSignal<string | null>('solid')
  const [query, setQuery] = createSignal('')

  return (
    <div class="max-w-xs w-full space-y-3">
      <Combobox
        items={FRAMEWORKS}
        value={selected()}
        onChange={setSelected}
        searchValue={query()}
        onSearch={setQuery}
        placeholder="Search framework..."
        leadingIcon="i-lucide:search"
        allowClear
      />
      <div class="text-xs text-muted-foreground space-y-1">
        <p>
          Committed Value:{' '}
          <span class="text-foreground font-medium font-mono">{selected() ?? 'null'}</span>
        </p>
        <p>
          Query Text:{' '}
          <span class="text-foreground font-medium font-mono">
            {query() ? `"${query()}"` : '(idle)'}
          </span>
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={selected() === null && !query()}
        onClick={() => {
          setSelected(null)
          setQuery('')
        }}
      >
        Reset Both
      </Button>
    </div>
  )
}
