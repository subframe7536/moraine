import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { ValidComponent } from '../../shared/types'
import { Collapsible } from '../collapsible'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/**
 * Collapsible list of nested `Sidebar.MenuItem` entries, shown or hidden by the `Sidebar.MenuSub`
 * that contains it. Renders a `ul` by default; pass `as` to render another element.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Menu>
 *       <Sidebar.MenuItem>
 *         <Sidebar.MenuSub defaultOpen>
 *           <Sidebar.MenuSubTrigger>Routing</Sidebar.MenuSubTrigger>
 *           <Sidebar.MenuSubContent>
 *             <Sidebar.MenuItem>
 *               <Sidebar.MenuButton href="/layouts">Layouts</Sidebar.MenuButton>
 *             </Sidebar.MenuItem>
 *           </Sidebar.MenuSubContent>
 *         </Sidebar.MenuSub>
 *       </Sidebar.MenuItem>
 *     </Sidebar.Menu>
 *   </Sidebar.Panel>
 * </Sidebar>
 * ```
 */
export function SidebarMenuSubContent<T extends ValidComponent = 'ul'>(
  props: SidebarT.MenuSubContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const {
    slots: { menuSubContent: menuSubContentSlot },
  } = useSidebarStyles('menuSubContent', local)

  return (
    <Collapsible.Content
      as={(local.as ?? 'ul') as ValidComponent}
      data-slot="sidebar-menu-sub-content"
      {...menuSubContentSlot}
      {...(rest as object)}
    />
  )
}
