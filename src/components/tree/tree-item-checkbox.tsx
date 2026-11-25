import type { JSX } from '@solidjs/web'
import { Show, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'
import { CheckControl } from '../shared/check-control/check-control'

import { requireTreeItemContext, useTreeContext } from './tree-context'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'
/**
 * Checkbox bound to the check state of the surrounding `tree.Item`. It renders nothing unless
 * `createTree` has `checkable: true`. The `treeitem` announces the state through `aria-checked`
 * and toggles it with Space, so the control is hidden and out of the tab order.
 *
 * @example
 * ```tsx
 * import { createTree } from 'moraine'
 *
 * const tree = createTree<string>({
 *   items: () => ['Read', 'Write'],
 *   getKey: (name) => name,
 *   checkable: true,
 * })
 *
 * <tree.Tree
 *   aria-label="Permissions"
 *   itemRender={(item) => (
 *     <tree.Item item={item}>
 *       <tree.ItemCheckbox />
 *       <tree.ItemLabel />
 *     </tree.Item>
 *   )}
 * />
 * ```
 */
export function TreeItemCheckbox(props: TreeT.ItemCheckboxProps = {}): JSX.Element {
  const local = pick(props, 'checkedIcon', 'indeterminateIcon', 'class', 'style')
  const rest = omit(props, 'checkedIcon', 'indeterminateIcon', 'class', 'style')
  const context = useTreeContext()
  const itemContext = requireTreeItemContext()
  const {
    slots: { checkbox: checkboxSlot },
  } = useRecipe(treeRecipe, local, {
    slot: 'checkbox',
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
  })

  return (
    <Show when={context.options.checkable}>
      <CheckControl
        slotName="tree-checkbox"
        aria-hidden={'true'}
        tabindex={-1}
        {...checkboxSlot}
        {...rest}
        checked={
          itemContext.item.checkedState === 'indeterminate'
            ? 'indeterminate'
            : itemContext.item.checkedState === 'checked'
        }
        disabled={itemContext.item.disabled}
        checkedIcon={local.checkedIcon}
        indeterminateIcon={local.indeterminateIcon}
        onCheckedChange={(checked) => context.state.setChecked(itemContext.item.key, checked)}
      />
    </Show>
  )
}
