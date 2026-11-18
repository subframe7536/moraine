import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'

import { useSelectContext } from './base-select-context'
import { baseSelectDataAttributes, baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectT } from './base-select.types'

/**
 * Selectable option (`role="option"`) of `BaseSelect`. Pass the collection entry through `item`;
 * clicking it selects the item. Without children it renders `item.label`; children can instead
 * be a node or a render function receiving `{ item, selected, highlighted, disabled }`. Place it
 * inside `BaseSelect.Listbox` (or a `BaseSelect.Group`). It always renders a `div`.
 *
 * @example
 * ```tsx
 * import { BaseSelect } from 'moraine'
 *
 * <BaseSelect items={[{ label: 'Option A', value: 'a' }]}>
 *   <BaseSelect.Trigger>Choose an option</BaseSelect.Trigger>
 *   <BaseSelect.Content>
 *     <BaseSelect.Listbox>
 *       <BaseSelect.Item item={{ label: 'Option A', value: 'a' }}>
 *         {(state) => (state.selected ? 'Option A (selected)' : 'Option A')}
 *       </BaseSelect.Item>
 *     </BaseSelect.Listbox>
 *   </BaseSelect.Content>
 * </BaseSelect>
 * ```
 */
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
    'onMouseDown',
  ])
  const {
    slots: { item: itemSlot },
  } = useRecipe(baseSelectRecipe, local, {
    slot: 'item',
    data: {
      item: baseSelectDataAttributes.item(() => ({
        selected,
        highlighted,
        disabled,
      })),
    },
    context: state.recipeContext,
  })
  const item = () => local.item
  const selected = () => state.isSelected(item().value)
  const highlighted = () => state.isHighlighted(item().value)
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
      role="option"
      data-slot={state.slotName('item')}
      {...itemSlot}
      {...rest}
      ref={(element) => callRef(local.ref, element)}
      id={state.itemId(item().value)}
      tabIndex={-1}
      aria-selected={selected() ? 'true' : 'false'}
      aria-disabled={disabled() || undefined}
      onPointerMove={(event) => {
        callHandler(event, local.onPointerMove)
        if (
          event.defaultPrevented ||
          event.pointerType !== 'mouse' ||
          disabled() ||
          state.locked() ||
          (event.movementX === 0 && event.movementY === 0)
        ) {
          return
        }
        state.setHighlightedValue(item().value)
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
      onMouseDown={(event) => {
        callHandler(event, local.onMouseDown)
        if (!event.defaultPrevented) {
          event.preventDefault()
        }
      }}
      onClick={(event) => {
        callHandler(event, local.onClick)
        if (!event.defaultPrevented && !disabled() && !state.locked()) {
          state.setHighlightedValue(item().value)
          state.select(item())
        }
      }}
    >
      {resolvedChildren()}
    </div>
  )
}
