import { Button, MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

const FRAMEWORKS: MultiSelectT.Item[] = [
  { label: 'SolidJS', value: 'solid', icon: 'i-lucide:atom' },
  { label: 'Vue.js', value: 'vue', icon: 'i-lucide:sparkles' },
  { label: 'React', value: 'react', icon: 'i-lucide:box' },
  { label: 'Svelte', value: 'svelte', icon: 'i-lucide:flame' },
  { label: 'Astro', value: 'astro', icon: 'i-lucide:rocket' },
]

export function UsageTags() {
  const [selected, setSelected] = createSignal<string[]>(['solid', 'svelte'])

  return (
    <div class="max-w-md w-full space-y-3">
      <MultiSelect
        search
        placeholder="Select frameworks..."
        items={FRAMEWORKS}
        value={selected()}
        onChange={setSelected}
        allowClear
      />
      <div class="text-xs flex items-center justify-between">
        <span class="text-muted-foreground">
          Committed Values:{' '}
          <span class="text-foreground font-medium font-mono">{JSON.stringify(selected())}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={selected().length === 0}
          onClick={() => setSelected([])}
        >
          Clear All
        </Button>
      </div>
    </div>
  )
}
