import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { OverlayMenu } from '../shared/overlay/menu'

import { useDropdownMenuContext } from './dropdown-menu-context'
import { dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuT } from './dropdown-menu.types'

/**
 * Popup list of actions for the surrounding `DropdownMenu`, described by the `items` model: items,
 * groups, separators, checkbox and radio items, and nested submenus. Place it inside
 * `DropdownMenu`; it renders in an overlay when open. Use `headerRender`, `footerRender`, and
 * `itemRender` for custom headers, footers, and item presentation.
 *
 * @example
 * ```tsx
 * import { Button, DropdownMenu } from 'moraine'
 *
 * <DropdownMenu>
 *   <DropdownMenu.Trigger as={Button}>Actions</DropdownMenu.Trigger>
 *   <DropdownMenu.Content
 *     items={[
 *       { label: 'Edit profile' },
 *       { label: 'Billing details' },
 *       { type: 'separator' },
 *       { label: 'Sign out' },
 *     ]}
 *   />
 * </DropdownMenu>
 * ```
 */
export function DropdownMenuContent(props: DropdownMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'headerRender',
    'footerRender',
    'checkedIcon',
    'submenuIcon',
    'class',
    'style',
  ])
  const context = useDropdownMenuContext()

  const merged = mergeProps({ checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' }, local)
  const { slots } = useRecipe(dropdownMenuRecipe, local, {
    slot: 'content',
    context: () => ({ variants: { size: context.size?.() }, ...context.slotOverrides }),
  })
  return (
    <OverlayMenu
      elementAttrs={rest}
      {...context.menuProps}
      owner="dropdown-menu"
      slotBinding={(slot) => slots[slot]}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      headerRender={merged.headerRender}
      footerRender={merged.footerRender}
    />
  )
}
