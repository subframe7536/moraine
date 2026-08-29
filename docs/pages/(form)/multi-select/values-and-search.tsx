import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

const FRAMEWORKS: MultiSelectT.Item[] = [
  { label: 'SolidJS', value: 'solid' },
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Angular', value: 'angular' },
]

export function ValuesAndSearch() {
  const [selected, setSelected] = createSignal<string[]>(['solid', 'svelte'])

  return (
    <div class="max-w-md w-full space-y-3">
      <MultiSelect
        search
        placeholder="Select frameworks..."
        options={FRAMEWORKS}
        value={selected()}
        onChange={setSelected}
        allowClear
      />
      <p class="text-xs text-muted-foreground">
        Selected:{' '}
        <span class="text-foreground font-medium font-mono">{JSON.stringify(selected())}</span>
      </p>
    </div>
  )
}
