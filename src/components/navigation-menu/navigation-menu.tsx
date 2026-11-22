import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { mergePopperElementProps } from '../shared/overlay/popper'

import { NavigationMenuContent } from './navigation-menu-content'
import {
  NavigationMenuProvider,
  createNavigationMenuState,
  isMousePointer,
} from './navigation-menu-context'
import { NavigationMenuItem } from './navigation-menu-item'
import { NavigationMenuLink } from './navigation-menu-link'
import { NavigationMenuList } from './navigation-menu-list'
import { NavigationMenuPanel } from './navigation-menu-panel'
import { NavigationMenuTrigger } from './navigation-menu-trigger'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuProps } from './navigation-menu.types'

/**
 * Website navigation with direct links and expandable link panels that share one animated
 * surface. Use it for site destinations; use `DropdownMenu` for a menu of actions and `Tabs` for
 * peer panels that stay on the same page. Renders a `nav` landmark (give it an `aria-label` when
 * the page has several) and supports one level of panels. The open item is uncontrolled by
 * default or controlled through `value` and `onValueChange`.
 *
 * @example
 * ```tsx
 * import { NavigationMenu } from 'moraine'
 *
 * <NavigationMenu aria-label="Main navigation">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item value="products">
 *       <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *       <NavigationMenu.Content>
 *         <NavigationMenu.Link href="/overview">Overview</NavigationMenu.Link>
 *       </NavigationMenu.Content>
 *     </NavigationMenu.Item>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Link href="/docs">Documentation</NavigationMenu.Link>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 * ```
 */
export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'onValueChange',
    'disabled',
    'orientation',
    'openDelay',
    'closeDelay',
    'placement',
    'align',
    'gutter',
    'shift',
    'overflowPadding',
    'flip',
    'slide',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(navigationMenuRecipe, local, {
    data: {
      root: navigationMenuDataAttributes.root(() => ({
        disabled: () => local.disabled,
        orientation: context.orientation,
      })),
    },
  })
  const context = createNavigationMenuState(local, () => variants.orientation)
  const attributes = mergePopperElementProps<HTMLElement>(
    {
      ref: context.setRootElement,
      onPointerEnter: (event) => {
        if (isMousePointer(event)) {
          context.keepOpen()
        }
      },
      onPointerLeave: (event) => {
        if (isMousePointer(event)) {
          context.scheduleClose(event)
        }
      },
    },
    rest,
  )
  return (
    <NavigationMenuProvider value={context}>
      <nav data-slot="navigation-menu" {...rootSlot} {...attributes} id={context.id()}>
        {local.children}
        <NavigationMenuPanel />
      </nav>
    </NavigationMenuProvider>
  )
}

NavigationMenu.List = NavigationMenuList
NavigationMenu.Item = NavigationMenuItem
NavigationMenu.Trigger = NavigationMenuTrigger
NavigationMenu.Content = NavigationMenuContent
NavigationMenu.Link = NavigationMenuLink
