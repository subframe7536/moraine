import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { createId } from '../../shared/utils'

import { NavigationMenuItemProvider, useNavigationMenuContext } from './navigation-menu-context'
import type { NavigationMenuItemContextValue } from './navigation-menu-context'
import { navigationMenuDataAttributes, navigationMenuRecipe } from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuItem(props: NavigationMenuT.ItemProps): JSX.Element {
  const context = useNavigationMenuContext()
  const [local, rest] = splitProps(props, [
    'value',
    'disabled',
    'children',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'item',
    inheritedStyles: () => context.options,
  })
  const value = createId(() => local.value, 'navigation-menu-item')
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>()
  const [content, setContent] = createSignal<HTMLDivElement>()
  const [contentTrees, setContentTrees] = createSignal<JSX.Element[]>([])
  const [triggerOptions, setTriggerOptions] = createSignal<NavigationMenuT.TriggerProps>()
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
      <li
        {...rest}
        data-slot="navigation-menu-item"
        {...navigationMenuDataAttributes.item({
          disabled: item.disabled,
          expanded: () => context.open() && context.activeItem() === item,
        })}
        {...resolved.styles.item}
      >
        {local.children}
      </li>
    </NavigationMenuItemProvider>
  )
}
