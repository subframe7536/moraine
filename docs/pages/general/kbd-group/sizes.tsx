import { KbdGroup } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="flex flex-col gap-3 items-start">
      <For each={SIZES}>
        {(size) => <KbdGroup size={size} items={['Ctrl', size.toUpperCase()]} />}
      </For>
    </div>
  )
}
