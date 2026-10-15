import type { JSX } from 'solid-js'
import { createSignal } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { GroupProvider } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectGroup(props: BaseSelectT.GroupProps): JSX.Element {
  const state = useSelectContext()
  const [labelId, setLabelId] = createSignal<string>()
  const { slots } = useRecipe(baseSelectRecipe, props, {
    slot: 'group',
    contextSlots: () => state.slotOverrides,
    contextVariants: () => ({ size: state.styleSize }),
  })
  return (
    <GroupProvider value={{ labelId, setLabelId }}>
      <div
        role="group"
        data-slot={state.slotName('group')}
        {...props}
        aria-labelledby={labelId() ?? props['aria-labelledby']}
        {...slots.group}
      >
        {props.children}
      </div>
    </GroupProvider>
  )
}
