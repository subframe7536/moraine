import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { callHandler } from '../../shared/utils'
import { Icon } from '../icon'

import { useTreeContext, useTreeItemContext } from './tree-context'
import { treeDataAttributes, treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Checkbox bound to the item's check state. */
export function TreeItemCheckbox(props: TreeT.ItemCheckboxProps = {}): JSX.Element {
  const [local, rest] = splitProps(props, [
    'checkedIcon',
    'indeterminateIcon',
    'class',
    'style',
    'onClick',
  ])
  const context = useTreeContext()
  const item = useTreeItemContext()!.item
  const merged = mergeProps(
    { checkedIcon: 'icon-check' as const, indeterminateIcon: 'icon-minus' as const },
    local,
  )
  const { slots } = useRecipe(treeRecipe, local, {
    slot: 'checkbox',
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
  })

  const checked = () => item.checkedState === 'checked'
  const unchecked = () => item.checkedState === 'unchecked'
  const indeterminate = () => item.checkedState === 'indeterminate'
  const disabled = () => item.isDisabled

  function toggle(event: MouseEvent): void {
    if (callHandler(event, local.onClick).defaultPrevented || item.isDisabled) {
      return
    }
    context.state.setChecked(item.key, !checked())
  }

  return (
    <Show when={context.options.checkable}>
      <button
        type="button"
        role="checkbox"
        data-slot="tree-checkbox"
        aria-hidden={true}
        tabIndex={-1}
        disabled={disabled()}
        {...treeDataAttributes.checkbox({ checked, unchecked, indeterminate, disabled })}
        {...rest}
        {...slots.checkbox}
        onClick={toggle}
      >
        <Show when={!unchecked()}>
          <Icon
            name={indeterminate() ? merged.indeterminateIcon : merged.checkedIcon}
            slotName="tree-checkbox-icon"
            {...slots.checkboxIcon}
          />
        </Show>
      </button>
    </Show>
  )
}
