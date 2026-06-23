import { Select } from '@src'
import type { SelectT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const FRUIT_OPTIONS: SelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="gap-3 grid w-[42rem] md:grid-cols-5 sm:grid-cols-3">
      <For each={SIZES}>
        {(size) => <Select options={FRUIT_OPTIONS} size={size} placeholder={`Size: ${size}`} />}
      </For>
    </div>
  )
}
