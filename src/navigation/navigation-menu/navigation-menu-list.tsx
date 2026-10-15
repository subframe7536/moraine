import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { pickSlotOverrides, useRecipe } from '../../provider'

import { useNavigationMenuContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuList(props: NavigationMenuT.ListProps): JSX.Element {
  const context = useNavigationMenuContext()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const { slots } = useRecipe(navigationMenuRecipe, local, {
    slot: 'list',
    contextSlots: () => pickSlotOverrides(context.options),
    contextVariants: () => ({ orientation: context.orientation() }),
  })
  return (
    <ul
      data-slot="navigation-menu-list"
      {...navigationMenuDataAttributes.list({ orientation: context.orientation })}
      {...rest}
      {...slots.list}
    />
  )
}
