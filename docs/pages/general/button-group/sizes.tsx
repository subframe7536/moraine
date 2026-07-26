import { Button, ButtonGroup } from '@src'
import type { ButtonGroupT } from '@src'
import { For } from 'solid-js'

type ButtonGroupSize = Exclude<ButtonGroupT.Variant['size'], undefined | `icon-${string}`>

export function Sizes() {
  const SIZES: ButtonGroupSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="flex flex-wrap gap-3 items-end">
      <For each={SIZES}>
        {(size) => (
          <ButtonGroup size={size} variant="outline" aria-label={`${size} pagination`}>
            <Button>1</Button>
            <Button>2</Button>
            <Button>3</Button>
          </ButtonGroup>
        )}
      </For>
    </div>
  )
}
