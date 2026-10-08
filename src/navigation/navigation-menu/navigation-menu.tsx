import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { mergePopperElementProps } from '../../overlay/base/popper'
import { createStyles } from '../../provider'

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

/** Website navigation with a shared, animated content panel. */
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
  const presentation = createStyles(navigationMenuRecipe, local)
  const context = createNavigationMenuState(local, () => presentation.variants.orientation)
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
      <nav
        {...attributes}
        id={context.id()}
        data-slot="navigation-menu"
        {...navigationMenuDataAttributes.root({
          disabled: () => local.disabled,
          orientation: context.orientation,
        })}
        {...presentation.styles.root}
      >
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
