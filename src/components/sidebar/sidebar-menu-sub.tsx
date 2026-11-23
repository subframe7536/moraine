import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { pick } from '../../shared/utils'
import { Collapsible } from '../collapsible'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'
/**
 * Collapsible sub-navigation placed inside a `Sidebar.MenuItem`, holding a `Sidebar.MenuSubTrigger`
 * followed by a `Sidebar.MenuSubContent`. Expanded state is uncontrolled with `defaultOpen`, or
 * controlled with `open` and `onOpenChange`.
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
 *           <Sidebar.MenuSubTrigger leading="i-lucide:route">Routing</Sidebar.MenuSubTrigger>
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
export function SidebarMenuSub(props: SidebarT.MenuSubProps): JSX.Element {
  const local = pick(props, 'class', 'style', 'id')
  const rest = omit(props, 'class', 'style', 'id')
  const {
    slots: { menuSub: menuSubSlot },
  } = useSidebarStyles('menuSub', local)

  return (
    <Collapsible
      data-slot="sidebar-menu-sub"
      id={local.id as string | undefined}
      {...menuSubSlot}
      {...rest}
    />
  )
}
