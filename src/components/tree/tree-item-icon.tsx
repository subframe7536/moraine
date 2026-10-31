import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { Icon } from '../icon'

import { useTreeContext, useTreeItemContext } from './tree-context'
import { treeDataAttributes, treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Prefix icon of the item. */
export function TreeItemIcon(props: TreeT.ItemIconProps): JSX.Element {
  const [local, rest] = splitProps(props, ['icon', 'class', 'style'])
  const item = useTreeItemContext()!.item
  const context = useTreeContext()
  const {
    slots: { icon: iconSlot },
  } = useRecipe(treeRecipe, local, {
    slot: 'icon',
    data: {
      icon: treeDataAttributes.icon({
        expanded: () => item.isExpanded,
        leaf: () => item.isLeaf,
      }),
    },
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  return <Icon name={local.icon} data-slot="tree-icon" {...iconSlot} {...rest} />
}
