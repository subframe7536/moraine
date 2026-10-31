import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Collapsible } from '../collapsible'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/** Expandable sub-navigation placed inside a `MenuItem`. */
export function SidebarMenuSub(props: SidebarT.MenuSubProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style'])
  const { slots } = useSidebarStyles('menuSub', local)

  return <Collapsible data-slot="sidebar-menu-sub" {...rest} {...slots.menuSub} />
}
