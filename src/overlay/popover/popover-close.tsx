import type { Accessor, JSX } from 'solid-js'
import { children as resolveChildren, onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../provider/cn-context'
import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { usePopoverContext } from './popover-context'
import type { PopoverT } from './popover.types'

/** Closes the current Popover and enables its modal accessibility behavior when composed in Content. */
export function PopoverClose<T extends ValidComponent = 'button'>(
  props: PopoverT.CloseProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'disabled',
    'children',
    'class',
    'style',
    'ref' as any,
  ])
  const cn = useCn()
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
  const children = resolveChildren(() => local.children)
  const unregisterClose = behavior.registerClose()
  onCleanup(unregisterClose)

  return (
    <Dynamic
      data-slot="popover-close"
      {...binding}
      component={tag()}
      class={cn(local.class)}
      style={local.style}
    >
      {children()}
    </Dynamic>
  )
}
