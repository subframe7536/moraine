import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Collapsible } from '../collapsible'
import type { IconT } from '../icon'

import { useSidebarStyles } from './sidebar-context'
import { SidebarMenuButton } from './sidebar-menu-button'
import type { SidebarT } from './sidebar.types'

const DEFAULT_EXPAND_ICON: IconT.Name = 'icon-chevron-right'

/**
 * Menu button that expands or collapses the enclosing `Sidebar.MenuSub`; place it before the
 * `Sidebar.MenuSubContent`. It takes the same `leading` icon as `Sidebar.MenuButton` and shows an
 * `expandIcon` chevron that rotates while expanded. Renders a `button` by default; pass `as` to render another
 * component.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Menu>
 *       <Sidebar.MenuItem>
 *         <Sidebar.MenuSub>
 *           <Sidebar.MenuSubTrigger leading="i-lucide:route">Routing</Sidebar.MenuSubTrigger>
 *           <Sidebar.MenuSubContent />
 *         </Sidebar.MenuSub>
 *       </Sidebar.MenuItem>
 *     </Sidebar.Menu>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export function SidebarMenuSubTrigger<T extends ValidComponent = 'button'>(
  props: SidebarT.MenuSubTriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as SidebarT.MenuSubTriggerProps, [
    'as',
    'class',
    'style',
    'expandIcon',
  ])
  const {
    slots: { menuSubTrigger: menuSubTriggerSlot },
  } = useSidebarStyles('menuSubTrigger', local)
  const TriggerRoot = (rootProps: object) => (
    <Collapsible.Trigger as={local.as as ValidComponent | undefined} {...rootProps} />
  )

  return (
    <SidebarMenuButton
      as={TriggerRoot}
      data-slot="sidebar-menu-sub-trigger"
      trailing={local.expandIcon ?? DEFAULT_EXPAND_ICON}
      {...menuSubTriggerSlot}
      {...(rest as object)}
    />
  )
}
