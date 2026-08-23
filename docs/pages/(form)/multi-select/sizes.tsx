import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { For } from 'solid-js'

const FRUIT_OPTIONS: MultiSelectT.Item[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
]

const SIZES = ['sm', 'md', 'lg'] as const

export function Sizes() {
  return (
    <div class="gap-3 grid w-full sm:grid-cols-3">
      <For each={SIZES}>
        {(size) => (
          <MultiSelect
            options={FRUIT_OPTIONS}
            size={size}
            defaultValue={['apple', 'banana']}
            placeholder={`Size: ${size}`}
          />
        )}
      </For>
    </div>
  )
}
