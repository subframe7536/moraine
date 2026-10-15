import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useInputGroupContext } from './input-group-context'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupT } from './input-group.types'

export function createInputGroupPart(part: 'leading' | 'trailing') {
  return function InputGroupPart(
    props: InputGroupT.LeadingProps | InputGroupT.TrailingProps,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['compact', 'class', 'style'])
    const group = useInputGroupContext()
    if (!group) {
      const name = part === 'leading' ? 'Leading' : 'Trailing'
      throw new Error(`InputGroup.${name} must be used within InputGroup`)
    }
    const { slots, variants } = useRecipe(inputGroupRecipe, local, {
      slot: part,
      contextVariants: () => ({
        size: group.size,
        orientation: group.orientation,
        variant: group.variant,
      }),
      contextSlots: () => group.slotOverrides,
    })
    return (
      <div
        data-slot={`input-group-${part}`}
        {...inputGroupDataAttributes[part]({
          orientation: () => group.orientation,
          compact: () => variants.compact,
        })}
        {...rest}
        {...slots[part]}
      />
    )
  }
}

export const InputGroupLeading: (props: InputGroupT.LeadingProps) => JSX.Element =
  /* @__PURE__ */ createInputGroupPart('leading')

export const InputGroupTrailing: (props: InputGroupT.TrailingProps) => JSX.Element =
  /* @__PURE__ */ createInputGroupPart('trailing')
