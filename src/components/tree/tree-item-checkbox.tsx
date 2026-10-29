import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps } from 'solid-js'

import { callHandler } from '../../shared/utils'
import { Icon } from '../icon'

import { useTreeContext, useTreeItemContext, useTreePart } from './tree-context'
import { treeDataAttributes } from './tree.recipe'
import type { TreeT } from './tree.types'

/** Checkbox bound to the item's check state. */
export function TreeItemCheckbox(props: TreeT.ItemCheckboxProps = {}): JSX.Element {
  const [local, rest] = splitProps(props, [
    'onCheckedChange',
    'checkedIcon',
    'indeterminateIcon',
    'size',
    'class',
    'style',
    'onClick',
  ])
  const context = useTreeContext()
  const item = useTreeItemContext()
  const merged = mergeProps(
    { checkedIcon: 'icon-check' as const, indeterminateIcon: 'icon-minus' as const },
    local,
  )
  const { slots } = useTreePart('checkbox', local)

  const checked = () => item.checkedState === 'checked'
  const unchecked = () => item.checkedState === 'unchecked'
  const indeterminate = () => item.checkedState === 'indeterminate'
  const disabled = () => item.isDisabled

  function toggle(event: MouseEvent): void {
    if (callHandler(event, local.onClick).defaultPrevented || item.isDisabled) {
      return
    }
    local.onCheckedChange?.(!checked())
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
