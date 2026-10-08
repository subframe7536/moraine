import type { JSX } from 'solid-js'

import { renderInputGroupPart } from './input-group-part'
import type { InputGroupT } from './input-group.types'

export function InputGroupTrailing(props: InputGroupT.TrailingProps): JSX.Element {
  return renderInputGroupPart('trailing', props)
}
