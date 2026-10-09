import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const MIXED_STATUSES: ComboboxT.Entry[] = [
  'Open',
  { value: 'progress', label: 'In progress', description: 'Someone is actively working this' },
  {
    type: 'group',
    label: 'Closed',
    items: ['Done', { value: 'wontfix', label: "Won't fix", disabled: true }],
  },
]

export function StringItems() {
  return (
    <div class="flex flex-col gap-3 max-w-xs w-full">
      <Combobox
        aria-label="Issue status"
        items={['Open', 'In progress', 'Blocked', 'Done']}
        defaultValue="Open"
        allowClear
      />
      <Combobox
        aria-label="Issue status with groups"
        items={MIXED_STATUSES}
        placeholder="Choose a status..."
        allowClear
      />
    </div>
  )
}
