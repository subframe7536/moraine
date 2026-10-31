import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'

import { useSidebarStyles } from './sidebar-context'
import type { SidebarT } from './sidebar.types'

/** Section heading within a sidebar group. */
export function SidebarGroupLabel<T extends ValidComponent = 'div'>(
  props: SidebarT.GroupLabelProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const {
    slots: { groupLabel: groupLabelSlot },
  } = useSidebarStyles('groupLabel', local)

  return (
    <Dynamic
      component={local.as ?? 'div'}
      data-slot="sidebar-group-label"
      {...groupLabelSlot}
      {...rest}
    />
  )
}
