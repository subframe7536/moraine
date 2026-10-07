import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider/index'

import { useInputGroupContext } from './input-group-context'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupT } from './input-group.types'

function renderInputGroupPart(
  part: 'leading' | 'trailing',
  props: InputGroupT.LeadingProps | InputGroupT.TrailingProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'compact', 'class', 'style'])
  const group = useInputGroupContext()
  if (!group) {
    const name = part === 'leading' ? 'Leading' : 'Trailing'
    throw new Error(`InputGroup.${name} must be used within InputGroup`)
  }
  const resolved = createStyles(inputGroupRecipe, local, {
    rootSlot: part,
    inheritedVariants: () => ({
      size: group.size,
      orientation: group.orientation,
      variant: group.variant,
    }),
    inheritedStyles: () => group.presentation,
  })
  return (
    <div
      {...rest}
      data-slot={`input-group-${part}`}
      {...inputGroupDataAttributes[part]({
        orientation: () => group.orientation,
        compact: () => resolved.variants.compact,
      })}
      {...resolved.styles[part]}
    >
      {local.children}
    </div>
  )
}

export function InputGroupLeading(props: InputGroupT.LeadingProps): JSX.Element {
  return renderInputGroupPart('leading', props)
}

export function InputGroupTrailing(props: InputGroupT.TrailingProps): JSX.Element {
  return renderInputGroupPart('trailing', props)
}
