import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectEmpty(props: BaseSelectT.EmptyProps): JSX.Element {
  const state = useSelectContext()
  const { slots } = useRecipe(baseSelectRecipe, props, {
    slot: 'empty',
    contextSlots: () => state.slotOverrides,
    contextVariants: () => ({ size: state.styleSize }),
  })
  return (
    <Show when={state.items().length === 0}>
      <div data-slot={state.slotName('empty')} {...props} {...slots.empty}>
        {props.children}
      </div>
    </Show>
  )
}
