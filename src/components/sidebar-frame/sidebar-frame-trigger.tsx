import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useSidebarFrameContext } from './sidebar-frame-context'
import { sidebarFrameDataAttributes } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Interactive trigger button for toggling sidebar visibility. */
export function SidebarFrameTrigger<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'disabled', 'ref'])
  const context = useSidebarFrameContext()
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const disabled = () => Boolean(local.disabled)
  const defaultAriaControls = () =>
    context.isMobile() && !context.isOpen() ? undefined : context.sidebarId()

  const interactionProps = useButtonInteraction(
    {
      disabled,
      element: root.element,
      disabledForComponent: true,
      onPress: context.toggle,
      tag,
    },
    rest,
  )
  const binding = root.bind(interactionProps)

  return (
    <Dynamic
      component={tag()}
      data-slot="sidebar-frame-trigger"
      aria-expanded={context.isOpen()}
      aria-controls={defaultAriaControls()}
      {...sidebarFrameDataAttributes.trigger({
        open: context.isOpen,
        closed: () => !context.isOpen(),
        disabled,
      })}
      {...binding}
    />
  )
}
