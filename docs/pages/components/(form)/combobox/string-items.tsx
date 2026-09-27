import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const MIXED_ITEMS: ComboboxT.Entry[] = [
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
      <Combobox
        aria-label="String fruit"
        items={['Apple', 'Banana']}
        defaultValue="Apple"
        allowClear
      />
      <Combobox
        aria-label="Mixed fruit"
        items={MIXED_ITEMS}
        placeholder="Choose a fruit..."
        allowClear
      />
    </div>
  )
}
