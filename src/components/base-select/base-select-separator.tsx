import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectSeparator(props: BaseSelectT.SeparatorProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { separator: separatorSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'separator',
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-slot={state.slotName('separator')}
      {...separatorSlot}
      {...rest}
    />
  )
}
