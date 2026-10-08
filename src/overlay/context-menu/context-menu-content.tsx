import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { OverlayMenu } from '../base/menu'

import { useContextMenuContext } from './context-menu-context'
import { contextMenuRecipe } from './context-menu.recipe'
import type { ContextMenuT } from './context-menu.types'

export function ContextMenuContent(props: ContextMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'itemProps',
    'contentTop',
    'contentBottom',
    'checkedIcon',
    'submenuIcon',
    'size',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const context = useContextMenuContext()

  const merged = mergeProps({ checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' }, local)
  const resolved = createStyles(contextMenuRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => context.presentation,
  })
  return (
    <OverlayMenu<ContextMenuT.Item>
      {...context.menuProps}
      owner="context-menu"
      slotBinding={(slot) => resolved.styles[slot]}
      size={resolved.variants.size ?? undefined}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      contentProps={rest}
      itemProps={merged.itemProps}
      contentTop={merged.contentTop}
      contentBottom={merged.contentBottom}
    />
  )
}
