import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

/**
 * Decorative divider between options of `BaseSelect`, hidden from assistive technology. Place it
 * inside `BaseSelect.Listbox` between items or groups. Renders a `div`.
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
 * >
 *   <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }} />
 *       <BaseSelect.Separator />
 *       <BaseSelect.Item item={{ label: 'Option B', value: 'b' }} />
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
export function BaseSelectSeparator(props: BaseSelectT.SeparatorProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { separator: separatorSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'separator',
    context: state.recipeContext,
  })
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-slot={state.slotName('separator')}
      {...separatorSlot}
      {...rest}
    />
  )
}
