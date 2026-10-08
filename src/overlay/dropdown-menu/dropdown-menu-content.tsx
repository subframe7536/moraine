import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { OverlayMenu } from '../base/menu'

import { useDropdownMenuContext } from './dropdown-menu-context'
import { dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuT } from './dropdown-menu.types'

export function DropdownMenuContent(props: DropdownMenuT.ContentProps): JSX.Element {
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
  const context = useDropdownMenuContext()

  const merged = mergeProps({ checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' }, local)
  const resolved = createStyles(dropdownMenuRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => context.presentation,
  })
  return (
    <OverlayMenu<DropdownMenuT.Item>
      {...context.menuProps}
      owner="dropdown-menu"
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
