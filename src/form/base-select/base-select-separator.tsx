import type { JSX } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectPartProps } from './base-select.types'

export function BaseSelectSeparator(props: BaseSelectPartProps): JSX.Element {
  const state = useSelectContext()
  const { slots } = useRecipe(baseSelectRecipe, props, {
    slot: 'separator',
    contextSlots: () => state.slotOverrides,
    contextVariants: () => ({ size: state.styleSize }),
  })
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-slot={state.slotName('separator')}
      {...props}
      {...slots.separator}
    />
  )
}
