import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { useNavigationMenuContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuList(props: NavigationMenuT.ListProps): JSX.Element {
  const context = useNavigationMenuContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'classes', 'styles'])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'list',
    inheritedStyles: () => context.options,
    inheritedVariants: () => ({ orientation: context.orientation() }),
  })
  return (
    <ul
      {...rest}
      data-slot="navigation-menu-list"
      {...navigationMenuDataAttributes.list({ orientation: context.orientation })}
      {...resolved.styles.list}
    >
      {local.children}
    </ul>
  )
}
