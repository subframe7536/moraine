import { Input } from '@src'
import { For } from 'solid-js'

export function InputSizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={SIZES}>{(size) => <Input size={size} placeholder={`Size: ${size}`} />}</For>
    </div>
  )
}
