import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Collapsible } from '../collapsible'
import type { IconT } from '../icon'

import { useSidebarStyles } from './sidebar-context'
import { SidebarMenuButton } from './sidebar-menu-button'
import type { SidebarT } from './sidebar.types'

const DEFAULT_SUBMENU_TRAILING: IconT.Name = 'i-lucide:chevron-right'

/** Menu button that expands or collapses the enclosing `MenuSub`. */
export function SidebarMenuSubTrigger<T extends ValidComponent = 'button'>(
  props: SidebarT.MenuSubTriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as SidebarT.MenuSubTriggerProps, [
    'as',
    'class',
    'style',
    'trailing',
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
      trailing={local.trailing ?? DEFAULT_SUBMENU_TRAILING}
      {...menuSubTriggerSlot}
      {...(rest as object)}
    />
  )
}
