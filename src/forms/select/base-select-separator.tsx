import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectSeparator(props: BaseSelectT.SeparatorProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, ['class', 'style'])
  const separatorResolved = () => context.resolved.slot('separator')

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      data-slot="separator"
      {...rest}
      class={cn(separatorResolved().class, local.class)}
      style={{
        ...toStyleObject(separatorResolved().style),
        ...toStyleObject(local.style),
      }}
    />
  )
}
