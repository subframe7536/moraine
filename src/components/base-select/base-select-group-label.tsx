import type { JSX } from 'solid-js'
import { createEffect, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createId } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { useGroupContext } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectGroupLabel(props: BaseSelectT.GroupLabelProps): JSX.Element {
  const state = useSelectContext()
  const group = useGroupContext()
  const id = createId(() => props.id, 'select-group-label')
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { groupLabel: groupLabelSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'groupLabel',
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  createEffect(
    on(id, (value) => {
      group?.setLabelId(value)
      onCleanup(() => group?.setLabelId(undefined))
    }),
  )
  return (
    <div data-slot={state.slotName('groupLabel')} {...groupLabelSlot} {...rest} id={id()}>
      {props.children}
    </div>
  )
}
