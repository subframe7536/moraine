import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { CheckControl } from '../shared/check-control/check-control'

import { useTreeContext, useTreeItemContext } from './tree-context'
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
  const [local, rest] = splitProps(props, ['checkedIcon', 'indeterminateIcon', 'class', 'style'])
  const context = useTreeContext()
  const item = useTreeItemContext()!.item
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
        aria-hidden={true}
        tabIndex={-1}
        {...checkboxSlot}
        {...rest}
        checked={
          item.checkedState === 'indeterminate' ? 'indeterminate' : item.checkedState === 'checked'
        }
        disabled={item.disabled}
        checkedIcon={local.checkedIcon}
        indeterminateIcon={local.indeterminateIcon}
        onCheckedChange={(checked) => context.state.setChecked(item.key, checked)}
      />
    </Show>
  )
}
