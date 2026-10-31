import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectEmpty(props: BaseSelectT.EmptyProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { empty: emptySlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'empty',
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  return (
    <Show when={state.items().length === 0}>
      <div data-slot={state.slotName('empty')} {...emptySlot} {...rest}>
        {props.children}
      </div>
    </Show>
  )
}
