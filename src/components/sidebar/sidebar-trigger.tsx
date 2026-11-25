import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { omit } from 'solid-js'

import { createPolymorphicRoot } from '../../shared/create-polymorphic-root'
import type { ValidComponent } from '../../shared/types'
import { useButtonInteraction } from '../../shared/use-button-interaction'
import { pick } from '../../shared/utils'

import { useSidebarContext } from './sidebar-context'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'
/**
 * Button that toggles the surrounding `Sidebar` between expanded and collapsed, or opens and closes
 * the mobile drawer. It can be placed anywhere inside `Sidebar`, and reports through the root
 * `onOpenChange`. Renders a `button`; pass `as` to render another component such as `Button`.
 *
 * @example
 * ```tsx
 * import { Button, Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Content>Navigation</Sidebar.Content>
 *   </Sidebar.Panel>
 *   <Sidebar.Inset>
 *     <Sidebar.Trigger as={Button} variant="ghost" aria-label="Toggle sidebar">
 *       Menu
 *     </Sidebar.Trigger>
 *   </Sidebar.Inset>
 * </Sidebar>
 * ```
 */
export function SidebarTrigger<T extends ValidComponent = 'button'>(
  props: SidebarT.TriggerProps<T>,
): JSX.Element {
  const local = pick(props, 'as', 'disabled', 'ref')
  const rest = omit(props, 'as', 'disabled', 'ref')
  const context = useSidebarContext()
  const tag = () => local.as ?? 'button'
  const root = createPolymorphicRoot({ tag, ref: () => local.ref })
  const disabled = () => Boolean(local.disabled)
  const defaultAriaControls = () =>
    context.mobile() && !context.open() ? undefined : context.panelId()

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
    open: context.open,
    closed: () => !context.open(),
    disabled,
  })

  const Root = dynamic<ValidComponent>(tag)

  return (
    <Root
      data-slot="sidebar-trigger"
      aria-expanded={context.open() ? 'true' : 'false'}
      aria-controls={defaultAriaControls()}
      {...triggerData}
      {...binding}
    />
  )
}
