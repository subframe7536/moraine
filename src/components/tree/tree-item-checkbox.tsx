import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { Checkbox } from '../checkbox'

import { useTreeContext, useTreeItem } from './tree-context'
import type { TreeT } from './tree.types'

/** Checkbox bound to the item's check state. */
export function TreeItemCheckbox(props: TreeT.ItemCheckboxProps = {}): JSX.Element {
  const [local, rest] = splitProps(props, ['onCheckedChange', 'size'])
  const context = useTreeContext()
  const item = useTreeItem()

  return (
    <Show when={context.options.checkable}>
      <Checkbox
        size={local.size ?? context.variants.size}
        {...rest}
        fieldBind={false}
        tabIndex={-1}
        aria-hidden={true}
        checked={item.checkedState === 'checked'}
        indeterminate={item.checkedState === 'indeterminate'}
        disabled={item.isDisabled}
        onCheckedChange={(checked: boolean) => {
          local.onCheckedChange?.(checked)
          context.state.setChecked(item.key, checked)
        }}
      />
    </Show>
  )
}
