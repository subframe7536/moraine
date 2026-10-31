import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useInputGroupContext } from './input-group-context'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupT } from './input-group.types'

export function createInputGroupPart(part: 'leading' | 'trailing') {
  return function InputGroupPart<T extends ValidComponent = 'div'>(
    props: InputGroupT.LeadingProps<T> | InputGroupT.TrailingProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(props, ['as', 'compact', 'class', 'style'])
    const group = useInputGroupContext()
    if (!group.grouped) {
      const name = part === 'leading' ? 'Leading' : 'Trailing'
      throw new Error(`InputGroup.${name} must be used within InputGroup`)
    }
    const {
      slots: { [part]: partSlot },
      variants,
    } = useRecipe(inputGroupRecipe, local, {
      slot: part,
      data: {
        [part]: inputGroupDataAttributes[part](() => ({
          orientation: () => group.orientation,
          compact: (): boolean | undefined => variants.compact,
        })),
      },
      context: () => ({
        variants: {
          size: group.size,
          orientation: group.orientation,
          variant: group.variant,
        },
        ...group.slotOverrides,
      }),
    })
    return (
      <Dynamic
        component={local.as ?? 'div'}
        data-slot={`input-group-${part}`}
        {...partSlot}
        {...rest}
      />
    )
  }
}

export const InputGroupLeading: <T extends ValidComponent = 'div'>(
  props: InputGroupT.LeadingProps<T>,
) => JSX.Element = /* @__PURE__ */ createInputGroupPart('leading')

export const InputGroupTrailing: <T extends ValidComponent = 'div'>(
  props: InputGroupT.TrailingProps<T>,
) => JSX.Element = /* @__PURE__ */ createInputGroupPart('trailing')
