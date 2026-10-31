import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { callRef } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectControl(props: BaseSelectT.ControlProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['class', 'style', 'ref'])
  const {
    slots: { control: controlSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'control',
    data: {
      control: baseSelectDataAttributes.control({
        disabled: state.field.disabled,
        readonly: state.field.readOnly,
        required: state.field.required,
        invalid: state.field.invalid,
        expanded: state.open,
        closed: () => !state.open(),
      }),
    },
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  return (
    <div
      data-slot={state.slotName('control')}
      {...controlSlot}
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
    />
  )
}
