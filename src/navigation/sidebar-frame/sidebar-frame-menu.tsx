import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useSidebarFrameContext } from './sidebar-frame-context'
import { sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

/** Container grouping related sidebar navigation items. */
export function SidebarFrameGroup(props: SidebarFrameT.GroupProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'group',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

  return (
    <div data-slot="sidebar-frame-group" {...rest} {...resolved.styles.group}>
      {local.children}
    </div>
  )
}

/** Heading label for a sidebar group. */
export function SidebarFrameGroupLabel<T extends ValidComponent = 'div'>(
  props: SidebarFrameT.GroupLabelProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'groupLabel',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

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

/** Menu container for navigation items. */
export function SidebarFrameMenu(props: SidebarFrameT.MenuProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'menu',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

  return (
    <div data-slot="sidebar-frame-menu" {...rest} {...resolved.styles.menu}>
      {local.children}
    </div>
  )
}
