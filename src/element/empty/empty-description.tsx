import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { EmptyPart } from './empty-part'
import type { EmptyT } from './empty.types'

export function EmptyDescription<T extends ValidComponent = 'p'>(
  props: EmptyT.DescriptionProps<T>,
): JSX.Element {
  return <EmptyPart slot="description" fallback="p" {...props} />
}
