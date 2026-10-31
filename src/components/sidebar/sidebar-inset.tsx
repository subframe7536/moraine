import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/** Main application content region beside the sidebar panel. */
export function SidebarInset<T extends ValidComponent = 'main'>(
  props: SidebarT.InsetProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const {
    slots: { inset: insetSlot },
  } = useSidebarStyles('inset', local)

  return (
    <Dynamic
      component={(local.as ?? 'main') as ValidComponent}
      data-slot="sidebar-inset"
      {...insetSlot}
      {...(rest as object)}
    />
  )
}
