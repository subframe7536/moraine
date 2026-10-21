import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { OverlayMenu } from '../shared/overlay/menu'

import { useContextMenuContext } from './context-menu-context'
import { contextMenuRecipe } from './context-menu.recipe'
import type { ContextMenuT } from './context-menu.types'

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
    contextSlots: () => context.slotOverrides,
    contextVariants: () => ({ size: context.size?.() }),
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
