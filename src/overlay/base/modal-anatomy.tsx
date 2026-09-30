import type { JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { SlotBinding } from '../../provider/create-styles'
import type { ValidComponent } from '../../shared/types'

export function ModalAnatomyPart(options: {
  as?: ValidComponent
  defaultAs: ValidComponent
  slot: string
  attributes: object
  additionalAttributes?: object
  binding: SlotBinding
  children?: JSX.Element
  id?: string
}): JSX.Element {
  return (
    <Dynamic
      component={options.as ?? options.defaultAs}
      data-slot={options.slot}
      {...options.attributes}
      {...options.additionalAttributes}
      id={options.id}
      {...options.binding}
    >
      {options.children}
    </Dynamic>
  )
}
