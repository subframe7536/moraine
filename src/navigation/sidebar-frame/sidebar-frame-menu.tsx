import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Section heading within a sidebar menu. */
export function SidebarFrameLabel<T extends ValidComponent = 'div'>(
  props: SidebarFrameT.LabelProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style'])
  const resolved = useSidebarFrameStyles('label', local)

  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sidebar-frame-label"
      {...rest}
      {...resolved.styles.label}
    >
      {local.children}
    </Dynamic>
  )
}
