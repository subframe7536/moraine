import { Button, Combobox } from '@src'
import type { ComboboxT } from '@src'
import { createSignal } from 'solid-js'

const CITIES: ComboboxT.Item[] = [
  { label: 'San Francisco', value: 'sf' },
  { label: 'San Jose', value: 'sj' },
  { label: 'Santa Clara', value: 'sc' },
  { label: 'Los Angeles', value: 'la' },
  { label: 'New York', value: 'ny' },
  { label: 'Boston', value: 'bos' },
]

export function FilterStrategies() {
  const [strategy, setStrategy] = createSignal<'contains' | 'startsWith'>('contains')

  return (
    <div class="max-w-xs w-full space-y-3">
      <div class="flex gap-2 items-center">
        <span class="text-muted-foreground font-medium text-xs">Filter mode:</span>
        <Button
          size="sm"
          variant={strategy() === 'contains' ? 'default' : 'secondary'}
          onClick={() => setStrategy('contains')}
        >
          contains
        </Button>
        <Button
          size="sm"
          variant={strategy() === 'startsWith' ? 'default' : 'secondary'}
          onClick={() => setStrategy('startsWith')}
        >
          startsWith
        </Button>
      </div>

      <Combobox
        items={CITIES}
        filterItem={strategy()}
        placeholder={`Search cities (${strategy()})...`}
        leadingIcon="i-lucide:search"
        openOnControlClick
      />
    </div>
  )
}
