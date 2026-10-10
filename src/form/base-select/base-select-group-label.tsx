import type { JSX } from 'solid-js'
import { createEffect, on, onCleanup } from 'solid-js'

import { createStyles } from '../../provider/create-styles'
import { createId } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { useGroupContext } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectPartProps } from './base-select.types'

export function BaseSelectGroupLabel(props: BaseSelectPartProps): JSX.Element {
  const state = useSelectContext()
  const group = useGroupContext()
  const id = createId(() => props.id, 'select-group-label')
  const resolved = createStyles(baseSelectRecipe, props, {
    rootSlot: 'groupLabel',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  createEffect(
    on(id, (value) => {
      group?.setLabelId(value)
      onCleanup(() => group?.setLabelId(undefined))
    }),
  )
  return (
    <div
      data-slot={state.slotName('groupLabel')}
      {...props}
      id={id()}
      {...resolved.styles.groupLabel}
    >
      {props.children}
    </div>
  )
}
