import type { JSX } from 'solid-js'
import { createSignal } from 'solid-js'

import { createStyles } from '../../provider/create-styles'

import { useSelectContext } from './base-select-context'
import { GroupProvider } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectPartProps } from './base-select.types'

export function BaseSelectGroup(props: BaseSelectPartProps): JSX.Element {
  const state = useSelectContext()
  const [labelId, setLabelId] = createSignal<string>()
  const resolved = createStyles(baseSelectRecipe, props, {
    rootSlot: 'group',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  return (
    <GroupProvider value={{ labelId, setLabelId }}>
      <div
        {...props}
        role="group"
        aria-labelledby={labelId() ?? props['aria-labelledby']}
        data-slot={state.slotName('group')}
        {...resolved.styles.group}
      >
        {props.children}
      </div>
    </GroupProvider>
  )
}
