import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useTreeContext, useTreeItemContext } from './tree-context'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Text of the item. */
export function TreeItemLabel<T extends ValidComponent = 'span'>(
  props: TreeT.ItemLabelProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as TreeT.ItemLabelProps, [
    'as',
    'children',
    'class',
    'style',
  ])
  const item = useTreeItemContext()!.item
  const context = useTreeContext()
  const { slots } = useRecipe(treeRecipe, local, {
    slot: 'label',
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
  })

  return (
    <Dynamic component={local.as ?? 'span'} data-slot="tree-label" {...rest} {...slots.label}>
      <Show when={local.children} fallback={item.textValue}>
        {local.children}
      </Show>
    </Dynamic>
  )
}
