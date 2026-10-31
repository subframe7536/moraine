import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useTablePart } from './table-part'
import { TABLE_TEXT_ALIGN_CLASS } from './table.recipe'
import type { TableT } from './table.types'

export function TableHead(props: TableT.HeadProps): JSX.Element {
  const [local, rest] = splitProps(props, ['align', 'truncated', 'class', 'style'])
  // Always set the alignment: a `th` outside `thead` would otherwise fall back to the
  // browser's centered default.
  const { head: headSlot } = useTablePart('head', local, {
    own: () => ({
      class: [TABLE_TEXT_ALIGN_CLASS[local.align ?? 'left'], local.truncated && 'truncate'],
    }),
  })

  return <th data-slot="table-head" {...headSlot} {...rest} />
}
