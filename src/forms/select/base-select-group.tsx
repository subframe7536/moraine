import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectGroup(props: BaseSelectT.GroupProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const groupResolved = () => context.resolved.slot('group')

  return (
    <div
      role="group"
      data-slot="group"
      {...rest}
      class={cn(groupResolved().class, local.class)}
      style={{
        ...toStyleObject(groupResolved().style),
        ...toStyleObject(local.style),
      }}
    >
      {local.children}
    </div>
  )
}
