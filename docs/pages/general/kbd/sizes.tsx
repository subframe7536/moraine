import { Kbd } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIZES}>{(size) => <Kbd size={size} value={[size.toUpperCase()]} />}</For>
    </div>
  )
}
