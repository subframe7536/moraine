import type { JSX } from '@solidjs/web'
import { createSignal, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { bindElement, publishElement } from '../../shared/element-binding'
import { callRef, pick } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'
/**
 * Optional layout container inside `BaseSelect` that also serves as the floating anchor for
 * `BaseSelect.Content`. It is non-interactive: it does not toggle, own keyboard navigation, or
 * take focus. Without it, `BaseSelect.Content` anchors to the registered focus owner. Renders a
 * `div`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[{ label: 'Option A', value: 'a' }]}>
 *   <BaseSelect.Control>
 *     <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   </BaseSelect.Control>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }} />
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
export function BaseSelectControl(props: BaseSelectT.ControlProps): JSX.Element {
  const state = useSelectContext()
  const local = pick(props, 'class', 'style', 'ref')
  const rest = omit(props, 'class', 'style', 'ref')
  const {
    slots: { control: controlSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'control',
    data: {
      control: baseSelectDataAttributes.control({
        disabled: state.disabled,
        readonly: state.readOnly,
        required: state.required,
        invalid: state.invalid,
        expanded: state.open,
        closed: () => !state.open(),
      }),
    },
    context: state.recipeContext,
  })
  const [element, setElement] = createSignal<HTMLDivElement>()
  bindElement(element, publishElement(state.anchor, state.setAnchor))
  return (
    <div
      data-slot={state.slotName('control')}
      {...controlSlot}
      {...rest}
      ref={(element) => {
        setElement(element)
        callRef(() => local.ref, element)
      }}
    />
  )
}
