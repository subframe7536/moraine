import type { JSX } from '@solidjs/web'
import { createSignal, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { GroupProvider } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'
/**
 * Labelled group (`role="group"`) of related `BaseSelect.Item` parts. Place it inside
 * `BaseSelect.Listbox` and add a `BaseSelect.GroupLabel` to name it; the group is linked to its
 * label with `aria-labelledby`. Renders a `div`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[{ label: 'Solid', value: 'solid' }]}>
 *   <BaseSelect.Trigger>Choose a framework</BaseSelect.Trigger>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Group>
 *         <BaseSelect.GroupLabel>Frameworks</BaseSelect.GroupLabel>
 *         <BaseSelect.Item item={{ label: 'Solid', value: 'solid' }} />
 *       </BaseSelect.Group>
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
export function BaseSelectGroup(props: BaseSelectT.GroupProps): JSX.Element {
  const state = useSelectContext()
  const [labelId, setLabelId] = createSignal<string>()
  const local = pick(props, 'class', 'style')
  const rest = omit(props, 'class', 'style')
  const {
    slots: { group: groupSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'group',
    context: state.recipeContext,
  })
  return (
    <GroupProvider value={{ labelId, setLabelId }}>
      <div
        role="group"
        data-slot={state.slotName('group')}
        {...groupSlot}
        {...rest}
        aria-labelledby={labelId() ?? props['aria-labelledby']}
      >
        {props.children}
      </div>
    </GroupProvider>
  )
}
