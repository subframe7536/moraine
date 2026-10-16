import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Collapsible } from '../../element/collapsible'
import type { ValidComponent } from '../../shared/types'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Collapsible content container for nested sub-navigation items. */
export function SidebarFrameSubmenuContent<T extends ValidComponent = 'div'>(
  props: SidebarFrameT.SubmenuContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const resolved = useSidebarFrameStyles('submenuContent', local)

  return (
    <Collapsible.Content
      as={local.as}
      data-slot="sidebar-frame-submenu-content"
      {...rest}
      {...resolved.slots.submenuContent}
    />
  )
}
