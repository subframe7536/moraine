import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
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
    'onClick',
  ])
  const context = useTreeContext()
  const item = useTreeItem()
  const { slots } = useTreePart('trigger', local)

  return (
    <Show when={context.options.trigger !== false}>
      <Dynamic
        component={local.as ?? 'span'}
        data-slot="tree-trigger"
        aria-hidden={true}
        {...treeDataAttributes.trigger({
          expanded: () => item.isExpanded,
          leaf: () => item.isLeaf,
          loading: () => item.isLoading,
        })}
        {...rest}
        {...slots.trigger}
        onClick={(event: MouseEvent) => {
          const custom = callHandler(event, local.onClick)
          event.preventDefault()
          if (!custom.defaultPrevented) {
            item.toggle()
          }
        }}
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
