import type { JSX } from 'solid-js'

import type { ValidComponent } from '../../shared/types'

import { CardPart } from './card-part'
import type { CardT } from './card.types'

export function CardHeader<T extends ValidComponent = 'div'>(
  props: CardT.HeaderProps<T>,
): JSX.Element {
  return <CardPart slot="header" fallback="div" {...props} />
}
