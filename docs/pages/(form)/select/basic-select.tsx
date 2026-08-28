import { Select } from '@src'
import { createSignal } from 'solid-js'

const COUNTRIES = [
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
]

export function BasicSelect() {
  const [selected, setSelected] = createSignal<string | null>('de')

  return (
    <div class="max-w-xs w-full space-y-3">
      <Select
        search
        label="Country / Region"
        placeholder="Select a country..."
        items={COUNTRIES}
        value={selected()}
        onChange={setSelected}
      />
      <p class="text-xs text-muted-foreground">
        Selected country code: <span class="text-foreground font-mono">{selected() ?? 'none'}</span>
      </p>
    </div>
  )
}
