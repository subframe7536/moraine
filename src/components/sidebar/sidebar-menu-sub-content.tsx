import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Collapsible } from '../collapsible'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/** Collapsible list of nested sub-navigation items. */
export function SidebarMenuSubContent<T extends ValidComponent = 'ul'>(
  props: SidebarT.MenuSubContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const { slots } = useSidebarStyles('menuSubContent', local)

  return (
    <Collapsible.Content
      as={(local.as ?? 'ul') as ValidComponent}
      data-slot="sidebar-menu-sub-content"
      {...(rest as object)}
      {...slots.menuSubContent}
    />
  )
}
