import type { Accessor, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

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
  const [local, rest] = splitProps(props, ['as', 'disabled', 'ref' as any])
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
