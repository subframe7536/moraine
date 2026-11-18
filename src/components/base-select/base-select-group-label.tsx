import type { JSX } from 'solid-js'
import { createEffect, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createId } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { useGroupContext } from './base-select-group-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

/**
 * Visible heading for a `BaseSelect.Group`. Place it inside the group, before its items; it
 * registers its `id` as the group's accessible label. Renders a `div`.
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
export function BaseSelectGroupLabel(props: BaseSelectT.GroupLabelProps): JSX.Element {
  const state = useSelectContext()
  const group = useGroupContext()
  const id = createId(() => props.id, 'select-group-label')
  const [local, rest] = splitProps(props, ['class', 'style'])
  const {
    slots: { groupLabel: groupLabelSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'groupLabel',
    context: state.recipeContext,
  })
  createEffect(
    on(id, (value) => {
      group?.setLabelId(value)
      onCleanup(() => group?.setLabelId(undefined))
    }),
  )
  return (
    <div data-slot={state.slotName('groupLabel')} {...groupLabelSlot} {...rest} id={id()}>
      {props.children}
    </div>
  )
}
