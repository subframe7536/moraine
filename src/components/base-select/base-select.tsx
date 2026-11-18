import type { JSX } from 'solid-js'

import { BaseSelectContent } from './base-select-content'
import { SelectProvider, createSelectState, useSelectContext } from './base-select-context'
import { BaseSelectControl } from './base-select-control'
import { BaseSelectEmpty } from './base-select-empty'
import { BaseSelectGroup } from './base-select-group'
import { BaseSelectGroupLabel } from './base-select-group-label'
import { BaseSelectItem } from './base-select-item'
import { BaseSelectListbox } from './base-select-listbox'
import { BaseSelectSeparator } from './base-select-separator'
import { BaseSelectTrigger } from './base-select-trigger'
import type { BaseSelectProps, BaseSelectT } from './base-select.types'

/**
 * Headless selection primitive for a flat navigation collection, composed from `BaseSelect.Trigger`
 * and listbox parts. It renders no DOM of its own and manages selected values (`value`,
 * `defaultValue`, `onValueChange`; always arrays), open state, keyboard navigation, and the native
 * form value when `name` is set. Your application owns filtering, query text, and grouping. For a
 * ready-made field start with `Select`, `Combobox`, or `MultiSelect`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect
 *   items={[
 *     { label: 'Option A', value: 'a' },
 *     { label: 'Option B', value: 'b' },
 *   ]}
 *   defaultValue={['a']}
 * >
 *   <BaseSelect.Control>
 *     <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   </BaseSelect.Control>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }} />
 *       <BaseSelect.Item item={{ label: 'Option B', value: 'b' }} />
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
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
    <SelectProvider value={state}>
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
BaseSelect.useContext = useSelectContext as <
  T extends BaseSelectT.Item = BaseSelectT.Item,
>() => BaseSelectT.Context<T>
