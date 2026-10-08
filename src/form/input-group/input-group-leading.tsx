import type { JSX } from 'solid-js'

import { renderInputGroupPart } from './input-group-part'
import type { InputGroupT } from './input-group.types'

export function InputGroupLeading(props: InputGroupT.LeadingProps): JSX.Element {
  return renderInputGroupPart('leading', props)
}
