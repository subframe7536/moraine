import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { OverlayMenu } from '../shared/overlay/menu'

import { useContextMenuContext } from './context-menu-context'
import { contextMenuRecipe } from './context-menu.recipe'
import type { ContextMenuT } from './context-menu.types'

/**
 * Popup list of actions for the surrounding `ContextMenu`, described by the `items` model: items,
 * groups, separators, checkbox and radio items, and nested submenus. Place it inside `ContextMenu`;
 * it renders in an overlay when open. Use `topRender`, `bottomRender`, and `itemRender` for custom
 * headers, footers, and item presentation.
 *
 * @example
 * ```tsx
 * import { ContextMenu } from 'moraine'
 *
 * <ContextMenu>
 *   <ContextMenu.Trigger>Right-click here</ContextMenu.Trigger>
 *   <ContextMenu.Content
 *     items={[
 *       { label: 'Back' },
 *       { label: 'Reload' },
 *       { type: 'separator' },
 *       { label: 'Forward', disabled: true },
 *     ]}
 *   />
 * </ContextMenu>
 * ```
 */
export function ContextMenuContent(props: ContextMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'topRender',
    'bottomRender',
    'checkedIcon',
    'submenuIcon',
    'class',
    'style',
  ])
  const context = useContextMenuContext()

  const merged = mergeProps({ checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' }, local)
  const { slots } = useRecipe(contextMenuRecipe, local, {
    slot: 'content',
    context: () => ({ variants: { size: context.size?.() }, ...context.slotOverrides }),
  })
  return (
    <OverlayMenu
      elementAttrs={rest}
      {...context.menuProps}
      owner="context-menu"
      slotBinding={(slot) => slots[slot]}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      topRender={merged.topRender}
      bottomRender={merged.bottomRender}
    />
  )
}
