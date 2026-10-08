import type { JSX } from 'solid-js'

import { createStyles } from '../../provider/create-styles'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectPartProps } from './base-select.types'

export function BaseSelectSeparator(props: BaseSelectPartProps): JSX.Element {
  const state = useSelectContext()
  const resolved = createStyles(baseSelectRecipe, props, {
    rootSlot: 'separator',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  return (
    <div
      {...props}
      role="presentation"
      aria-hidden="true"
      data-slot={state.slotName('separator')}
      {...resolved.styles.separator}
    />
  )
}
