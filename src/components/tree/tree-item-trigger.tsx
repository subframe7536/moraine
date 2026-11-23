import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import { Show, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { callHandler, pick } from '../../shared/utils'
import { Icon } from '../icon'

import { useTreeContext, useTreeItemContext } from './tree-context'
import { TREE_TRIGGER_ICON_CLASS, treeDataAttributes, treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'
/**
 * Expand chevron of the surrounding `tree.Item`; clicking it toggles the branch. It is hidden from
 * assistive technology and out of the tab order because the `treeitem` owns expansion, invisible
 * on leaves, and shows the tree's `loadingIcon` while a lazy branch loads. Renders a `span`; pass
 * `as` for another element.
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
 *       <tree.ItemTrigger icon="i-lucide:chevron-right" />
 *       <tree.ItemLabel />
 *     </tree.Item>
 *   )}
 * />
 * ```
 */
export function TreeItemTrigger<T extends ValidComponent = 'span'>(
  props: TreeT.ItemTriggerProps<T>,
): JSX.Element {
  const local = pick(
    props as TreeT.ItemTriggerProps,
    'as',
    'icon',
    'children',
    'class',
    'style',
    'onClick',
  )
  const rest = omit(
    props as TreeT.ItemTriggerProps,
    'as',
    'icon',
    'children',
    'class',
    'style',
    'onClick',
  )
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
        expanded: () => item.expanded,
        leaf: () => item.leaf,
        loading: () => item.loading,
      }),
    },
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  return (
    <Dynamic
      component={local.as ?? 'span'}
      data-slot="tree-trigger"
      aria-hidden={'true'}
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
              item.loading
                ? (context.props.loadingIcon ?? 'icon-loading')
                : (local.icon ?? (context.props.expandIcon || 'icon-chevron-right'))
            }
            data-slot="tree-trigger-icon"
            class={TREE_TRIGGER_ICON_CLASS}
          />
        }
      >
        {local.children}
      </Show>
    </Dynamic>
  )
}
