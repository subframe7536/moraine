import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'

import { useSidebarFrameContext, useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

export function SidebarFrameMain<T extends ValidComponent = 'div'>(
  props: SidebarFrameT.MainProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style', 'onScroll'])
  const resolved = useSidebarFrameStyles('main', local)

  return (
    <Dynamic
      component={(local.as ?? 'div') as ValidComponent}
      data-slot="sidebar-frame-main"
      {...(rest as object)}
      {...resolved.styles.main}
      onScroll={(event: UIEvent & { currentTarget: HTMLElement }) => {
        const result = callHandler(event, local.onScroll)
        if (!result.defaultPrevented) {
          context.setScrolled(event.currentTarget.scrollTop > context.scrollThreshold)
        }
      }}
    >
      {local.children}
    </Dynamic>
  )
}
