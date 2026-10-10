import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import { createStyles } from '../../provider/create-styles'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectPartProps } from './base-select.types'

export function BaseSelectEmpty(props: BaseSelectPartProps): JSX.Element {
  const state = useSelectContext()
  const resolved = createStyles(baseSelectRecipe, props, {
    rootSlot: 'empty',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  return (
    <Show when={state.items().length === 0}>
      <div data-slot={state.slotName('empty')} {...props} {...resolved.styles.empty}>
        {props.children}
      </div>
    </Show>
  )
}
