import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectLabel(props: BaseSelectT.LabelProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const labelResolved = () => context.resolved.slot('label')

  return (
    <span
      data-slot="label"
      aria-hidden="true"
      {...rest}
      class={cn(labelResolved().class, local.class)}
      style={{
        ...toStyleObject(labelResolved().style),
        ...toStyleObject(local.style),
      }}
    >
      {local.children}
    </span>
  )
}

export const BaseSelectGroupLabel = BaseSelectLabel
