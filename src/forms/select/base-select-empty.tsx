import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectEmpty(props: BaseSelectT.EmptyProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const emptyResolved = () => context.resolved.slot('empty')

  return (
    <div
      data-slot="empty"
      {...rest}
      class={cn(emptyResolved().class, local.class)}
      style={{
        ...toStyleObject(emptyResolved().style),
        ...toStyleObject(local.style),
      }}
    >
      {local.children}
    </div>
  )
}
