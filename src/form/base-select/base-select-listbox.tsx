import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { scrollIntoViewWithin } from '../../overlay/base/utils'
import { createStyles } from '../../provider/create-styles'
import { callRef } from '../../shared/utils'
import { sameValue } from '../shared/select/collection'

import { useSelectContext } from './base-select-context'
import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectPartProps } from './base-select.types'

export function BaseSelectListbox(props: BaseSelectPartProps): JSX.Element {
  const state = useSelectContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'ref'])
  const resolved = createStyles(baseSelectRecipe, local, {
    rootSlot: 'listbox',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
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
      {...rest}
      id={state.listboxId()}
      role="listbox"
      tabIndex={-1}
      data-slot={state.slotName('listbox')}
      aria-readonly={state.field.readOnly() || undefined}
      aria-multiselectable={state.props.multiple ? 'true' : undefined}
      ref={(element) => {
        setListbox(element)
        callRef(local.ref, element)
        onCleanup(() => {
          if (listbox() === element) {
            setListbox(undefined)
          }
        })
      }}
      {...resolved.styles.listbox}
    >
      {local.children}
    </div>
  )
}
