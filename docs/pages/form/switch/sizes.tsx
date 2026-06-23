import { Switch } from '@src'
import type { SwitchT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES: SwitchSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type SwitchSizeName = Exclude<SwitchT.Variant['size'], undefined>

  return (
    <div class="gap-3 grid sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => (
          <Switch
            size={size}
            label={`Size ${size}`}
            description="Size preview"
            defaultChecked={size === 'lg' || size === 'xl'}
          />
        )}
      </For>
    </div>
  )
}
