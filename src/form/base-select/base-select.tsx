import type { JSX } from 'solid-js'

import { BaseSelectContent } from './base-select-content'
import { SelectProvider, createSelectState, useSelectContext } from './base-select-context'
import type { SelectState } from './base-select-context'
import { BaseSelectControl } from './base-select-control'
import { BaseSelectEmpty } from './base-select-empty'
import { BaseSelectGroup } from './base-select-group'
import { BaseSelectGroupLabel } from './base-select-group-label'
import { BaseSelectItem } from './base-select-item'
import { BaseSelectListbox } from './base-select-listbox'
import { BaseSelectSeparator } from './base-select-separator'
import { BaseSelectTrigger } from './base-select-trigger'
import type { BaseSelectProps, BaseSelectT } from './base-select.types'

export { useSelectContext }

/** Public selection primitive for a flat navigation collection. */
export function BaseSelect<T extends BaseSelectT.Item = BaseSelectT.Item>(
  props: BaseSelectProps<T>,
): JSX.Element {
  return <BaseSelectRoot {...props} slotOwner="base-select" />
}

export function BaseSelectRoot<T extends BaseSelectT.Item = BaseSelectT.Item>(
  props: BaseSelectProps<T> & { slotOwner: string },
): JSX.Element {
  const state = createSelectState(props, () => props.slotOwner)
  return (
    <SelectProvider value={state as unknown as SelectState<BaseSelectT.Item>}>
      {props.children}
      {state.formControls()}
    </SelectProvider>
  )
}

BaseSelect.Control = BaseSelectControl
BaseSelect.Trigger = BaseSelectTrigger
BaseSelect.Content = BaseSelectContent
BaseSelect.Listbox = BaseSelectListbox
BaseSelect.Item = BaseSelectItem
BaseSelect.Group = BaseSelectGroup
BaseSelect.GroupLabel = BaseSelectGroupLabel
BaseSelect.Separator = BaseSelectSeparator
BaseSelect.Empty = BaseSelectEmpty
BaseSelect.useContext = function useContext<
  T extends BaseSelectT.Item = BaseSelectT.Item,
>(): BaseSelectT.Context<T> {
  return useSelectContext<T>().context
}
