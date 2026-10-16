import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { OverlayMenu } from '../base/menu'

import { useDropdownMenuContext } from './dropdown-menu-context'
import { dropdownMenuRecipe } from './dropdown-menu.recipe'
import type { DropdownMenuT } from './dropdown-menu.types'

export function DropdownMenuContent(props: DropdownMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'contentTop',
    'contentBottom',
    'checkedIcon',
    'submenuIcon',
    'class',
    'style',
  ])
  const context = useDropdownMenuContext()

  const merged = mergeProps({ checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' }, local)
  const { slots } = useRecipe(dropdownMenuRecipe, local, {
    slot: 'content',
    contextSlots: () => context.slotOverrides,
    contextVariants: () => ({ size: context.size?.() }),
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
      contentTop={merged.contentTop}
      contentBottom={merged.contentBottom}
    />
  )
}
