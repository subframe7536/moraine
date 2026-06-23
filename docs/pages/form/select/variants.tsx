import { Select } from '@src'
import type { SelectT } from '@src'
import { For } from 'solid-js'

export function Variants() {
  const FRUIT_OPTIONS: SelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  const VARIANTS = ['outline', 'subtle', 'ghost', 'none'] as const

  return (
    <div class="gap-3 grid w-80 sm:grid-cols-2">
      <For each={VARIANTS}>
        {(variant) => <Select options={FRUIT_OPTIONS} variant={variant} placeholder={variant} />}
      </For>
    </div>
  )
}
