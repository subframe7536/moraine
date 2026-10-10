import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Collapsible } from '../../element/collapsible'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Collapsible content container for nested sub-navigation items. */
export function SidebarFrameSubmenuContent(props: SidebarFrameT.SubmenuContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = useSidebarFrameStyles('submenuContent', local)

  return (
    <Collapsible.Content
      as="div"
      data-slot="sidebar-frame-submenu-content"
      {...rest}
      {...resolved.styles.submenuContent}
    >
      {local.children}
    </Collapsible.Content>
  )
}
