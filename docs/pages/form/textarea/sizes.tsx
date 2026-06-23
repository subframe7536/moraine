import { Textarea } from '@src'
import type { TextareaT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES: TextareaSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type TextareaSizeName = Exclude<TextareaT.Variant['size'], undefined>

  return (
    <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => <Textarea size={size} placeholder={`Size: ${size}`} rows={2} />}
      </For>
    </div>
  )
}
