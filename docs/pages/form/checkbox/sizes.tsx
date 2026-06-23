import { Checkbox } from '@src'
import type { CheckboxT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES: CheckboxSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type CheckboxSizeName = Exclude<CheckboxT.Variant['size'], undefined>

  return (
    <div class="flex flex-col gap-2 max-w-xl">
      <For each={SIZES}>
        {(size) => (
          <Checkbox
            size={size}
            label={`Size ${size}`}
            description={`Checkbox size: ${size}`}
            defaultChecked={size === 'md' || size === 'xl'}
          />
        )}
      </For>
    </div>
  )
}
