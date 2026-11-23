import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import { omit } from 'solid-js'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { pick } from '../../shared/utils'

import { usePopoverContext } from './popover-context'
import type { PopoverT } from './popover.types'
/**
 * Element that closes the surrounding `Popover` when pressed. Compose it inside
 * `Popover.Content`. Renders a `button`; pass `as` to render another component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Popover } from 'moraine'
 *
 * <Popover>
 *   <Popover.Trigger as={Button}>Details</Popover.Trigger>
 *   <Popover.Content>
 *     More information
 *     <Popover.Close as={Button}>Close</Popover.Close>
 *   </Popover.Content>
 * </Popover>
 * ```
 */
export function PopoverClose<T extends ValidComponent = 'button'>(
  props: PopoverT.CloseProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'disabled', 'ref' as any)
  const rest = omit(props, 'as', 'disabled', 'ref' as any)
  const behavior = usePopoverContext()
  const tag: Accessor<ValidComponent> = () => local.as ?? 'button'
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const interaction = useButtonInteraction(
    {
      disabled: () => Boolean(local.disabled),
      disabledForComponent: true,
      element: root.element,
      onPress: () => behavior.popper.setOpen(false),
      tag,
    },
    rest,
  )
  const binding = root.bind(interaction)

  return <Dynamic component={tag()} data-slot="popover-close" {...binding} />
}
