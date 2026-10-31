import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTreeContext } from './tree-context'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Trailing actions of the item, shown while the row is hovered or focused. */
export function TreeItemAction(props: TreeT.ItemActionProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const context = useTreeContext()
  const {
    slots: { action: actionSlot },
  } = useRecipe(treeRecipe, local, {
    slot: 'action',
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  return (
    <div data-slot="tree-action" {...actionSlot} {...rest}>
      {local.children}
    </div>
  )
}
