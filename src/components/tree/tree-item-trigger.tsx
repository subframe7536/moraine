import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
import { Icon } from '../icon'

import { useTreeContext, useTreeItemContext } from './tree-context'
import { TREE_TRIGGER_ICON_CLASS, treeDataAttributes, treeRecipe } from './tree.recipe'
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
  const item = useTreeItemContext()!.item
  // The treeitem is the only tab stop. Keep custom hosts out of the tab order, and stop a button
  // host from acting as a form's implicit submit button.
  const ownedHostAttributes = () => {
    const host = local.as
    if (host === undefined || host === 'span') {
      return undefined
    }
    return host === 'button' ? { tabIndex: -1, type: 'button' as const } : { tabIndex: -1 }
  }
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(treeRecipe, local, {
    slot: 'trigger',
    data: {
      trigger: treeDataAttributes.trigger({
        expanded: () => item.isExpanded,
        leaf: () => item.isLeaf,
        loading: () => item.isLoading,
      }),
    },
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  return (
    <Show when={context.options.trigger !== false}>
      <Dynamic
        component={local.as ?? 'span'}
        data-slot="tree-trigger"
        aria-hidden={true}
        {...triggerSlot}
        {...rest}
        {...ownedHostAttributes()}
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
              data-slot="tree-trigger-icon"
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
