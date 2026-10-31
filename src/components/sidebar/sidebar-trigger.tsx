import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'

import { useSidebarContext } from './sidebar-context'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

/** Interactive trigger button for toggling sidebar visibility. */
export function SidebarTrigger<T extends ValidComponent = 'button'>(
  props: SidebarT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'disabled', 'ref'])
  const context = useSidebarContext()
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const disabled = () => Boolean(local.disabled)
  const defaultAriaControls = () =>
    context.isMobile() && !context.isOpen() ? undefined : context.panelId()

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
  // The trigger has no recipe slot, so its state stays a separate bag.
  // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- no recipe slot binding on this host
  const triggerData = sidebarDataAttributes.trigger({
    open: context.isOpen,
    closed: () => !context.isOpen(),
    disabled,
  })

  return (
    <Dynamic
      component={tag()}
      data-slot="sidebar-trigger"
      aria-expanded={context.isOpen()}
      aria-controls={defaultAriaControls()}
      {...triggerData}
      {...binding}
    />
  )
}
