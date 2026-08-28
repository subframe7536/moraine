import { MultiSelect } from '@src'
import { createSignal } from 'solid-js'

const FRAMEWORKS = [
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
        label="Frameworks"
        placeholder="Select frameworks..."
        items={FRAMEWORKS}
        value={selected()}
        onChange={setSelected}
      />
      <p class="text-xs text-muted-foreground">
        Selected: <span class="text-foreground font-mono">{JSON.stringify(selected())}</span>
      </p>
    </div>
  )
}
