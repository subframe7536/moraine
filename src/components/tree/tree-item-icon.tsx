import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Icon } from '../icon'

import { useTreeItem, useTreePart } from './tree-context'
import { treeDataAttributes } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Prefix icon of the item. */
export function TreeItemIcon(props: TreeT.ItemIconProps): JSX.Element {
  const [local, rest] = splitProps(props, ['icon', 'class', 'style'])
  const item = useTreeItem()
  const { slots } = useTreePart('icon', local)

  return (
    <Icon
      name={local.icon}
      slotName="tree-icon"
      {...rest}
      {...slots.icon}
      {...treeDataAttributes.icon({
        expanded: () => item.isExpanded,
        leaf: () => !item.hasChildren,
      })}
    />
  )
}
