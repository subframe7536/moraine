import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { EmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export function EmptyMedia<T extends ValidComponent = 'div'>(
  props: EmptyT.MediaProps<T>,
): JSX.Element {
  return <EmptyPart slot="media" fallback="div" {...props} />
}
