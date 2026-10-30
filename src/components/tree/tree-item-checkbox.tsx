import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { CheckControl } from '../shared/check-control/check-control'

import { useTreeContext, useTreeItemContext } from './tree-context'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

/**
 * Checkbox bound to the item's check state. The `treeitem` announces the state through
 * `aria-checked` and toggles it with Space, so the control is hidden and out of the tab order.
 */
export function TreeItemCheckbox(props: TreeT.ItemCheckboxProps = {}): JSX.Element {
  const [local, rest] = splitProps(props, ['checkedIcon', 'indeterminateIcon', 'class', 'style'])
  const context = useTreeContext()
  const item = useTreeItemContext()!.item
  const { slots } = useRecipe(treeRecipe, local, {
    slot: 'checkbox',
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
  })

  return (
    <Show when={context.options.checkable}>
      <CheckControl
        slotName="tree-checkbox"
        aria-hidden={true}
        tabIndex={-1}
        {...rest}
        {...slots.checkbox}
        checked={
          item.checkedState === 'indeterminate' ? 'indeterminate' : item.checkedState === 'checked'
        }
        disabled={item.isDisabled}
        checkedIcon={local.checkedIcon}
        indeterminateIcon={local.indeterminateIcon}
        iconSlot={slots.checkboxIcon}
        onCheckedChange={(checked) => context.state.setChecked(item.key, checked)}
      />
    </Show>
  )
}
