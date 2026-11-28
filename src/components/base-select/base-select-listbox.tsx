import type { JSX } from '@solidjs/web'
import { createEffect, createSignal, onFlush, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { sameValue } from '../shared/form/select/collection'
import { scrollIntoViewWithin } from '../shared/overlay/scroll-into-view'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'
/**
 * Scrollable `role="listbox"` container for the options of `BaseSelect`. Place it inside
 * `BaseSelect.Content`; it holds `BaseSelect.Item`, `BaseSelect.Group`, and
 * `BaseSelect.Separator` parts and scrolls the highlighted item into view. Renders a `div`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[{ label: 'Option A', value: 'a' }]}>
 *   <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }} />
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
export function BaseSelectListbox(props: BaseSelectT.ListboxProps): JSX.Element {
  const state = useSelectContext()
  const rest = omit(props, 'class', 'style', 'ref')
  const {
    slots: { listbox: listboxSlot },
  } = useRecipe(baseSelectRecipe, props, {
    slot: 'listbox',
    context: state.recipeContext,
  })
  const [listbox, setListbox] = createSignal<HTMLDivElement>()
  createEffect(
    () => [state.highlightedValue(), state.open(), listbox()],
    ([key, open, element]) => {
      if (key === undefined || !open || !element) {
        return
      }
      let cancelled = false
      onFlush(() => {
        if (
          cancelled ||
          listbox() !== element ||
          !state.open() ||
          !sameValue(state.highlightedValue(), key)
        ) {
          return
        }
        const item = element.ownerDocument.getElementById(state.itemId(key))
        if (item && element.contains(item)) {
          scrollIntoViewWithin(item, element)
        }
      })
      return () => {
        cancelled = true
      }
    },
  )
  return (
    <div
      role="listbox"
      data-slot={state.slotName('listbox')}
      aria-readonly={state.readOnly() ? 'true' : undefined}
      aria-multiselectable={state.props.multiple ? 'true' : undefined}
      {...listboxSlot}
      {...rest}
      id={state.listboxId()}
      tabindex={-1}
      ref={[setListbox, props.ref]}
    />
  )
}
