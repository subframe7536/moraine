import type { JSX } from '@solidjs/web'
import { Show, merge, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { pick } from '../../shared/utils'
import { mergePopperElementProps } from '../shared/overlay/popper'

import { useNavigationMenuContext, useNavigationMenuItemContext } from './navigation-menu-context'
import {
  navigationMenuControlData,
  navigationMenuDataAttributes,
  navigationMenuRecipe,
} from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'
/**
 * Navigation destination, rendered as an `a`. Place it inside `NavigationMenu.Content` or
 * directly inside a `NavigationMenu.Item`. `active` marks the current page with
 * `aria-current="page"`, clicking it closes the open panel unless `closeOnSelect` is `false`, and
 * `linkRender` swaps in a router link component.
 *
 * @example
 * ```tsx
 * import { NavigationMenu } from 'moraine'
 *
 * <NavigationMenu aria-label="Main navigation">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Link href="/docs" active>
 *         Documentation
 *       </NavigationMenu.Link>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 * ```
 */
export function NavigationMenuLink(props: NavigationMenuT.LinkProps): JSX.Element {
  const context = useNavigationMenuContext()
  const item = useNavigationMenuItemContext()
  const local = pick(
    props,
    'id',
    'active',
    'disabled',
    'closeOnSelect',
    'linkRender',
    'href',
    'class',
    'style',
  )
  const rest = omit(
    props,
    'id',
    'active',
    'disabled',
    'closeOnSelect',
    'linkRender',
    'href',
    'class',
    'style',
  )
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
  const attributes = merge(
    mergePopperElementProps<HTMLAnchorElement>(
      {
        onClick: (event) => {
          if (disabled()) {
            event.preventDefault()
          } else if (local.closeOnSelect !== false) {
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
      get tabindex() {
        return disabled() ? -1 : rest.tabindex
      },
    },
  )
  const linkProps = merge(
    attributes,
    {
      get id() {
        return local.id
      },
      get role() {
        return disabled() ? 'link' : rest.role
      },
      get 'aria-disabled'() {
        return disabled() ? 'true' : undefined
      },
      get 'aria-current'() {
        return local.active ? 'page' : rest['aria-current']
      },
      'data-slot': 'navigation-menu-link',
      ...navigationMenuControlData,
    },
    linkSlot,
  )
  return (
    <Show when={local.linkRender} keyed fallback={<a {...linkProps} />}>
      {(linkRender) => renderWithProps(linkRender, linkProps as NavigationMenuT.LinkRenderProps)}
    </Show>
  )
}
