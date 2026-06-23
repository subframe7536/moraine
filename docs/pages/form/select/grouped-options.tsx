import { Select } from '@src'
import type { SelectT } from '@src'

export function GroupedOptions() {
  const GROUPED_OPTIONS: SelectT.Item[] = [
    {
      label: 'Fruits',
      children: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
      ],
    },
    {
      label: 'Vegetables',
      children: [
        { label: 'Carrot', value: 'carrot' },
        { label: 'Broccoli', value: 'broccoli' },
        { label: 'Spinach', value: 'spinach' },
      ],
    },
  ]

  return (
    <div class="w-80">
      <Select options={GROUPED_OPTIONS} placeholder="Pick an item..." />
    </div>
  )
}
