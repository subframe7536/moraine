import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { Show, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'

import { requireTreeItemContext, useTreeContext } from './tree-context'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'
/**
 * Text of the surrounding `tree.Item`: its `label` from `getItemLabel`, or `children` instead.
 * Renders a `span`; pass `as` for another element.
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
 *       <tree.ItemLabel>{item.label.toUpperCase()}</tree.ItemLabel>
 *     </tree.Item>
 *   )}
 * />
 * ```
 */
export function TreeItemLabel<T extends ValidComponent = 'span'>(
  props: TreeT.ItemLabelProps<T>,
): JSX.Element {
  const local = pick(props as TreeT.ItemLabelProps, 'as', 'children', 'class', 'style')
  const rest = omit(props as TreeT.ItemLabelProps, 'as', 'children', 'class', 'style')
  const itemContext = requireTreeItemContext()
  const context = useTreeContext()
  const {
    slots: { label: labelSlot },
  } = useRecipe(treeRecipe, local, {
    slot: 'label',
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  const Root = dynamic<ValidComponent>(() => local.as ?? 'span')

  return (
    <Root data-slot="tree-label" {...labelSlot} {...rest}>
      <Show when={local.children} fallback={itemContext.item.label}>
        {local.children}
      </Show>
    </Root>
  )
}
