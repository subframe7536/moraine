import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

/**
 * Placeholder shown only while the current `items` collection of `BaseSelect` is empty, for
 * example when a filter matches nothing. Place it inside `BaseSelect.Content`, next to
 * `BaseSelect.Listbox`. Renders a `div`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[]}>
 *   <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox />
 *     <BaseSelect.Empty>No results</BaseSelect.Empty>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
export function BaseSelectEmpty(props: BaseSelectT.EmptyProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { empty: emptySlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'empty',
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  return (
    <Show when={state.items().length === 0}>
      <div data-slot={state.slotName('empty')} {...emptySlot} {...rest}>
        {props.children}
      </div>
    </Show>
  )
}
