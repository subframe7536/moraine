import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { callRef } from '../../shared/utils'
import { sameValue } from '../shared/form/select/collection'
import { scrollIntoViewWithin } from '../shared/overlay/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectListbox(props: BaseSelectT.ListboxProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['class', 'style', 'ref'])
  const {
    slots: { listbox: listboxSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'listbox',
    context: () => ({ variants: { size: state.styleSize }, ...state.slotOverrides }),
  })
  const [listbox, setListbox] = createSignal<HTMLDivElement>()
  createEffect(
    on([state.highlightedValue, state.open, listbox], ([key, open, element]) => {
      if (key === undefined || !open || !element) {
        return
      }
      // oxlint-disable-next-line subf/solid-reactivity -- Scroll only if the same node and highlight remain active in this microtask.
      queueMicrotask(() => {
        if (listbox() !== element || !state.open() || !sameValue(state.highlightedValue(), key)) {
          return
        }
        const item = element.ownerDocument.getElementById(state.itemId(key))
        if (item && element.contains(item)) {
          scrollIntoViewWithin(item, element)
        }
      })
    }),
  )
  return (
    <div
      role="listbox"
      data-slot={state.slotName('listbox')}
      aria-readonly={state.field.readOnly() || undefined}
      aria-multiselectable={state.props.multiple ? 'true' : undefined}
      {...listboxSlot}
      {...rest}
      id={state.listboxId()}
      tabIndex={-1}
      ref={(element) => {
        setListbox(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (listbox() === element) {
            setListbox(undefined)
          }
        })
      }}
    />
  )
}
