import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { CardPart } from './card-part'
import type { CardT } from './card.types'

export function CardDescription<T extends ValidComponent = 'p'>(
  props: CardT.DescriptionProps<T>,
): JSX.Element {
  return <CardPart slot="description" fallback="p" {...props} />
}
