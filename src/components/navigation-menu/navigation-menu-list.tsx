import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'

import { useNavigationMenuContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'
/**
 * Top-level list of `NavigationMenu.Item` entries, rendered as a `ul`. Place it directly inside
 * `NavigationMenu`.
 *
 * @example
 * ```tsx
 * import { NavigationMenu } from 'moraine'
 *
 * <NavigationMenu aria-label="Main navigation">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Link href="/docs">Documentation</NavigationMenu.Link>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 * ```
 */
export function NavigationMenuList(props: NavigationMenuT.ListProps): JSX.Element {
  const context = useNavigationMenuContext()
  const local = pick(props, 'class', 'style')
  const rest = omit(props, 'class', 'style')
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
