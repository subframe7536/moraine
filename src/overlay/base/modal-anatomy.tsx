import type { Accessor, JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { SlotBinding } from '../../provider/create-styles'
import type { ValidComponent } from '../../shared/types'

export function renderModalAnatomyPart(options: {
  as: Accessor<ValidComponent | undefined>
  defaultAs: ValidComponent
  slot: string
  attributes: object
  additionalAttributes?: object
  binding: SlotBinding
  children: Accessor<JSX.Element>
  id?: Accessor<string | undefined>
}): JSX.Element {
  return (
    <Dynamic
      component={options.as() ?? options.defaultAs}
      data-slot={options.slot}
      {...options.attributes}
      {...options.additionalAttributes}
      id={options.id?.()}
      {...options.binding}
    >
      {options.children()}
    </Dynamic>
  )
}
