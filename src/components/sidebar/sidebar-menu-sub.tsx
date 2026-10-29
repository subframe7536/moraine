import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Collapsible } from '../collapsible'
import { useCollapsibleContext } from '../collapsible/collapsible-context'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/** Access disclosure state and actions from the nearest Sidebar.MenuSub. */
export function useSidebarMenuSub() {
  const collapsible = useCollapsibleContext()
  return {
    open: () => collapsible?.disclosure.open() ?? false,
    toggle: () => collapsible?.toggle(),
    disabled: () => collapsible?.disclosure.disabled() ?? false,
  }
}

/** Container for expandable sub-navigation in a sidebar menu. */
export function SidebarMenuSub(props: SidebarT.MenuSubProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style'])
  const resolved = useSidebarStyles('menuSub', local)

  return <Collapsible data-slot="sidebar-menu-sub" {...rest} {...resolved.slots.menuSub} />
}
