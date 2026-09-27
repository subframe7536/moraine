import { Select } from '@src'
import type { SelectT } from '@src'

const MIXED_ITEMS: SelectT.Entry[] = [
  'Apple',
  { value: 'pear', label: 'Pear', description: 'Fresh fruit' },
  {
    type: 'group',
    label: 'More fruit',
    items: ['Banana', { value: 'cherry', label: 'Cherry', disabled: true }],
  },
]

export function StringItems() {
  return (
    <div class="flex flex-col gap-3 max-w-xs w-full">
      <Select
        aria-label="String fruit"
        items={['Apple', 'Banana']}
        defaultValue="Apple"
        allowClear
      />
      <Select
        aria-label="Mixed fruit"
        items={MIXED_ITEMS}
        placeholder="Choose a fruit..."
        allowClear
      />
    </div>
  )
}
