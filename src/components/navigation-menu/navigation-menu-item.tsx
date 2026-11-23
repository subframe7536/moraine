import type { JSX } from '@solidjs/web'
import { createSignal, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createId, pick } from '../../shared/utils'

import { NavigationMenuItemProvider, useNavigationMenuContext } from './navigation-menu-context'
import type { NavigationMenuItemContextValue } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'
/**
 * One entry of a `NavigationMenu.List`, rendered as an `li`. It holds either a
 * `NavigationMenu.Trigger` with its `NavigationMenu.Content` panel, or a direct
 * `NavigationMenu.Link`. `value` identifies the item for controlled `NavigationMenu` state and is
 * generated when omitted.
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
 *   </NavigationMenu.List>
 * </NavigationMenu>
 * ```
 */
export function NavigationMenuItem(props: NavigationMenuT.ItemProps): JSX.Element {
  const context = useNavigationMenuContext()
  const local = pick(props, 'value', 'disabled', 'class', 'style')
  const rest = omit(props, 'value', 'disabled', 'class', 'style')
  const {
    slots: { item: itemSlot },
  } = useRecipe(navigationMenuRecipe, local, {
    slot: 'item',
    data: {
      item: navigationMenuDataAttributes.item(() => ({
        disabled: item.disabled,
        expanded: () => context.open() && context.activeItem() === item,
      })),
    },
    context: () => ({ classes: context.options.classes, styles: context.options.styles }),
  })
  const value = createId(() => local.value, 'navigation-menu-item')
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>()
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [contentTrees, setContentTrees] = createSignal<JSX.Element[]>([], {
    ownedWrite: true,
  })
  const [triggerOptions, setTriggerOptions] = createSignal<NavigationMenuT.TriggerProps | undefined>(
    undefined,
    { ownedWrite: true },
  )
  const item: NavigationMenuItemContextValue = {
    value,
    disabled: () =>
      Boolean(context.options.disabled || local.disabled || triggerOptions()?.disabled),
    trigger,
    setTrigger,
    content,
    setContent,
    contentTrees,
    registerContent: (tree) => {
      setContentTrees((trees) => [...trees, tree])
      return () =>
        queueMicrotask(() => setContentTrees((trees) => trees.filter((node) => node !== tree)))
    },
    setTriggerOptions,
  }
  context.registerItem(item)
  return (
    <NavigationMenuItemProvider value={item}>
      <li data-slot="navigation-menu-item" {...itemSlot} {...rest} />
    </NavigationMenuItemProvider>
  )
}
