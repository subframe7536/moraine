import { Combobox } from '@src'
import { createMemo, createSignal } from 'solid-js'

const ITEMS = ['Alpha', 'Beta', 'Gamma'].map((label) => ({ label, value: label.toLowerCase() }))

export function ControlledQuery() {
  const [query, setQuery] = createSignal('')
  const filtered = createMemo(() =>
    ITEMS.filter((item) => item.label.toLowerCase().includes(query().toLowerCase())),
  )
  return (
    <div class="max-w-xs space-y-2">
      <Combobox
        items={filtered()}
        searchValue={query()}
        onSearch={setQuery}
        filterItem={false}
        placeholder="Externally filtered"
      />
      <p class="text-xs text-muted-foreground">Query: {query() || 'empty'}</p>
    </div>
  )
}
