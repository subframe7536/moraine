import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { GroupProvider } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectGroup(props: BaseSelectT.GroupProps): JSX.Element {
  const state = useSelectContext()
  const [labelId, setLabelId] = createSignal<string>()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { group: groupSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'group',
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  return (
    <GroupProvider value={{ labelId, setLabelId }}>
      <div
        role="group"
        data-slot={state.slotName('group')}
        {...groupSlot}
        {...rest}
        aria-labelledby={labelId() ?? props['aria-labelledby']}
      >
        {props.children}
      </div>
    </GroupProvider>
  )
}
