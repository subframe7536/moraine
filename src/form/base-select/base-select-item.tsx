import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { createStyles } from '../../provider/create-styles'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'
import { sameValue } from '../shared/select/collection'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

export function BaseSelectItem<T extends BaseSelectT.Item>(
  props: BaseSelectT.ItemProps<T>,
): JSX.Element {
  const state = useSelectContext<T>()
  const [local, rest] = splitProps(props, [
    'item',
    'children',
    'class',
    'style',
    'ref',
    'onClick',
    'onPointerMove',
    'onPointerDown',
  ])
  const resolved = createStyles(baseSelectRecipe, local, {
    rootSlot: 'item',
    inheritedStyles: () => state.stylePresentation,
    inheritedVariants: () => ({ size: state.styleSize }),
  })
  const item = () => local.item
  const selected = () => state.value().includes(item().value)
  const highlighted = () => sameValue(state.highlightedValue(), item().value)
  const disabled = () => state.itemDisabled(item())
  const presentation: BaseSelectT.ItemRenderProps<T> = {
    get item() {
      return item()
    },
    get selected() {
      return selected()
    },
    get highlighted() {
      return highlighted()
    },
    get disabled() {
      return disabled()
    },
  }
  const child = resolveChildren(() => local.children as JSX.Element)
  const resolvedChildren = createMemo(() => {
    const value = child()
    if (value === undefined) {
      return item().label
    }
    return renderWithProps(value, presentation)
  })
  return (
    <div
      {...rest}
      ref={(element) => callRef(local.ref, element)}
      id={state.itemId(item().value)}
      role="option"
      tabIndex={-1}
      data-slot={state.slotName('item')}
      aria-selected={selected() ? 'true' : 'false'}
      aria-disabled={disabled() || undefined}
      {...baseSelectDataAttributes.item({
        selected,
        highlighted,
        disabled,
      })}
      {...resolved.styles.item}
      onPointerMove={(event) => {
        callHandler(event, local.onPointerMove)
        if (
          !event.defaultPrevented &&
          event.pointerType === 'mouse' &&
          !disabled() &&
          !state.locked()
        ) {
          state.setHighlightedValue(item().value as any)
        }
      }}
      onPointerDown={(event) => {
        callHandler(event, local.onPointerDown)
        if (
          !event.defaultPrevented &&
          event.pointerType !== 'touch' &&
          event.pointerType !== 'pen'
        ) {
          event.preventDefault()
        }
      }}
      onClick={(event) => {
        callHandler(event, local.onClick)
        if (!event.defaultPrevented && !disabled() && !state.locked()) {
          state.setHighlightedValue(item().value as any)
          state.select(item())
        }
      }}
    >
      {resolvedChildren()}
    </div>
  )
}
