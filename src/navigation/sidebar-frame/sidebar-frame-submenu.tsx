import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Collapsible } from '../../element/collapsible'
import { useCollapsibleContext } from '../../element/collapsible/collapsible-context'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Access disclosure state and actions from the nearest SidebarFrame.Submenu. */
export function useSidebarFrameSubmenu() {
  const collapsible = useCollapsibleContext()
  return {
    open: collapsible.disclosure.open,
    toggle: collapsible.toggle,
    disabled: collapsible.disclosure.disabled,
  }
}

/** Container for expandable sub-navigation in a sidebar menu. */
export function SidebarFrameSubmenu(props: SidebarFrameT.SubmenuProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = useSidebarFrameStyles('submenu', local)

  return (
    <Collapsible data-slot="sidebar-frame-submenu" {...rest} {...resolved.styles.submenu}>
      {local.children}
    </Collapsible>
  )
}
