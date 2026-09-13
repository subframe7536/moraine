import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'
import { callRef } from '../../shared/utils'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectControl<TItem extends BaseSelectT.Item = BaseSelectT.Item>(
  props: BaseSelectT.ControlProps<TItem>,
): JSX.Element {
  const context = useBaseSelectContext<TItem>()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'ref'])
  const unregister = context.registerControl()
  onCleanup(unregister)
  const controlResolved = () => context.resolved.slot('control')

  const resolvedChildren = () => {
    const ch = local.children
    return typeof ch === 'function' ? ch(context.controlApi) : ch
  }

  return (
    <div
      ref={(element) => {
        context.setControlRef(element)
        callRef(local.ref, element)
      }}
      data-slot="control"
      data-disabled={context.field.disabled() ? '' : undefined}
      data-invalid={context.field.invalid() ? '' : undefined}
      data-required={context.field.required() ? '' : undefined}
      data-readonly={context.field.readOnly() ? '' : undefined}
      {...context.controlProps()}
      {...rest}
      class={cn(controlResolved().class, local.class)}
      style={{
        ...toStyleObject(controlResolved().style),
        ...toStyleObject(local.style),
      }}
    >
      {resolvedChildren()}
    </div>
  )
}
