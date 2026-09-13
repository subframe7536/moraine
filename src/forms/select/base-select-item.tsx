import type { JSX } from 'solid-js'
import { createMemo, onCleanup, splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'
import { callHandler, callRef } from '../../shared/utils'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectItem(props: BaseSelectT.ItemProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'value',
    'disabled',
    'children',
    'class',
    'style',
    'ref',
    'onClick',
    'onPointerMove',
    'onPointerDown',
  ])

  const registration = {}
  const registeredItem = (): BaseSelectT.Item =>
    ({
      value: local.value,
      disabled: local.disabled,
      label: typeof local.children === 'string' ? local.children : undefined,
      key: local.value !== undefined ? String(local.value) : undefined,
      __baseSelectRegistration: registration,
    }) as BaseSelectT.Item
  // oxlint-disable-next-line subf/solid-reactivity -- BaseSelect consumes this accessor in its normalized-options memo.
  const unregister = context.registerItem(registeredItem)
  onCleanup(unregister)

  const option = createMemo(() => context.getRegisteredOption(registeredItem))
  const itemKey = () => option()?.id ?? ''
  const isSelected = createMemo(() =>
    local.value !== undefined ? context.selectedValues().includes(local.value) : false,
  )
  const isHighlighted = createMemo(() => context.highlightedKey() === itemKey())
  const itemResolved = () => context.resolved.slot('item')

  return (
    <div
      id={context.getOptionId(itemKey())}
      role="option"
      tabIndex={-1}
      data-slot="item"
      data-disabled={local.disabled ? '' : undefined}
      data-highlighted={isHighlighted() ? '' : undefined}
      data-selected={isSelected() ? '' : undefined}
      aria-disabled={local.disabled || undefined}
      aria-selected={isSelected() ? 'true' : 'false'}
      {...rest}
      ref={(element) => callRef(local.ref, element)}
      class={cn(itemResolved().class, local.class)}
      style={{
        ...toStyleObject(itemResolved().style),
        ...toStyleObject(local.style),
      }}
      onPointerMove={(event: PointerEvent) => {
        callHandler(event, local.onPointerMove)
        if (!event.defaultPrevented && event.pointerType === 'mouse' && !local.disabled) {
          context.setHighlightedKey(itemKey())
        }
      }}
      onPointerDown={(event: PointerEvent) => {
        callHandler(event, local.onPointerDown)
        if (
          !event.defaultPrevented &&
          event.pointerType !== 'touch' &&
          event.pointerType !== 'pen'
        ) {
          event.preventDefault()
        }
      }}
      onClick={(event: MouseEvent) => {
        callHandler(event, local.onClick)
        if (event.defaultPrevented || local.disabled) {
          return
        }

        context.setHighlightedKey(itemKey())
        const targetOption = option()
        if (targetOption) {
          context.selectOption(targetOption)
        }
      }}
    >
      {local.children}
    </div>
  )
}
