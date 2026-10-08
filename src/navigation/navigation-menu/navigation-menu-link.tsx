import type { JSX } from 'solid-js'
import { children as resolveChildren, mergeProps, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { mergePopperElementProps } from '../../overlay/base/popper'
import { createStyles } from '../../provider'

import {
  useNavigationMenuContext,
  useOptionalNavigationMenuItemContext,
} from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuLink(props: NavigationMenuT.LinkProps): JSX.Element {
  const context = useNavigationMenuContext()
  const item = useOptionalNavigationMenuItemContext()
  const [local, rest] = splitProps(props, [
    'id',
    'active',
    'disabled',
    'closeOnClick',
    'linkRender',
    'children',
    'href',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'link',
    inheritedStyles: () => context.options,
  })
  const body = resolveChildren(() => local.children)
  const disabled = () => Boolean(context.options.disabled || item?.disabled() || local.disabled)
  const attributes = mergeProps(
    mergePopperElementProps<HTMLAnchorElement>(
      {
        onClick: (event) => {
          if (disabled()) {
            event.preventDefault()
          } else if (local.closeOnClick) {
            context.close()
          }
        },
        onKeyDown: (event) => {
          if (context.rootElement()?.contains(event.currentTarget)) {
            context.onListKeyDown(event, event.currentTarget)
          }
        },
      },
      rest,
    ),
    {
      get href() {
        return disabled() ? undefined : local.href
      },
      get tabIndex() {
        return disabled() ? -1 : rest.tabIndex
      },
    },
  )
  return (
    <Dynamic
      component={local.linkRender ?? 'a'}
      {...attributes}
      id={local.id}
      role={disabled() ? 'link' : rest.role}
      aria-disabled={disabled() ? true : undefined}
      aria-current={local.active ? 'page' : rest['aria-current']}
      data-slot="navigation-menu-link"
      data-moraine-navigation-menu-control=""
      {...navigationMenuDataAttributes.link({ active: () => local.active, disabled })}
      {...resolved.styles.link}
    >
      {body()}
    </Dynamic>
  )
}
