import { Button, ButtonGroup } from '@src'
import type { ButtonGroupT } from '@src'
import { For } from 'solid-js'

type ButtonGroupVariant = Exclude<ButtonGroupT.Variant['variant'], undefined>

export function Variants() {
  const VARIANTS: ButtonGroupVariant[] = ['default', 'secondary', 'outline', 'ghost', 'destructive']

  return (
    <div class="flex flex-wrap gap-3">
      <For each={VARIANTS}>
        {(variant) => (
          <ButtonGroup variant={variant} aria-label={`${variant} actions`}>
            <Button>Previous</Button>
            <Button>Next</Button>
          </ButtonGroup>
        )}
      </For>
    </div>
  )
}
