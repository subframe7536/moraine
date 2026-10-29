import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useTreePart } from './tree-context'
import type { TreeT } from './tree.types'

/** Trailing actions of the item, shown while the row is hovered or focused. */
export function TreeItemAction(props: TreeT.ItemActionProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const { slots } = useTreePart('action', local)

  return (
    <div data-slot="tree-action" {...rest} {...slots.action}>
      {local.children}
    </div>
  )
}
