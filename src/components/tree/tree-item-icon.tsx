import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'
import { Icon } from '../icon'

import { requireTreeItemContext, useTreeContext } from './tree-context'
import { treeDataAttributes, treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'
/**
 * Prefix icon of the surrounding `tree.Item`, for custom `itemRender` content. The default item
 * renders it from `getItemIcon` instead.
 *
 * @example
 * ```tsx
 * import { createTree } from 'moraine'
 *
 * const tree = createTree<string>({ items: () => ['Docs', 'Src'], getKey: (name) => name })
 *
 * <tree.Tree
 *   aria-label="Folders"
 *   itemRender={(item) => (
 *     <tree.Item item={item}>
 *       <tree.ItemIcon icon={item.expanded ? 'i-lucide:folder-open' : 'i-lucide:folder'} />
 *       <tree.ItemLabel />
 *     </tree.Item>
 *   )}
 * />
 * ```
 */
export function TreeItemIcon(props: TreeT.ItemIconProps): JSX.Element {
  const local = pick(props, 'icon', 'class', 'style')
  const rest = omit(props, 'icon', 'class', 'style')
  const itemContext = requireTreeItemContext()
  const context = useTreeContext()
  const {
    slots: { icon: iconSlot },
  } = useRecipe(treeRecipe, local, {
    slot: 'icon',
    data: {
      icon: treeDataAttributes.icon({
        expanded: () => itemContext.item.expanded,
        leaf: () => itemContext.item.leaf,
      }),
    },
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  return <Icon name={local.icon} data-slot="tree-icon" {...iconSlot} {...rest} />
}
