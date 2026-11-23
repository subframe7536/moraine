import type { JSX } from '@solidjs/web'
import { merge, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'
import { OverlayMenu } from '../shared/overlay/menu'

import { useContextMenuContext } from './context-menu-context'
import { contextMenuRecipe } from './context-menu.recipe'
import type { ContextMenuT } from './context-menu.types'
/**
 * Popup list of actions for the surrounding `ContextMenu`, described by the `items` model: items,
 * groups, separators, checkbox and radio items, and nested submenus. Place it inside `ContextMenu`;
 * it renders in an overlay when open. Use `headerRender`, `footerRender`, and `itemRender` for custom
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
  const local = pick(
    props,
    'items',
    'itemRender',
    'headerRender',
    'footerRender',
    'checkedIcon',
    'expandIcon',
    'class',
    'style',
  )
  const rest = omit(
    props,
    'items',
    'itemRender',
    'headerRender',
    'footerRender',
    'checkedIcon',
    'expandIcon',
    'class',
    'style',
  )
  const context = useContextMenuContext()

  const merged = merge({ checkedIcon: 'icon-check', expandIcon: 'icon-chevron-right' }, local)
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
      expandIcon={merged.expandIcon}
      itemRender={merged.itemRender}
      headerRender={merged.headerRender}
      footerRender={merged.footerRender}
    />
  )
}
