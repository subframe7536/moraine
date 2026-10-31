import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useNavigationMenuContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuList(props: NavigationMenuT.ListProps): JSX.Element {
  const context = useNavigationMenuContext()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { list: listSlot },
  } = useRecipe(navigationMenuRecipe, local, {
    slot: 'list',
    data: { list: navigationMenuDataAttributes.list({ orientation: context.orientation }) },
    context: () => ({
      variants: { orientation: context.orientation() },
      classes: context.options.classes,
      styles: context.options.styles,
    }),
  })
  return <ul data-slot="navigation-menu-list" {...listSlot} {...rest} />
}
