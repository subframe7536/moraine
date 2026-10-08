import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { CardPart } from './card-part'
import type { CardT } from './card.types'

export function CardTitle<T extends ValidComponent = 'div'>(
  props: CardT.TitleProps<T>,
): JSX.Element {
  return <CardPart slot="title" fallback="div" {...props} />
}
