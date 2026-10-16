import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { mergePopperElementProps } from '../../overlay/base/popper'
import { pickSlotOverrides, useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'

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
    'href',
    'class',
    'style',
  ])
  const { slots } = useRecipe(navigationMenuRecipe, local, {
    slot: 'link',
    contextSlots: () => pickSlotOverrides(context.options),
  })
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
  const linkProps = mergeProps(attributes, {
    get id() {
      return local.id
    },
    get role() {
      return disabled() ? 'link' : rest.role
    },
    get 'aria-disabled'() {
      return disabled() ? true : undefined
    },
    get 'aria-current'() {
      return local.active ? 'page' : rest['aria-current']
    },
    'data-slot': 'navigation-menu-link',
    'data-moraine-navigation-menu-control': '',
    ...navigationMenuDataAttributes.link({ active: () => local.active, disabled }),
    ...slots.link,
  })
  return (
    <Show when={local.linkRender} keyed fallback={<a {...linkProps} />}>
      {(linkRender) => renderWithProps(linkRender, linkProps)}
    </Show>
  )
}
