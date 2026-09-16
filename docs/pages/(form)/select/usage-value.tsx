import { Button, Select } from '@src'
import type { SelectT } from '@src'
import { createSignal } from 'solid-js'

const COUNTRIES: SelectT.Item[] = [
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
]

export function UsageValue() {
  const [selected, setSelected] = createSignal<string | null>('de')

  return (
    <div class="max-w-xs w-full space-y-3">
      <Select
        placeholder="Select a country..."
        leadingIcon="i-lucide:globe"
        items={COUNTRIES}
        value={selected()}
        onChange={setSelected}
        allowClear
      />
      <div class="text-xs flex items-center justify-between">
        <span class="text-muted-foreground">
          Selected code:{' '}
          <span class="text-foreground font-medium font-mono">{selected() ?? 'null'}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={selected() === null}
          onClick={() => setSelected(null)}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
