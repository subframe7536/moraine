import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'

import { useTreeItem, useTreePart } from './tree-context'
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
  const item = useTreeItem()
  const { slots } = useTreePart('label', local)

  return (
    <Dynamic component={local.as ?? 'span'} data-slot="tree-label" {...rest} {...slots.label}>
      <Show when={local.children} fallback={item.textValue}>
        {local.children}
      </Show>
    </Dynamic>
  )
}
