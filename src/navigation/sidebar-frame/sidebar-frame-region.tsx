import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'

import { useSidebarFrameContext, useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

type RegionSlot = 'sidebarHeader' | 'sidebarBody' | 'sidebarFooter' | 'group' | 'menu'

function createRegion(slot: RegionSlot, dataSlot: string) {
  return function SidebarFrameRegion(props: SidebarFrameT.RegionProps): JSX.Element {
    const [local, rest] = splitProps(props, ['children', 'class', 'style'])
    const resolved = useSidebarFrameStyles(slot, local)

    return (
      <div data-slot={dataSlot} {...rest} {...resolved.styles[slot]}>
        {local.children}
      </div>
    )
  }
}

export const SidebarFrameSidebarHeader = createRegion(
  'sidebarHeader',
  'sidebar-frame-sidebar-header',
)
export const SidebarFrameSidebarBody = createRegion('sidebarBody', 'sidebar-frame-sidebar-body')
export const SidebarFrameSidebarFooter = createRegion(
  'sidebarFooter',
  'sidebar-frame-sidebar-footer',
)
export const SidebarFrameGroup = createRegion('group', 'sidebar-frame-group')
export const SidebarFrameMenu = createRegion('menu', 'sidebar-frame-menu')

/** Heading label for a sidebar group. */
export function SidebarFrameGroupLabel<T extends ValidComponent = 'div'>(
  props: SidebarFrameT.GroupLabelProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style'])
  const resolved = useSidebarFrameStyles('groupLabel', local)

  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sidebar-frame-group-label"
      {...rest}
      {...resolved.styles.groupLabel}
    >
      {local.children}
    </Dynamic>
  )
}

/** Main application content region that drives `scrolled` from scroll offset. */
export function SidebarFrameMain(props: SidebarFrameT.MainProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'onScroll'])
  const resolved = useSidebarFrameStyles('main', local)

  return (
    <div
      data-slot="sidebar-frame-main"
      {...rest}
      {...resolved.styles.main}
      onScroll={(event) => {
        const result = callHandler(event, local.onScroll)
        if (!result.defaultPrevented) {
          context.setScrolled(event.currentTarget.scrollTop > context.scrollThreshold)
        }
      }}
    >
      {local.children}
    </div>
  )
}
