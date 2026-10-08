import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { EmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export function EmptyTitle<T extends ValidComponent = 'div'>(
  props: EmptyT.TitleProps<T>,
): JSX.Element {
  return <EmptyPart slot="title" fallback="div" {...props} />
}
