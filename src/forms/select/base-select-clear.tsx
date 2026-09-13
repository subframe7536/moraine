import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import { useCn } from '../../shared/provider'
import { callHandler } from '../../shared/utils'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectClear(props: BaseSelectT.ClearProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'icon', 'class', 'style', 'onClick'])
  const clearResolved = () => context.resolved.slot('clear')

  return (
    <button
      type="button"
      data-slot="clear"
      aria-label="Clear selection"
      tabIndex={-1}
      disabled={context.field.disabled() || context.field.readOnly()}
      {...rest}
      class={cn(clearResolved().class, local.class)}
      style={{
        ...toStyleObject(clearResolved().style),
        ...toStyleObject(local.style),
      }}
      onPointerDown={(event: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        context.focusInput()
      }}
      onClick={(event: MouseEvent) => {
        event.stopPropagation()
        if (context.field.disabled() || context.field.readOnly()) {
          return
        }
        context.clear()
        callHandler(event, local.onClick)
      }}
    >
      {local.children ?? <Icon name={local.icon ?? 'icon-close'} />}
    </button>
  )
}
