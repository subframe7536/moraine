import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider/create-styles'
import { callRef } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectControl(props: BaseSelectT.ControlProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'ref'])
  const resolved = createStyles(baseSelectRecipe, local, {
    rootSlot: 'control',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  return (
    <div
      data-slot={state.slotName('control')}
      {...baseSelectDataAttributes.control({
        disabled: state.field.disabled,
        readonly: state.field.readOnly,
        required: state.field.required,
        invalid: state.field.invalid,
        expanded: state.open,
        closed: () => !state.open(),
      })}
      {...rest}
      ref={(element) => {
        state.setAnchor(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (state.anchor() === element) {
            state.setAnchor(undefined)
          }
        })
      }}
      {...resolved.styles.control}
    >
      {local.children}
    </div>
  )
}
