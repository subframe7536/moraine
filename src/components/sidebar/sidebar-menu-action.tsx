import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

/** Controls placed over the end of the enclosing `MenuItem`. */
export function SidebarMenuAction<T extends ValidComponent = 'div'>(
  props: SidebarT.MenuActionProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props as SidebarT.MenuActionProps, ['as', 'class', 'style'])
  const { slotWith } = useSidebarStyles('menuAction', local)
  const menuActionSlot = slotWith('menuAction', {
    data: sidebarDataAttributes.menuAction({ mobile: context.isMobile }),
  })
  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sidebar-menu-action"
      {...menuActionSlot}
      {...rest}
    />
  )
}
