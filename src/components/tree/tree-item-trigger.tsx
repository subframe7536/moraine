import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { Icon } from '../icon'

import { useTreeContext, useTreeItem, useTreePart } from './tree-context'
import { TREE_TRIGGER_ICON_CLASS, treeDataAttributes } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Expand affordance. Shows the loading icon while the branch loads its children. */
export function TreeItemTrigger<T extends ValidComponent = 'span'>(
  props: TreeT.ItemTriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as TreeT.ItemTriggerProps, [
    'as',
    'icon',
    'children',
    'class',
    'style',
  ])
  const context = useTreeContext()
  const item = useTreeItem()
  const { slots } = useTreePart('trigger', local)

  return (
    <Show when={context.options.trigger !== false}>
      <Dynamic
        component={local.as ?? 'span'}
        data-slot="tree-trigger"
        {...item.getTriggerProps()}
        {...rest}
        {...slots.trigger}
        {...treeDataAttributes.trigger({
          expanded: () => item.isExpanded,
          leaf: () => !item.hasChildren,
          loading: () => item.isLoading,
        })}
      >
        <Show
          when={local.children}
          fallback={
            <Icon
              name={
                item.isLoading
                  ? (context.props.loadingIcon ?? 'icon-loading')
                  : (local.icon ?? context.props.triggerIcon ?? 'icon-chevron-right')
              }
              slotName="tree-trigger-icon"
              class={TREE_TRIGGER_ICON_CLASS}
            />
          }
        >
          {local.children}
        </Show>
      </Dynamic>
    </Show>
  )
}
