import type { JSX, ValidComponent } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useCn } from '../../shared/provider'
import { callHandler, callRef } from '../../shared/utils'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectInput<T extends ValidComponent = 'input'>(
  props: BaseSelectT.InputProps<T>,
): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'as',
    'placeholder',
    'children',
    'class',
    'style',
    'ref',
    'onInput',
  ])
  const inputResolved = () => context.resolved.slot('input')

  return (
    <Show
      when={context.isSearchable() || local.as !== undefined}
      fallback={
        <span
          data-slot="input"
          data-placeholder={context.selectedValues().length === 0 ? '' : undefined}
          {...rest}
          class={cn(inputResolved().class, local.class)}
          style={{
            ...toStyleObject(inputResolved().style),
            ...toStyleObject(local.style),
          }}
        >
          {local.children ?? context.displayValue() ?? local.placeholder}
        </span>
      }
    >
      <Dynamic
        component={(local.as as ValidComponent) ?? 'input'}
        data-slot="input"
        placeholder={local.placeholder}
        {...context.inputProps()}
        {...rest}
        ref={(element: HTMLInputElement | undefined) => {
          context.setComboboxRef(element)
          callRef(local.ref, element)
        }}
        class={cn(inputResolved().class, local.class)}
        style={{
          ...toStyleObject(inputResolved().style),
          ...toStyleObject(local.style),
        }}
        onInput={(event: InputEvent) => {
          if (context.field.readOnly()) {
            ;(event.currentTarget as HTMLInputElement).value = context.inputValue()
          } else {
            context.setInputValue((event.currentTarget as HTMLInputElement).value)
          }
          context.onInput(event)
          callHandler(event, local.onInput)
        }}
      />
    </Show>
  )
}
