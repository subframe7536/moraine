import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/** Main application content region beside the sidebar panel. */
export function SidebarInset<T extends ValidComponent = 'main'>(
  props: SidebarT.InsetProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'onScroll'])
  const resolved = useSidebarStyles('inset', local)

  return (
    <Dynamic
      component={(local.as ?? 'main') as ValidComponent}
      data-slot="sidebar-inset"
      {...(rest as object)}
      {...resolved.slots.inset}
      onScroll={(event: UIEvent & { currentTarget: HTMLElement }) => {
        const result = callHandler(event, local.onScroll)
        if (!result.defaultPrevented) {
          context.setScrolled(event.currentTarget.scrollTop > context.scrollThreshold)
        }
      }}
    />
  )
}
