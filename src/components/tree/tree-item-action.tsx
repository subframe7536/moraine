import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'

import { useTreeContext } from './tree-context'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'
/**
 * Container for trailing actions of an item, placed last inside `tree.Item`. Clicks inside it
 * never select or expand the item. It is always visible; style the `action` slot to reveal it on
 * hover. The default item renders it around `actionRender`.
 *
 * @example
 * ```tsx
 * import { Button, createTree } from 'moraine'
 *
 * const tree = createTree<string>({ items: () => ['Docs', 'Src'], getKey: (name) => name })
 *
 * <tree.Tree
 *   aria-label="Folders"
 *   itemRender={(item) => (
 *     <tree.Item item={item}>
 *       <tree.ItemLabel />
 *       <tree.ItemAction>
 *         <Button size="icon-xs" variant="ghost" leading="i-lucide:plus" aria-label={`Add to ${item.label}`} />
 *       </tree.ItemAction>
 *     </tree.Item>
 *   )}
 * />
 * ```
 */
export function TreeItemAction(props: TreeT.ItemActionProps): JSX.Element {
  const local = pick(props, 'children', 'class', 'style')
  const rest = omit(props, 'children', 'class', 'style')
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
