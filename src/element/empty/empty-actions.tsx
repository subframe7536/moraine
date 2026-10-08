import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { EmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export function EmptyActions<T extends ValidComponent = 'div'>(
  props: EmptyT.ActionsProps<T>,
): JSX.Element {
  return <EmptyPart slot="actions" fallback="div" {...props} />
}
