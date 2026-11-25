import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { useInputGroupContext } from './input-group-context'
import { inputGroupDataAttributes, inputGroupRecipe } from './input-group.recipe'
import type { InputGroupT } from './input-group.types'
export function createInputGroupPart(part: 'leading' | 'trailing') {
  return function InputGroupPart<T extends ValidComponent = 'div'>(
    props: InputGroupT.LeadingProps<T> | InputGroupT.TrailingProps<T>,
  ): JSX.Element {
    const local = pick(props, 'as', 'compact', 'class', 'style')
    const rest = omit(props, 'as', 'compact', 'class', 'style')
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
    const Root = dynamic<ValidComponent>(() => local.as ?? 'div')

    return <Root data-slot={`input-group-${part}`} {...partSlot} {...(rest as any)} />
  }
}

/**
 * Addon rendered before the control of an `InputGroup`, such as an icon, prefix text, or button.
 * Place it inside `InputGroup` before the `Input` or `Textarea`; it throws when rendered outside an
 * `InputGroup`. It renders a `div` by default. Set `compact` to reduce its padding next to the
 * control.
 *
 * @example
 * ```tsx
 * import { Icon, Input, InputGroup } from 'moraine'
 *
 * <InputGroup>
 *   <InputGroup.Leading compact>
 *     <Icon name="i-lucide:search" />
 *   </InputGroup.Leading>
 *   <Input aria-label="Search" placeholder="Search..." />
 * </InputGroup>
 * ```
 */
export const InputGroupLeading: <T extends ValidComponent = 'div'>(
  props: InputGroupT.LeadingProps<T>,
) => JSX.Element = /* @__PURE__ */ createInputGroupPart('leading')

/**
 * Addon rendered after the control of an `InputGroup`, such as a unit, status icon, or action
 * button. Place it inside `InputGroup` after the `Input` or `Textarea`; it throws when rendered
 * outside an `InputGroup`. It renders a `div` by default. Set `compact` to reduce its padding, for
 * example for an icon-only `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Input, InputGroup } from 'moraine'
 *
 * <InputGroup>
 *   <Input aria-label="Website" placeholder="example.com" />
 *   <InputGroup.Trailing compact>
 *     <Button size="icon-sm" variant="ghost" leading="i-lucide:x" aria-label="Clear" />
 *   </InputGroup.Trailing>
 * </InputGroup>
 * ```
 */
export const InputGroupTrailing: <T extends ValidComponent = 'div'>(
  props: InputGroupT.TrailingProps<T>,
) => JSX.Element = /* @__PURE__ */ createInputGroupPart('trailing')
