import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { mergePopperElementProps } from '../shared/overlay/popper'

import { useNavigationMenuContext, useNavigationMenuItemContext } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuLink(props: NavigationMenuT.LinkProps): JSX.Element {
  const context = useNavigationMenuContext()
  const item = useNavigationMenuItemContext()
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
  const {
    slots: { link: linkSlot },
  } = useRecipe(navigationMenuRecipe, local, {
    slot: 'link',
    data: {
      link: navigationMenuDataAttributes.link(() => ({ active: () => local.active, disabled })),
    },
    context: () => ({ classes: context.options.classes, styles: context.options.styles }),
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
        onKeyDown: createKeyDownHandler<HTMLAnchorElement>({
          disabled: (event) => !context.rootElement()?.contains(event.currentTarget),
          onUnhandled: (event) => context.onListKeyDown(event, event.currentTarget),
        }),
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
  const linkProps = mergeProps(
    attributes,
    {
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
    },
    linkSlot,
  )
  return (
    <Show when={local.linkRender} keyed fallback={<a {...linkProps} />}>
      {(linkRender) => renderWithProps(linkRender, linkProps)}
    </Show>
  )
}
